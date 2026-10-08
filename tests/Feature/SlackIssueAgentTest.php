<?php

namespace Tests\Feature;

use App\Jobs\IssueAgent\ProcessSlackIssueJob;
use App\Models\IssueAgentRequest;
use App\Services\IssueAgent\SlackService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class SlackIssueAgentTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'issue-agent.slack.signing_secret' => 'slack-secret',
            'issue-agent.slack.allowed_team_id' => 'T_ALLOWED',
            'issue-agent.slack.allowed_channels' => ['C_ALLOWED'],
            'issue-agent.slack.allowed_users' => [],
            'issue-agent.slack.issue_reaction' => 'bug',
            'issue-agent.slack.reaction_types' => [
                'bug' => 'bug',
                'sparkles' => 'feature',
            ],
            'issue-agent.github.routes' => [
                'C_ALLOWED' => [
                    'owner' => 'company',
                    'repository' => 'kitabak',
                ],
                'C_CLINICS' => [
                    'owner' => 'company',
                    'repository' => 'clinics',
                ],
            ],
        ]);
    }

    public function test_valid_slack_signature_is_accepted(): void
    {
        Queue::fake();

        $this->signedSlackPost([
            'type' => 'url_verification',
            'challenge' => 'challenge-token',
        ])
            ->assertOk()
            ->assertSee('challenge-token', false);
    }

    public function test_invalid_slack_signature_is_rejected(): void
    {
        $body = json_encode(['type' => 'url_verification', 'challenge' => 'x']);

        $this->call('POST', '/api/integrations/slack/events', [], [], [], [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_X_SLACK_REQUEST_TIMESTAMP' => (string) time(),
            'HTTP_X_SLACK_SIGNATURE' => 'v0=bad',
        ], $body)->assertUnauthorized();
    }

    public function test_expired_slack_timestamp_is_rejected(): void
    {
        $this->signedSlackPost([
            'type' => 'url_verification',
            'challenge' => 'old',
        ], time() - 600)->assertUnauthorized();
    }

    public function test_unauthorized_workspace_is_rejected(): void
    {
        Queue::fake();

        $this->signedSlackPost($this->reactionPayload([
            'team_id' => 'T_OTHER',
        ]))->assertForbidden();

        Queue::assertNothingPushed();
    }

    public function test_valid_reaction_event_creates_request_and_queues_job(): void
    {
        Queue::fake();
        config(['issue-agent.slack.bot_token' => 'xoxb-test']);

        Http::fake([
            'slack.com/api/users.info*' => Http::response([
                'ok' => true,
                'user' => [
                    'profile' => [
                        'display_name' => 'Khaldoun',
                    ],
                ],
            ]),
        ]);

        $this->signedSlackPost($this->reactionPayload())
            ->assertOk()
            ->assertJsonPath('ok', true);

        $this->assertDatabaseHas('issue_agent_requests', [
            'slack_event_id' => 'Ev1',
            'slack_team_id' => 'T_ALLOWED',
            'slack_channel_id' => 'C_ALLOWED',
            'slack_message_ts' => '1711111111.000100',
            'slack_user_id' => 'U_MESSAGE_AUTHOR',
            'source' => 'slack',
            'status' => IssueAgentRequest::STATUS_PENDING,
            'github_owner' => 'company',
            'github_repository' => 'kitabak',
        ]);

        $request = IssueAgentRequest::query()->firstOrFail();

        $this->assertSame('Khaldoun', $request->payload['reporter_name']);
        $this->assertSame('U_REPORTER', $request->payload['reactor_user_id']);
        $this->assertSame('bug', $request->payload['requested_issue_type']);

        Queue::assertPushed(ProcessSlackIssueJob::class);
    }

    public function test_routed_channel_is_authorized_and_sets_github_repository(): void
    {
        Queue::fake();
        config(['issue-agent.slack.allowed_channels' => []]);

        $this->signedSlackPost($this->reactionPayload([
            'event_id' => 'EvClinics',
            'event' => [
                'item' => [
                    'channel' => 'C_CLINICS',
                ],
            ],
        ]))
            ->assertOk()
            ->assertJsonPath('ok', true);

        $this->assertDatabaseHas('issue_agent_requests', [
            'slack_event_id' => 'EvClinics',
            'slack_channel_id' => 'C_CLINICS',
            'github_owner' => 'company',
            'github_repository' => 'clinics',
        ]);

        Queue::assertPushed(ProcessSlackIssueJob::class);
    }

    public function test_feature_reaction_event_creates_feature_request(): void
    {
        Queue::fake();

        $this->signedSlackPost($this->reactionPayload([
            'event_id' => 'EvFeature',
            'event' => [
                'reaction' => 'sparkles',
            ],
        ]))
            ->assertOk()
            ->assertJsonPath('ok', true);

        $this->assertDatabaseHas('issue_agent_requests', [
            'slack_event_id' => 'EvFeature',
            'trigger_type' => 'reaction:sparkles',
            'slack_user_id' => 'U_MESSAGE_AUTHOR',
        ]);

        $request = IssueAgentRequest::query()->where('slack_event_id', 'EvFeature')->firstOrFail();

        $this->assertSame('feature', $request->payload['requested_issue_type']);

        Queue::assertPushed(ProcessSlackIssueJob::class);
    }

    public function test_second_supported_reaction_updates_pending_request_for_same_message(): void
    {
        Queue::fake();

        $this->signedSlackPost($this->reactionPayload())
            ->assertOk()
            ->assertJsonPath('ok', true);

        $this->signedSlackPost($this->reactionPayload([
            'event_id' => 'EvFeature',
            'event' => [
                'reaction' => 'sparkles',
            ],
        ]))
            ->assertOk()
            ->assertJsonPath('updated', true);

        $this->assertDatabaseCount('issue_agent_requests', 1);

        $request = IssueAgentRequest::query()->firstOrFail();

        $this->assertSame('reaction:sparkles', $request->trigger_type);
        $this->assertSame('feature', $request->payload['requested_issue_type']);

        Queue::assertPushed(ProcessSlackIssueJob::class, 2);
    }

    public function test_duplicate_slack_event_is_ignored(): void
    {
        Queue::fake();

        $payload = $this->reactionPayload();

        $this->signedSlackPost($payload)->assertOk();
        $this->signedSlackPost($payload)->assertOk()->assertJsonPath('duplicate', true);

        $this->assertDatabaseCount('issue_agent_requests', 1);
        Queue::assertPushed(ProcessSlackIssueJob::class, 1);
    }

    public function test_slack_failure_notification_uses_slack_heading(): void
    {
        config(['issue-agent.slack.bot_token' => 'xoxb-test']);

        Http::fake([
            'slack.com/api/chat.postMessage' => Http::response(['ok' => true]),
        ]);

        app(SlackService::class)->postFailure('C_ALLOWED', '1711111111.000100', 'Slack thread retrieval failed.');

        Http::assertSent(fn ($request) => $request->url() === 'https://slack.com/api/chat.postMessage'
            && str_contains($request['text'], 'Unable to read the Slack report.')
            && str_contains($request['text'], 'Slack could not be reached.'));
    }

    public function test_github_failure_notification_uses_github_heading(): void
    {
        config(['issue-agent.slack.bot_token' => 'xoxb-test']);

        Http::fake([
            'slack.com/api/chat.postMessage' => Http::response(['ok' => true]),
        ]);

        app(SlackService::class)->postFailure('C_ALLOWED', '1711111111.000100', 'GitHub issue creation failed.');

        Http::assertSent(fn ($request) => $request->url() === 'https://slack.com/api/chat.postMessage'
            && str_contains($request['text'], 'Unable to create the GitHub issue.')
            && str_contains($request['text'], 'GitHub rejected the request.'));
    }

    private function signedSlackPost(array $payload, ?int $timestamp = null)
    {
        $timestamp ??= time();
        $body = json_encode($payload, JSON_UNESCAPED_UNICODE);
        $signature = 'v0='.hash_hmac('sha256', 'v0:'.$timestamp.':'.$body, 'slack-secret');

        return $this->call('POST', '/api/integrations/slack/events', [], [], [], [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_ACCEPT' => 'application/json',
            'HTTP_X_SLACK_REQUEST_TIMESTAMP' => (string) $timestamp,
            'HTTP_X_SLACK_SIGNATURE' => $signature,
        ], $body);
    }

    private function reactionPayload(array $overrides = []): array
    {
        return array_replace_recursive([
            'token' => 'verification-token',
            'team_id' => 'T_ALLOWED',
            'api_app_id' => 'A1',
            'event_id' => 'Ev1',
            'type' => 'event_callback',
            'event' => [
                'type' => 'reaction_added',
                'user' => 'U_REPORTER',
                'item_user' => 'U_MESSAGE_AUTHOR',
                'reaction' => 'bug',
                'item' => [
                    'type' => 'message',
                    'channel' => 'C_ALLOWED',
                    'ts' => '1711111111.000100',
                ],
                'event_ts' => '1711111112.000100',
            ],
        ], $overrides);
    }
}
