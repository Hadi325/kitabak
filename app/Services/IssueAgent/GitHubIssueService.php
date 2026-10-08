<?php

namespace App\Services\IssueAgent;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class GitHubIssueService
{
    public function createIssue(GeneratedIssue $issue, IssueReportData $report): array
    {
        [$owner, $repository] = $this->repository($report);

        $payload = [
            'title' => $issue->title,
            'body' => $issue->toMarkdown($report),
            'labels' => $issue->labels(),
        ];

        $assignees = config('issue-agent.github.assignees', []);

        if (count($assignees) > 0) {
            $payload['assignees'] = $assignees;
        }

        $response = Http::withToken($this->token())
            ->accept('application/vnd.github+json')
            ->withHeaders(['X-GitHub-Api-Version' => '2022-11-28'])
            ->post($this->url("/repos/{$owner}/{$repository}/issues"), $payload);

        if ($response->failed()) {
            throw new RuntimeException('GitHub issue creation failed.');
        }

        return [
            'number' => (int) $response->json('number'),
            'url' => (string) $response->json('html_url'),
        ];
    }

    public function addComment(int $issueNumber, string $body): void
    {
        $owner = (string) config('issue-agent.github.owner');
        $repository = (string) config('issue-agent.github.repository');

        $response = Http::withToken($this->token())
            ->accept('application/vnd.github+json')
            ->post($this->url("/repos/{$owner}/{$repository}/issues/{$issueNumber}/comments"), [
                'body' => $body,
            ]);

        if ($response->failed()) {
            throw new RuntimeException('GitHub comment creation failed.');
        }
    }

    public function searchIssues(string $query): array
    {
        [$owner, $repository] = $this->repository();

        $response = Http::withToken($this->token())
            ->accept('application/vnd.github+json')
            ->get($this->url('/search/issues'), [
                'q' => trim($query)." repo:{$owner}/{$repository} type:issue state:open",
            ]);

        if ($response->failed()) {
            throw new RuntimeException('GitHub issue search failed.');
        }

        return $response->json('items', []);
    }

    private function token(): string
    {
        $token = (string) config('issue-agent.github.token');

        if ($token !== '') {
            return $token;
        }

        $installationId = (string) config('issue-agent.github.installation_id');

        if ($installationId === '') {
            throw new RuntimeException('GitHub credentials are not configured.');
        }

        return Cache::remember("issue-agent.github-installation-token.{$installationId}", 3300, function () use ($installationId) {
            $response = Http::withToken($this->jwt())
                ->accept('application/vnd.github+json')
                ->post($this->url("/app/installations/{$installationId}/access_tokens"));

            if ($response->failed()) {
                throw new RuntimeException('GitHub App token exchange failed.');
            }

            return (string) $response->json('token');
        });
    }

    private function repository(?IssueReportData $report = null): array
    {
        $owner = (string) ($report?->metadata['github_owner'] ?? config('issue-agent.github.owner'));
        $repository = (string) ($report?->metadata['github_repository'] ?? config('issue-agent.github.repository'));

        if ($owner === '' || $repository === '') {
            throw new RuntimeException('GitHub repository is not configured.');
        }

        return [$owner, $repository];
    }

    private function jwt(): string
    {
        $appId = (string) config('issue-agent.github.app_id');
        $privateKey = str_replace('\n', "\n", (string) config('issue-agent.github.private_key'));

        if ($appId === '' || $privateKey === '') {
            throw new RuntimeException('GitHub App credentials are not configured.');
        }

        $header = $this->base64UrlEncode(json_encode(['alg' => 'RS256', 'typ' => 'JWT'], JSON_THROW_ON_ERROR));
        $payload = $this->base64UrlEncode(json_encode([
            'iat' => time() - 60,
            'exp' => time() + 540,
            'iss' => $appId,
        ], JSON_THROW_ON_ERROR));

        openssl_sign("{$header}.{$payload}", $signature, $privateKey, OPENSSL_ALGO_SHA256);

        return "{$header}.{$payload}.".$this->base64UrlEncode($signature);
    }

    private function base64UrlEncode(string $value): string
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }

    private function url(string $path): string
    {
        return rtrim((string) config('issue-agent.github.api_url'), '/').$path;
    }
}
