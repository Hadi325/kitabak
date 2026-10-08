<?php

namespace App\Http\Controllers\Api\Slack;

use App\Http\Controllers\Controller;
use App\Jobs\IssueAgent\ProcessSlackIssueJob;
use App\Models\IssueAgentRequest;
use App\Services\IssueAgent\SlackService;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;

class SlackEventController extends Controller
{
    public function __construct(private readonly SlackService $slack)
    {
    }

    public function __invoke(Request $request): JsonResponse|Response
    {
        Log::info('Slack webhook received', [
            'request_type' => $request->input('type'),
            'team_id' => $request->input('team_id'),
            'event_id' => $request->input('event_id'),
            'event_type' => $request->input('event.type'),
            'reaction' => $request->input('event.reaction'),
            'item_type' => $request->input('event.item.type'),
            'channel' => $request->input('event.item.channel'),
        ]);

        if ($request->input('type') === 'url_verification') {
            Log::info('Slack URL verification challenge accepted');

            return response((string) $request->input('challenge'), 200)
                ->header('Content-Type', 'text/plain');
        }

        if ($request->input('type') !== 'event_callback') {
            Log::info('Slack webhook ignored: unsupported request type', [
                'request_type' => $request->input('type'),
                'event_id' => $request->input('event_id'),
            ]);

            return response()->json(['ok' => true]);
        }

        $teamId = (string) $request->input('team_id');

        if (! $this->authorizedTeam($teamId)) {
            Log::warning('Slack webhook rejected: unauthorized workspace', [
                'team_id' => $teamId,
                'event_id' => $request->input('event_id'),
            ]);

            return response()->json(['message' => 'Unauthorized Slack workspace.'], 403);
        }

        $event = $request->input('event', []);

        if (($event['type'] ?? null) !== 'reaction_added') {
            Log::info('Slack event ignored: not a reaction_added event', [
                'event_id' => $request->input('event_id'),
                'event_type' => $event['type'] ?? null,
            ]);

            return response()->json(['ok' => true]);
        }

        $reaction = (string) ($event['reaction'] ?? '');
        $reactionTypes = $this->reactionTypes();

        if (! array_key_exists($reaction, $reactionTypes)) {
            Log::info('Slack event ignored: reaction mismatch', [
                'event_id' => $request->input('event_id'),
                'reaction' => $reaction,
                'expected_reactions' => array_keys($reactionTypes),
            ]);

            return response()->json(['ok' => true]);
        }

        $item = $event['item'] ?? [];

        if (($item['type'] ?? null) !== 'message') {
            Log::info('Slack event ignored: reaction item is not a message', [
                'event_id' => $request->input('event_id'),
                'item_type' => $item['type'] ?? null,
            ]);

            return response()->json(['ok' => true]);
        }

        $channel = (string) ($item['channel'] ?? '');
        $messageTs = (string) ($item['ts'] ?? '');
        $reactor = (string) ($event['user'] ?? '');
        $user = (string) ($event['item_user'] ?? $reactor);

        if (! $this->authorizedChannel($channel)) {
            Log::warning('Slack webhook rejected: unauthorized channel', [
                'event_id' => $request->input('event_id'),
                'team_id' => $teamId,
                'channel' => $channel,
                'allowed_channels' => config('issue-agent.slack.allowed_channels', []),
            ]);

            return response()->json(['message' => 'Unauthorized Slack source.'], 403);
        }

        if (! $this->authorizedUser($reactor)) {
            Log::warning('Slack webhook rejected: unauthorized user', [
                'event_id' => $request->input('event_id'),
                'team_id' => $teamId,
                'channel' => $channel,
                'user' => $reactor,
            ]);

            return response()->json(['message' => 'Unauthorized Slack source.'], 403);
        }

        $payload = $request->all();
        $payload['reporter_name'] = rescue(fn () => $this->slack->userDisplayName($user), null, report: false);
        $payload['reporter_user_id'] = $user;
        $payload['reactor_user_id'] = $reactor;
        $payload['requested_issue_type'] = $reactionTypes[$reaction];
        $githubRepository = $this->githubRepositoryForChannel($channel);
        $payload['github_owner'] = $githubRepository['owner'];
        $payload['github_repository'] = $githubRepository['repository'];

        $existing = IssueAgentRequest::query()
            ->where('source', 'slack')
            ->where('slack_team_id', $teamId)
            ->where('slack_channel_id', $channel)
            ->where('slack_message_ts', $messageTs)
            ->first();

        if ($existing) {
            if ($existing->slack_event_id === $request->input('event_id')) {
                Log::info('Duplicate Slack issue event ignored', [
                    'request_id' => $existing->id,
                    'event_id' => $request->input('event_id'),
                    'team_id' => $teamId,
                    'channel' => $channel,
                    'message_ts' => $messageTs,
                ]);

                return response()->json(['ok' => true, 'duplicate' => true]);
            }

            Log::info('Slack issue trigger matched existing request', [
                'request_id' => $existing->id,
                'event_id' => $request->input('event_id'),
                'team_id' => $teamId,
                'channel' => $channel,
                'message_ts' => $messageTs,
                'existing_status' => $existing->status,
                'reaction' => $reaction,
                'requested_issue_type' => $reactionTypes[$reaction],
            ]);

            if (in_array($existing->status, [
                IssueAgentRequest::STATUS_PENDING,
                IssueAgentRequest::STATUS_FAILED,
                IssueAgentRequest::STATUS_NEEDS_CLARIFICATION,
            ], true)) {
                $existing->forceFill([
                    'slack_user_id' => $user,
                    'trigger_type' => 'reaction:'.$reaction,
                    'status' => IssueAgentRequest::STATUS_PENDING,
                    'github_owner' => $githubRepository['owner'],
                    'github_repository' => $githubRepository['repository'],
                    'payload' => $payload,
                    'error_message' => null,
                    'processed_at' => null,
                ])->save();

                ProcessSlackIssueJob::dispatch($existing->id);

                return response()->json(['ok' => true, 'updated' => true]);
            }

            return response()->json(['ok' => true, 'existing' => true]);
        }

        try {
            $issueRequest = IssueAgentRequest::query()->create([
                'slack_event_id' => $request->input('event_id'),
                'slack_team_id' => $teamId,
                'slack_channel_id' => $channel,
                'slack_message_ts' => $messageTs,
                'slack_thread_ts' => $messageTs,
                'slack_user_id' => $user,
                'trigger_type' => 'reaction:'.$reaction,
                'source' => 'slack',
                'status' => IssueAgentRequest::STATUS_PENDING,
                'github_owner' => $githubRepository['owner'],
                'github_repository' => $githubRepository['repository'],
                'payload' => $payload,
            ]);
        } catch (QueryException $exception) {
            Log::info('Duplicate Slack issue event ignored', [
                'event_id' => $request->input('event_id'),
                'team_id' => $teamId,
                'channel' => $channel,
                'message_ts' => $messageTs,
            ]);

            return response()->json(['ok' => true, 'duplicate' => true]);
        }

        Log::info('Slack issue trigger accepted', [
            'request_id' => $issueRequest->id,
            'event_id' => $request->input('event_id'),
            'team_id' => $teamId,
            'channel' => $channel,
            'message_ts' => $messageTs,
            'user' => $user,
            'reactor' => $reactor,
            'reaction' => $reaction,
            'requested_issue_type' => $reactionTypes[$reaction],
        ]);

        ProcessSlackIssueJob::dispatch($issueRequest->id);

        return response()->json(['ok' => true]);
    }

    private function authorizedTeam(string $teamId): bool
    {
        $allowed = (string) config('issue-agent.slack.allowed_team_id');

        return $allowed === '' || hash_equals($allowed, $teamId);
    }

    private function authorizedChannel(string $channel): bool
    {
        $allowed = config('issue-agent.slack.allowed_channels', []);
        $routed = array_keys(config('issue-agent.github.routes', []));
        $allowed = array_values(array_unique(array_merge($allowed, $routed)));

        return count($allowed) === 0 || in_array($channel, $allowed, true);
    }

    private function authorizedUser(string $user): bool
    {
        $allowed = config('issue-agent.slack.allowed_users', []);

        return count($allowed) === 0 || in_array($user, $allowed, true);
    }

    private function reactionTypes(): array
    {
        $types = config('issue-agent.slack.reaction_types', []);

        if (is_array($types) && count($types) > 0) {
            return $types;
        }

        return [
            config('issue-agent.slack.issue_reaction', 'bug') => 'bug',
        ];
    }

    private function githubRepositoryForChannel(string $channel): array
    {
        $routes = config('issue-agent.github.routes', []);
        $route = is_array($routes) ? ($routes[$channel] ?? []) : [];

        return [
            'owner' => (string) ($route['owner'] ?? config('issue-agent.github.owner')),
            'repository' => (string) ($route['repository'] ?? config('issue-agent.github.repository')),
        ];
    }
}
