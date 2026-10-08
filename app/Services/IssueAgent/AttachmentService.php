<?php

namespace App\Services\IssueAgent;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

class AttachmentService
{
    public function collectSlackFiles(array $files, OpenAIService $openAI): array
    {
        $attachments = [];

        foreach ($files as $file) {
            $attachment = $this->downloadSlackFile($file);

            if ($attachment === null) {
                continue;
            }

            if ($this->isAudio((string) $attachment['mime_type'])) {
                $attachment['transcription'] = $openAI->transcribe($attachment['local_path'], $attachment['mime_type']);
            }

            if (in_array($attachment['mime_type'], config('issue-agent.attachments.image_mime_types', []), true)) {
                $attachment['kind'] = 'image';
                $attachment['data_url'] = 'data:'.$attachment['mime_type'].';base64,'.base64_encode(file_get_contents($attachment['local_path']));
                $attachment['public_path'] = $this->storePublicImage($attachment['local_path'], $attachment['name']);
                $attachment['public_url'] = Storage::disk($this->publicDisk())->url($attachment['public_path']);
            }

            $attachments[] = $attachment;
        }

        return $attachments;
    }

    public function cleanup(array $attachments): void
    {
        foreach ($attachments as $attachment) {
            $path = $attachment['local_path'] ?? null;

            if (is_string($path) && is_file($path)) {
                @unlink($path);
            }
        }
    }

    private function downloadSlackFile(array $file): ?array
    {
        $mimeType = (string) ($file['mimetype'] ?? $file['filetype'] ?? '');
        $size = (int) ($file['size'] ?? 0);
        $url = (string) ($file['url_private_download'] ?? $file['url_private'] ?? '');

        if ($url === '' || ! $this->allowedMime($mimeType) || $size > (int) config('issue-agent.attachments.max_file_size')) {
            return null;
        }

        $response = Http::withToken((string) config('issue-agent.slack.bot_token'))
            ->timeout(60)
            ->get($url);

        if ($response->failed()) {
            throw new RuntimeException('Slack file download failed.');
        }

        $extension = pathinfo((string) ($file['name'] ?? ''), PATHINFO_EXTENSION) ?: 'bin';
        $path = storage_path('app/issue-agent/'.Str::uuid().'.'.$extension);

        if (! is_dir(dirname($path))) {
            mkdir(dirname($path), 0775, true);
        }

        file_put_contents($path, $response->body());

        return [
            'id' => $file['id'] ?? null,
            'name' => $file['name'] ?? 'Slack file',
            'title' => $file['title'] ?? $file['name'] ?? 'Slack file',
            'mime_type' => $mimeType,
            'size' => $size,
            'url' => $file['permalink'] ?? null,
            'local_path' => $path,
            'kind' => 'file',
        ];
    }

    private function storePublicImage(string $localPath, string $name): string
    {
        $extension = pathinfo($name, PATHINFO_EXTENSION) ?: pathinfo($localPath, PATHINFO_EXTENSION) ?: 'png';
        $path = trim((string) config('issue-agent.attachments.directory', 'issue-agent/attachments'), '/').'/'.Str::uuid().'.'.$extension;

        Storage::disk($this->publicDisk())->put($path, file_get_contents($localPath));

        return $path;
    }

    private function publicDisk(): string
    {
        return (string) config('issue-agent.attachments.disk', config('filesystems.default', 'public'));
    }

    private function allowedMime(string $mimeType): bool
    {
        if (in_array($mimeType, config('issue-agent.attachments.allowed_mime_types', []), true)) {
            return true;
        }

        return $this->isAudio($mimeType);
    }

    private function isAudio(string $mimeType): bool
    {
        foreach (config('issue-agent.attachments.audio_mime_prefixes', []) as $prefix) {
            if (str_starts_with($mimeType, $prefix)) {
                return true;
            }
        }

        return false;
    }
}
