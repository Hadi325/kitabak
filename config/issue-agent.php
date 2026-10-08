<?php

return [
    'slack' => [
        'signing_secret' => env('SLACK_SIGNING_SECRET'),
        'bot_token' => env('SLACK_BOT_TOKEN'),
        'allowed_team_id' => env('SLACK_ALLOWED_TEAM_ID'),
        'allowed_channels' => array_values(array_filter(array_map(
            'trim',
            explode(',', (string) env('SLACK_ALLOWED_CHANNELS', '')),
        ))),
        'allowed_users' => array_values(array_filter(array_map(
            'trim',
            explode(',', (string) env('SLACK_ALLOWED_USERS', '')),
        ))),
        'issue_reaction' => env('SLACK_ISSUE_REACTION', 'bug'),
        'reaction_types' => collect(explode(',', (string) env('SLACK_ISSUE_REACTIONS', 'bug:bug,sparkles:feature')))
            ->mapWithKeys(function (string $pair): array {
                [$reaction, $type] = array_pad(explode(':', trim($pair), 2), 2, null);

                $reaction = trim((string) $reaction);
                $type = trim((string) $type);

                if ($reaction === '' || ! in_array($type, ['bug', 'feature', 'task'], true)) {
                    return [];
                }

                return [$reaction => $type];
            })
            ->all(),
    ],

    'openai' => [
        'api_key' => env('OPENAI_API_KEY'),
        'url' => env('OPENAI_API_URL', 'https://api.openai.com/v1'),
        'model' => env('ISSUE_AGENT_MODEL', env('OPENAI_MODEL', 'gpt-5.6-luna')),
        'transcription_model' => env('ISSUE_AGENT_TRANSCRIPTION_MODEL', 'gpt-4o-mini-transcribe'),
        'timeout' => env('OPENAI_TIMEOUT', 120),
    ],

    'github' => [
        'owner' => env('GITHUB_OWNER'),
        'repository' => env('GITHUB_REPOSITORY'),
        'token' => env('GITHUB_TOKEN'),
        'app_id' => env('GITHUB_APP_ID'),
        'installation_id' => env('GITHUB_INSTALLATION_ID'),
        'private_key' => env('GITHUB_PRIVATE_KEY'),
        'api_url' => env('GITHUB_API_URL', 'https://api.github.com'),
        'labels' => array_values(array_filter(array_map(
            'trim',
            explode(',', (string) env('ISSUE_AGENT_DEFAULT_LABELS', 'slack,ai-generated')),
        ))),
        'assignees' => array_values(array_filter(array_map(
            'trim',
            explode(',', (string) env('ISSUE_AGENT_ASSIGNEES', '')),
        ))),
        'routes' => collect(explode(',', (string) env('ISSUE_AGENT_ROUTES', '')))
            ->mapWithKeys(function (string $pair): array {
                [$channel, $repository] = array_pad(explode(':', trim($pair), 2), 2, null);
                [$owner, $repo] = array_pad(explode('/', trim((string) $repository), 2), 2, null);

                $channel = trim((string) $channel);
                $owner = trim((string) $owner);
                $repo = trim((string) $repo);

                if ($channel === '' || $owner === '' || $repo === '') {
                    return [];
                }

                return [$channel => [
                    'owner' => $owner,
                    'repository' => $repo,
                ]];
            })
            ->all(),
    ],

    'attachments' => [
        'disk' => env('ISSUE_AGENT_ATTACHMENT_DISK', env('FILESYSTEM_DISK', 'public')),
        'directory' => env('ISSUE_AGENT_ATTACHMENT_DIRECTORY', 'issue-agent/attachments'),
        'max_file_size' => (int) env('ISSUE_AGENT_MAX_FILE_SIZE', 10485760),
        'allowed_mime_types' => [
            'image/png',
            'image/jpeg',
            'image/webp',
            'video/mp4',
            'audio/mpeg',
            'audio/mp4',
            'audio/wav',
            'audio/webm',
            'text/plain',
        ],
        'image_mime_types' => [
            'image/png',
            'image/jpeg',
            'image/webp',
        ],
        'audio_mime_prefixes' => [
            'audio/',
        ],
    ],

    'duplicate_detection_enabled' => env('ISSUE_AGENT_DUPLICATE_DETECTION', false),
];
