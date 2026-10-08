<?php

namespace App\Services;

use App\Exceptions\OpenAIRateLimitException;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class OpenAISchoolListAnalyzer
{
    public function analyze(?string $text, array $images = []): array
    {
        $apiKey = (string) config('services.openai.key');
        if ($apiKey === '') {
            throw new RuntimeException('OpenAI is not configured. Add OPENAI_API_KEY to the environment.');
        }

        $content = [['type' => 'input_text', 'text' => $this->prompt()]];
        if (filled($text)) {
            $content[] = ['type' => 'input_text', 'text' => "DOCUMENT TEXT:\n".mb_substr((string) $text, 0, 100000)];
        }
        foreach (array_values($images) as $index => $image) {
            if (! $image instanceof UploadedFile) {
                continue;
            }
            $content[] = ['type' => 'input_text', 'text' => 'DOCUMENT PAGE '.($index + 1)];
            $content[] = $this->imagePart($image);
        }

        try {
            $response = Http::withToken($apiKey)
                ->acceptJson()
                ->timeout((int) config('services.openai.timeout', 120))
                ->retry(2, 300, fn ($exception) => $exception instanceof ConnectionException, throw: false)
                ->post(rtrim((string) config('services.openai.url'), '/').'/responses', [
                    'model' => config('services.openai.model', 'gpt-5.6-luna'),
                    'store' => false,
                    'input' => [['role' => 'user', 'content' => $content]],
                    'reasoning' => ['effort' => 'none'],
                    'max_output_tokens' => 6000,
                    'text' => ['format' => $this->responseFormat()],
                ]);
        } catch (ConnectionException $exception) {
            report($exception);
            throw new RuntimeException('The AI service could not be reached. Check your connection and try again.');
        }

        if ($response->status() === 429) {
            throw new OpenAIRateLimitException($this->retryAfter($response->header('Retry-After'), (string) $response->json('error.message')));
        }
        if ($response->failed()) {
            report(new RuntimeException('OpenAI school-list request failed: '.$response->status().' '.(string) $response->json('error.message')));
            throw new RuntimeException('The AI service could not read this school list. Please try again.');
        }

        $decoded = $this->decode((string) $this->outputText($response->json('output', [])));
        if (! is_array($decoded) || ! is_array($decoded['items'] ?? null)) {
            report(new RuntimeException('OpenAI returned an invalid school-list response.'));
            throw new RuntimeException('The AI service returned an invalid response. Please try again.');
        }

        return [
            'items' => $decoded['items'],
            'extracted_text' => trim((string) ($decoded['extracted_text'] ?? '')),
        ];
    }

    private function prompt(): string
    {
        return <<<'PROMPT'
You are a meticulous multilingual school-list reader. Read the complete supplied school list in Arabic, French, or English and identify only books that students must obtain. Preserve titles and names in their original script.

Return one compact JSON object only, without Markdown:
{"extracted_text":"clean editable transcription","items":[{"raw":"original list row","title":"book title","subject":null,"book_type":null,"part":null,"grade":null,"isbn":null}]}

Rules:
- Understand tables, columns, headings, bullets, and lists spanning several classes or pages.
- Carry the nearest subject and class/grade heading into every following book row.
- grade must be one of 1,2,3,4,5,6,7,8,9,10,11,SE,SV,SG,LH, or null. EB1-EB9 map to 1-9. Lebanese third-secondary branches map to SE (Sociology/Economics), SV (Life Sciences), SG (General Sciences), or LH (Literature/Humanities).
- Separate multiple books printed in one row into separate items.
- Do not include school names, years, notes, instructions, contact details, section headings, or remarks as books.
- title contains only the real book title, not the subject, author, publisher, edition, or grade.
- book_type must be textbook, workbook, or null. Exercise books, activity books, and cahiers d'exercices are workbooks.
- part contains the printed part, volume, tome, or الجزء value, or null. Preserve it even when it also appears in the title.
- isbn contains only a valid ISBN-10 or ISBN-13 when explicitly present; otherwise null. Never invent it.
- extracted_text must be a clean line-by-line transcription useful for manual correction. Format each book as: Subject | Grade | Title | ISBN when available.
- If no book list is visible, return an empty items array and explain what is visible in extracted_text.
PROMPT;
    }

    private function imagePart(UploadedFile $image): array
    {
        $bytes = file_get_contents($image->getRealPath());
        if ($bytes === false) {
            throw new RuntimeException('A document page could not be read.');
        }

        return [
            'type' => 'input_image',
            'image_url' => 'data:'.($image->getMimeType() ?: 'image/jpeg').';base64,'.base64_encode($bytes),
            'detail' => 'high',
        ];
    }

    private function responseFormat(): array
    {
        return [
            'type' => 'json_schema',
            'name' => 'school_list_books',
            'strict' => true,
            'schema' => [
                'type' => 'object',
                'properties' => [
                    'extracted_text' => ['type' => 'string'],
                    'items' => [
                        'type' => 'array',
                        'items' => [
                            'type' => 'object',
                            'properties' => [
                                'raw' => ['type' => 'string'],
                                'title' => ['type' => 'string'],
                                'subject' => ['type' => ['string', 'null']],
                                'book_type' => [
                                    'type' => ['string', 'null'],
                                    'enum' => ['textbook', 'workbook', null],
                                ],
                                'part' => ['type' => ['string', 'null']],
                                'grade' => ['type' => ['string', 'null']],
                                'isbn' => ['type' => ['string', 'null']],
                            ],
                            'required' => ['raw', 'title', 'subject', 'book_type', 'part', 'grade', 'isbn'],
                            'additionalProperties' => false,
                        ],
                    ],
                ],
                'required' => ['extracted_text', 'items'],
                'additionalProperties' => false,
            ],
        ];
    }

    private function outputText(mixed $output): ?string
    {
        if (! is_array($output)) {
            return null;
        }

        foreach ($output as $item) {
            foreach (($item['content'] ?? []) as $content) {
                if (($content['type'] ?? null) === 'output_text' && is_string($content['text'] ?? null)) {
                    return $content['text'];
                }
            }
        }

        return null;
    }

    private function decode(string $raw): ?array
    {
        $decoded = json_decode(trim($raw), true);
        if (is_array($decoded)) {
            return $decoded;
        }
        $start = strpos($raw, '{');
        $end = strrpos($raw, '}');
        if ($start === false || $end === false || $end <= $start) {
            return null;
        }
        $decoded = json_decode(substr($raw, $start, $end - $start + 1), true);

        return is_array($decoded) ? $decoded : null;
    }

    private function retryAfter(?string $header, string $message): int
    {
        if (is_numeric($header)) {
            return max(1, (int) ceil((float) $header));
        }
        if (preg_match('/try again in ([\d.]+)s/i', $message, $matches)) {
            return max(1, (int) ceil((float) $matches[1]));
        }

        return 60;
    }
}
