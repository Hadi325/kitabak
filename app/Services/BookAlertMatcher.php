<?php

namespace App\Services;

use App\Models\Book;
use App\Models\BookAlertSubscription;
use Illuminate\Support\Str;

class BookAlertMatcher
{
    public function attributes(array $item, string $locale): array
    {
        $title = trim((string) ($item['title'] ?? ''));
        $subject = $this->nullableString($item['subject'] ?? null);
        $bookType = in_array($item['book_type'] ?? null, Book::BOOK_TYPES, true)
            ? $item['book_type']
            : null;
        $part = $this->nullableString($item['part'] ?? null);
        $grade = $this->nullableString($item['grade'] ?? null);
        $isbn = app(IsbnService::class)->normalize($item['isbn'] ?? null);
        $titleNormalized = $this->normalize($title);
        $subjectNormalized = $this->nullableNormalized($subject);
        $partNormalized = $this->nullableNormalized($part);
        $gradeNormalized = $this->normalizeGrade($grade);

        return [
            'title' => $title,
            'title_normalized' => $titleNormalized,
            'subject' => $subject,
            'subject_normalized' => $subjectNormalized,
            'book_type' => $bookType,
            'part' => $part,
            'part_normalized' => $partNormalized,
            'grade' => $grade,
            'grade_normalized' => $gradeNormalized ?: null,
            'isbn_normalized' => $isbn,
            'fingerprint' => hash('sha256', implode('|', [
                $titleNormalized,
                $subjectNormalized,
                $bookType,
                $partNormalized,
                $gradeNormalized,
                $isbn,
            ])),
            'locale' => in_array($locale, ['en', 'ar', 'fr'], true)
                ? $locale
                : 'en',
            'is_active' => true,
            'notified_at' => null,
            'matched_listing_id' => null,
        ];
    }

    public function matches(BookAlertSubscription $subscription, Book $book): bool
    {
        $bookIsbn = app(IsbnService::class)->normalize($book->isbn);

        if ($subscription->isbn_normalized && $bookIsbn) {
            return hash_equals($subscription->isbn_normalized, $bookIsbn);
        }

        $wantedTitle = $subscription->title_normalized;
        $actualTitle = $this->normalize($book->title);

        if ($wantedTitle === '' || $actualTitle === '') {
            return false;
        }

        $titleScore = $this->titleScore($wantedTitle, $actualTitle);

        if ($titleScore < 0.82) {
            return false;
        }

        $wantedBookType = $subscription->book_type
            ?: $this->inferBookType($wantedTitle);
        $actualBookType = $book->book_type
            ?: $this->inferBookType($actualTitle);

        if ($wantedBookType && $actualBookType && $wantedBookType !== $actualBookType) {
            return false;
        }

        $wantedPart = $subscription->part_normalized
            ?: $this->inferPart($wantedTitle);
        $actualPart = $this->nullableNormalized($book->part)
            ?: $this->inferPart($actualTitle);

        if ($wantedPart && $actualPart && $wantedPart !== $actualPart) {
            return false;
        }

        $wantedGrade = (string) $subscription->grade_normalized;
        $actualGrade = $this->normalizeGrade($book->grade);

        if ($wantedGrade !== '' && $actualGrade !== '' && $wantedGrade !== $actualGrade) {
            return false;
        }

        $wantedSubject = (string) $subscription->subject_normalized;
        $actualSubject = $this->normalize($book->subject);

        if (
            $wantedSubject !== '' &&
            $actualSubject !== '' &&
            $wantedSubject !== $actualSubject &&
            $titleScore < 0.95
        ) {
            return false;
        }

        return true;
    }

    private function titleScore(string $wanted, string $actual): float
    {
        if ($wanted === $actual) {
            return 1.0;
        }

        similar_text($wanted, $actual, $percentage);

        $wantedTokens = $this->tokens($wanted);
        $actualTokens = $this->tokens($actual);
        $overlap = count(array_intersect($wantedTokens, $actualTokens)) /
            max(1, count($wantedTokens));
        $contains = str_contains($actual, $wanted) || str_contains($wanted, $actual)
            ? 1
            : 0;

        return min(1, ($percentage / 100 * 0.55) + ($overlap * 0.3) + ($contains * 0.15));
    }

    private function tokens(string $value): array
    {
        return array_values(array_unique(array_filter(
            explode(' ', $value),
            fn (string $token) => mb_strlen($token) > 2,
        )));
    }

    private function inferBookType(string $normalizedTitle): ?string
    {
        if (preg_match('/\b(workbook|exercise book|activity book|cahier|exercices|تمارين)\b/u', $normalizedTitle)) {
            return 'workbook';
        }

        return null;
    }

    private function inferPart(string $normalizedTitle): ?string
    {
        if (preg_match('/\b(?:part|partie|tome|volume|vol|book)\s*([a-z0-9]+)\b/u', $normalizedTitle, $matches)) {
            return $matches[1];
        }

        if (preg_match('/(?:الجزء|جزء)\s*([\p{L}\p{N}]+)/u', $normalizedTitle, $matches)) {
            return $matches[1];
        }

        return null;
    }

    private function normalize(?string $value): string
    {
        $value = Str::lower(Str::ascii(trim((string) $value)));

        return trim(preg_replace('/[^\p{L}\p{N}]+/u', ' ', $value) ?? '');
    }

    private function normalizeGrade(?string $grade): string
    {
        return strtoupper(preg_replace('/[^A-Z0-9]/i', '', (string) $grade) ?? '');
    }

    private function nullableNormalized(?string $value): ?string
    {
        $normalized = $this->normalize($value);

        return $normalized !== '' ? $normalized : null;
    }

    private function nullableString(mixed $value): ?string
    {
        $value = trim((string) $value);

        return $value !== '' ? $value : null;
    }
}
