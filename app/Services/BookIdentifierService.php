<?php

namespace App\Services;

final class BookIdentifierService
{
    public function __construct(private readonly IsbnService $isbnService) {}

    /** @return array{raw_value: string, normalized_value: string, identifier_type: string, barcode_format: ?string, isbn: ?string}|null */
    public function classify(?string $value, ?string $format = null): ?array
    {
        $raw = trim((string) $value);

        if ($raw === '' || mb_strlen($raw) > 255) {
            return null;
        }

        $isbn = $this->isbnService->normalize($raw);
        $format = $this->normalizeFormat($format);

        if ($isbn !== null) {
            return [
                'raw_value' => $raw,
                'normalized_value' => $isbn,
                'identifier_type' => 'isbn',
                'barcode_format' => $format,
                'isbn' => $isbn,
            ];
        }

        $isbnCandidate = strtoupper((string) preg_replace('/[^0-9X]/i', '', $raw));

        if (preg_match('/^97[89]\d{10}$/', $isbnCandidate) || preg_match('/^\d{9}[\dX]$/', $isbnCandidate)) {
            return null;
        }

        $normalized = $this->normalizeCustom($raw);

        if ($normalized === null) {
            return null;
        }

        return [
            'raw_value' => $raw,
            'normalized_value' => $normalized,
            'identifier_type' => 'custom',
            'barcode_format' => $format,
            'isbn' => null,
        ];
    }

    public function normalizeCustom(?string $value): ?string
    {
        $value = trim((string) $value);

        if ($value === '' || mb_strlen($value) > 255 || preg_match('/[\x00-\x1F\x7F]/u', $value)) {
            return null;
        }

        return mb_strtoupper(preg_replace('/\s+/u', '', $value));
    }

    private function normalizeFormat(?string $format): ?string
    {
        $format = strtoupper(trim((string) $format));

        return $format === '' ? null : substr($format, 0, 32);
    }
}
