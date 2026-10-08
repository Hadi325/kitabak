<?php

namespace App\Services\IssueAgent;

use App\Models\IssueAgentRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class IssueGeneratorService
{
    public function __construct(
        private readonly OpenAIService $openAI,
        private readonly GitHubIssueService $github,
        private readonly SlackService $slack,
        private readonly AttachmentService $attachments,
    ) {
    }

    public function process(IssueAgentRequest $request): void
    {
        $locked = DB::transaction(function () use ($request) {
            $fresh = IssueAgentRequest::query()->lockForUpdate()->findOrFail($request->id);

            if ($fresh->status === IssueAgentRequest::STATUS_COMPLETED && $fresh->github_issue_url) {
                return null;
            }

            if ($fresh->status === IssueAgentRequest::STATUS_PROCESSING) {
                return null;
            }

            $fresh->forceFill([
                'status' => IssueAgentRequest::STATUS_PROCESSING,
                'error_message' => null,
            ])->save();

            return $fresh;
        });

        if (! $locked) {
            return;
        }

        try {
            Log::info('Issue Agent processing started', ['request_id' => $locked->id, 'source' => $locked->source]);

            $report = $locked->source === 'slack'
                ? $this->slackReport($locked)
                : $this->manualReport($locked);

            $issue = $this->openAI->generateIssue($report);

            $locked->forceFill([
                'ai_model' => config('issue-agent.openai.model'),
                'ai_result' => $issue->raw,
            ])->save();

            Log::info('Issue Agent OpenAI call completed', ['request_id' => $locked->id]);

            if (! $issue->actionable) {
                $locked->forceFill([
                    'status' => IssueAgentRequest::STATUS_NEEDS_CLARIFICATION,
                    'error_message' => $issue->rejectionReason,
                    'processed_at' => now(),
                ])->save();

                Log::info('Issue Agent needs clarification', [
                    'request_id' => $locked->id,
                    'reason' => $issue->rejectionReason,
                ]);

                if ($locked->source === 'slack' && $locked->slack_channel_id && $locked->slack_thread_ts) {
                    $this->slack->postClarificationNeeded(
                        $locked->slack_channel_id,
                        $locked->slack_thread_ts,
                        $issue->clarifyingQuestion ?? '',
                    );
                    Log::info('Issue Agent Slack clarification request sent', ['request_id' => $locked->id]);
                }

                return;
            }

            $githubIssue = $this->github->createIssue($issue, $report);

            $locked->forceFill([
                'status' => IssueAgentRequest::STATUS_COMPLETED,
                'github_issue_number' => $githubIssue['number'],
                'github_issue_url' => $githubIssue['url'],
                'processed_at' => now(),
            ])->save();

            Log::info('Issue Agent GitHub issue created', ['request_id' => $locked->id, 'issue' => $githubIssue['number']]);

            if ($locked->source === 'slack' && $locked->slack_channel_id && $locked->slack_thread_ts) {
                $this->slack->postIssueCreated($locked->slack_channel_id, $locked->slack_thread_ts, $githubIssue, $issue->title);
                Log::info('Issue Agent Slack confirmation sent', ['request_id' => $locked->id]);
            }
        } catch (RuntimeException $exception) {
            $locked->markFailed($exception->getMessage());
            Log::warning('Issue Agent processing failed', ['request_id' => $locked->id, 'reason' => $exception->getMessage()]);

            if ($locked->source === 'slack' && $locked->slack_channel_id && $locked->slack_thread_ts) {
                rescue(fn () => $this->slack->postFailure($locked->slack_channel_id, $locked->slack_thread_ts, $exception->getMessage()));
            }
        } finally {
            if (isset($report)) {
                $this->attachments->cleanup($report->attachments);
            }
        }
    }

    private function slackReport(IssueAgentRequest $request): IssueReportData
    {
        $payload = $request->payload ?? [];
        $messages = $this->slack->getThread($request->slack_channel_id, $request->slack_thread_ts ?: $request->slack_message_ts);
        $text = $this->slack->messagesToText($messages);
        $attachments = $this->attachments->collectSlackFiles($this->slack->filesFromMessages($messages), $this->openAI);

        foreach ($attachments as $attachment) {
            if (isset($attachment['transcription'])) {
                $text .= "\n\nVoice transcription from {$attachment['name']}:\n".$attachment['transcription'];
            }
        }

        return new IssueReportData(
            text: $text,
            source: 'Slack Issue Agent',
            reporter: (string) ($payload['reporter_name'] ?? $request->slack_user_id),
            attachments: $attachments,
            metadata: [
                'slack_team_id' => $request->slack_team_id,
                'slack_channel_id' => $request->slack_channel_id,
                'slack_thread_ts' => $request->slack_thread_ts,
                'slack_reporter_user_id' => $request->slack_user_id,
                'slack_reactor_user_id' => $payload['reactor_user_id'] ?? null,
                'trigger_type' => $request->trigger_type,
                'requested_issue_type' => $payload['requested_issue_type'] ?? null,
                'github_owner' => $request->github_owner,
                'github_repository' => $request->github_repository,
                'original_text' => $text,
            ],
        );
    }

    private function manualReport(IssueAgentRequest $request): IssueReportData
    {
        $payload = $request->payload ?? [];
        $text = trim((string) ($payload['text'] ?? ''));

        if ($text === '') {
            throw new RuntimeException('The issue report text is empty.');
        }

        return new IssueReportData(
            text: $text,
            source: (string) ($payload['source'] ?? 'manual'),
            reporter: (string) ($payload['reporter'] ?? 'internal user'),
            attachments: [],
            metadata: [
                'github_owner' => $request->github_owner,
                'github_repository' => $request->github_repository,
                'original_text' => $text,
            ],
        );
    }
}
