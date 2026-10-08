<?php

namespace Tests\Feature;

use App\Models\IssueAgentRequest;
use App\Services\IssueAgent\IssueGeneratorService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class IssueAgentProcessingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'issue-agent.openai.api_key' => 'openai-test',
            'issue-agent.openai.url' => 'https://api.openai.test/v1',
            'issue-agent.openai.model' => 'gpt-test',
            'issue-agent.github.owner' => 'company',
            'issue-agent.github.repository' => 'project',
            'issue-agent.github.token' => 'github-test',
            'issue-agent.github.api_url' => 'https://api.github.test',
            'issue-agent.github.labels' => ['slack', 'ai-generated'],
        ]);
    }

    public function test_valid_ai_result_creates_github_issue(): void
    {
        Http::fake([
            'api.openai.test/*' => Http::response($this->openAIResponse()),
            'api.github.test/*' => Http::response([
                'number' => 428,
                'html_url' => 'https://github.com/company/project/issues/428',
            ], 201),
        ]);

        $request = $this->manualRequest('Checkout quantity becomes zero after deleting another product.');

        app(IssueGeneratorService::class)->process($request);

        $request->refresh();

        $this->assertSame(IssueAgentRequest::STATUS_COMPLETED, $request->status);
        $this->assertSame(428, $request->github_issue_number);
        $this->assertSame('https://github.com/company/project/issues/428', $request->github_issue_url);
        $this->assertSame('gpt-test', $request->ai_model);

        Http::assertSent(fn ($httpRequest) => $httpRequest->url() === 'https://api.github.test/repos/company/project/issues'
            && $httpRequest['title'] === 'Checkout quantity becomes zero after deleting another product'
            && in_array('bug', $httpRequest['labels'], true)
            && $httpRequest->hasHeader('Authorization', 'Bearer github-test'));
    }

    public function test_request_repository_overrides_default_github_repository(): void
    {
        Http::fake([
            'api.openai.test/*' => Http::response($this->openAIResponse()),
            'api.github.test/*' => Http::response([
                'number' => 17,
                'html_url' => 'https://github.com/company/clinics/issues/17',
            ], 201),
        ]);

        $request = $this->manualRequest('Clinics appointment search is broken.');
        $request->forceFill([
            'github_owner' => 'company',
            'github_repository' => 'clinics',
        ])->save();

        app(IssueGeneratorService::class)->process($request);

        Http::assertSent(fn ($httpRequest) => $httpRequest->url() === 'https://api.github.test/repos/company/clinics/issues');
    }

    public function test_malformed_ai_response_is_rejected_safely(): void
    {
        Http::fake([
            'api.openai.test/*' => Http::response([
                'output' => [[
                    'content' => [[
                        'type' => 'output_text',
                        'text' => 'not-json',
                    ]],
                ]],
            ]),
            'api.github.test/*' => Http::response([], 201),
        ]);

        $request = $this->manualRequest('Checkout is broken.');

        app(IssueGeneratorService::class)->process($request);

        $request->refresh();

        $this->assertSame(IssueAgentRequest::STATUS_FAILED, $request->status);
        $this->assertSame('OpenAI returned malformed issue JSON.', $request->error_message);
        $this->assertNull($request->github_issue_url);
    }

    public function test_github_failure_marks_request_as_failed(): void
    {
        Http::fake([
            'api.openai.test/*' => Http::response($this->openAIResponse()),
            'api.github.test/*' => Http::response(['message' => 'Bad credentials'], 401),
        ]);

        $request = $this->manualRequest('Checkout is broken.');

        app(IssueGeneratorService::class)->process($request);

        $request->refresh();

        $this->assertSame(IssueAgentRequest::STATUS_FAILED, $request->status);
        $this->assertSame('GitHub issue creation failed.', $request->error_message);
        $this->assertNull($request->github_issue_url);
    }

    public function test_non_actionable_slack_report_requests_clarification_without_creating_github_issue(): void
    {
        config(['issue-agent.slack.bot_token' => 'xoxb-test']);

        Http::fake([
            'slack.com/api/conversations.replies*' => Http::response([
                'ok' => true,
                'messages' => [[
                    'user' => 'U_REPORTER',
                    'ts' => '1711111111.000100',
                    'text' => 'Okay',
                ]],
            ]),
            'api.openai.test/*' => Http::response($this->nonActionableOpenAIResponse()),
            'slack.com/api/chat.postMessage' => Http::response(['ok' => true]),
            'api.github.test/*' => Http::response(['message' => 'Should not be called'], 500),
        ]);

        $request = IssueAgentRequest::query()->create([
            'source' => 'slack',
            'trigger_type' => 'reaction:bug',
            'status' => IssueAgentRequest::STATUS_PENDING,
            'slack_channel_id' => 'C_ALLOWED',
            'slack_message_ts' => '1711111111.000100',
            'slack_thread_ts' => '1711111111.000100',
            'slack_user_id' => 'U_REPORTER',
            'payload' => [
                'reporter_name' => 'Khaldoun',
            ],
        ]);

        app(IssueGeneratorService::class)->process($request);

        $request->refresh();

        $this->assertSame(IssueAgentRequest::STATUS_NEEDS_CLARIFICATION, $request->status);
        $this->assertNull($request->github_issue_url);
        $this->assertSame(false, $request->ai_result['actionable']);

        Http::assertSent(fn ($httpRequest) => $httpRequest->url() === 'https://slack.com/api/chat.postMessage'
            && str_contains($httpRequest['text'], 'I need a bit more detail'));

        Http::assertNotSent(fn ($httpRequest) => $httpRequest->url() === 'https://api.github.test/repos/company/project/issues');
    }

    public function test_completed_request_does_not_create_duplicate_issue_when_processed_again(): void
    {
        Http::fake();

        $request = $this->manualRequest('Already done.');
        $request->forceFill([
            'status' => IssueAgentRequest::STATUS_COMPLETED,
            'github_issue_number' => 100,
            'github_issue_url' => 'https://github.com/company/project/issues/100',
        ])->save();

        app(IssueGeneratorService::class)->process($request);

        Http::assertNothingSent();
    }

    private function manualRequest(string $text): IssueAgentRequest
    {
        return IssueAgentRequest::query()->create([
            'source' => 'manual',
            'trigger_type' => 'internal_api',
            'status' => IssueAgentRequest::STATUS_PENDING,
            'payload' => [
                'text' => $text,
                'source' => 'manual-test',
                'reporter' => 'Khaldoun',
            ],
        ]);
    }

    private function openAIResponse(): array
    {
        return [
            'output' => [[
                'content' => [[
                    'type' => 'output_text',
                    'text' => json_encode([
                        'title' => 'Checkout quantity becomes zero after deleting another product',
                        'actionable' => true,
                        'type' => 'bug',
                        'platform' => 'web',
                        'module' => 'checkout',
                        'priority' => 'normal',
                        'summary' => 'The checkout quantity resets to zero after another cart product is deleted.',
                        'steps_to_reproduce' => [
                            'Add two products to the cart.',
                            'Change the quantity of one product.',
                            'Delete the other product.',
                        ],
                        'expected_behavior' => 'The selected quantity remains unchanged.',
                        'actual_behavior' => 'The quantity becomes zero.',
                        'additional_information' => null,
                        'suggested_labels' => ['frontend'],
                        'confidence' => 0.92,
                        'rejection_reason' => null,
                        'clarifying_question' => null,
                    ]),
                ]],
            ]],
        ];
    }

    private function nonActionableOpenAIResponse(): array
    {
        return [
            'output' => [[
                'content' => [[
                    'type' => 'output_text',
                    'text' => json_encode([
                        'title' => 'Needs more detail before creating an issue',
                        'actionable' => false,
                        'type' => 'bug',
                        'platform' => null,
                        'module' => null,
                        'priority' => 'normal',
                        'summary' => 'The Slack message does not describe a concrete bug, task, or feature request.',
                        'steps_to_reproduce' => [],
                        'expected_behavior' => null,
                        'actual_behavior' => null,
                        'additional_information' => null,
                        'suggested_labels' => [],
                        'confidence' => 0.98,
                        'rejection_reason' => 'The message is too vague to create a useful GitHub issue.',
                        'clarifying_question' => 'Can you describe what happened, what you expected, and where it happened?',
                    ]),
                ]],
            ]],
        ];
    }
}
