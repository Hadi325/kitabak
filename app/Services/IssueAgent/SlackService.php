<?php

namespace App\Services\IssueAgent;

use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class SlackService
{
    public function getThread(string $channel, string $threadTs): array
    {
        $response = Http::withToken($this->botToken())
            ->acceptJson()
            ->get('https://slack.com/api/conversations.replies', [
                'channel' => $channel,
                'ts' => $threadTs,
                'limit' => 100,
            ]);

        if ($response->failed() || $response->json('ok') !== true) {
            throw new RuntimeException('Slack thread retrieval failed.');
        }

        return $response->json('messages', []);
    }

    public function postIssueCreated(string $channel, string $threadTs, array $githubIssue, string $title): void
    {
        $this->postMessage($channel, $threadTs, "✅ GitHub Issue #{$githubIssue['number']} created\n\n{$title}\n\n{$githubIssue['url']}");
    }

    public function postFailure(string $channel, string $threadTs, string $reason): void
    {
        $this->postMessage($channel, $threadTs, "❌ {$this->failureHeading($reason)}\n\nReason:\n".$this->safeReason($reason));
    }

    public function postClarificationNeeded(string $channel, string $threadTs, string $question): void
    {
        $fallback = 'Can you add more detail about what happened, what you expected, and where it happened?';
        $question = trim($question) !== '' ? trim($question) : $fallback;

        $this->postMessage($channel, $threadTs, "I need a bit more detail before creating a GitHub issue.\n\n{$question}");
    }

    public function postMessage(string $channel, string $threadTs, string $text): void
    {
        $response = Http::withToken($this->botToken())
            ->acceptJson()
            ->post('https://slack.com/api/chat.postMessage', [
                'channel' => $channel,
                'thread_ts' => $threadTs,
                'text' => $text,
            ]);

        if ($response->failed() || $response->json('ok') !== true) {
            throw new RuntimeException('Slack confirmation failed.');
        }
    }

    public function userDisplayName(string $user): ?string
    {
        if ($user === '') {
            return null;
        }

        $response = Http::withToken($this->botToken())
            ->acceptJson()
            ->get('https://slack.com/api/users.info', [
                'user' => $user,
            ]);

        if ($response->failed() || $response->json('ok') !== true) {
            return null;
        }

        foreach ([
            'user.profile.display_name_normalized',
            'user.profile.display_name',
            'user.profile.real_name_normalized',
            'user.profile.real_name',
            'user.name',
        ] as $key) {
            $name = trim((string) $response->json($key, ''));

            if ($name !== '') {
                return $name;
            }
        }

        return null;
    }

    public function messagesToText(array $messages): string
    {
        return collect($messages)->map(function (array $message): string {
            $author = (string) Arr::get($message, 'user', 'unknown');
            $ts = (string) Arr::get($message, 'ts', 'unknown');
            $text = trim((string) Arr::get($message, 'text', ''));

            return "[{$ts}] {$author}: {$text}";
        })->filter()->implode("\n\n");
    }

    public function filesFromMessages(array $messages): array
    {
        return collect($messages)
            ->flatMap(fn (array $message) => $message['files'] ?? [])
            ->values()
            ->all();
    }

    private function botToken(): string
    {
        $token = (string) config('issue-agent.slack.bot_token');

        if ($token === '') {
            throw new RuntimeException('Slack bot token is not configured.');
        }

        return $token;
    }

    private function safeReason(string $reason): string
    {
        return match (true) {
            str_contains(strtolower($reason), 'github') => 'GitHub rejected the request.',
            str_contains(strtolower($reason), 'openai') => 'The AI service could not process the report.',
            str_contains(strtolower($reason), 'slack') => 'Slack could not be reached.',
            default => 'The report could not be processed.',
        };
    }

    private function failureHeading(string $reason): string
    {
        $reason = strtolower($reason);

        return match (true) {
            str_contains($reason, 'slack') => 'Unable to read the Slack report.',
            str_contains($reason, 'openai') => 'Unable to generate the GitHub issue.',
            str_contains($reason, 'github') => 'Unable to create the GitHub issue.',
            default => 'Unable to process the issue report.',
        };
    }
}
