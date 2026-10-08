<?php

namespace App\Services;

use App\Models\Book;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class BookListAnalyzer
{
    private const SUBJECTS = [
        'francais' => ['francais', 'français', 'french'],
        'anglais' => ['anglais', 'english'],
        'maths' => ['math', 'maths', 'mathematiques', 'mathématiques'],
        'sciences' => ['science', 'sciences'],
        'musique' => ['musique', 'music'],
        'catechese' => ['catechese', 'catéchèse', 'religion'],
        'arabe' => ['arabe', 'arabic', 'عربي', 'العربية'],
        'geographie' => ['geographie', 'géographie', 'geography', 'جغرافيا'],
        'civisme' => ['civisme', 'civic', 'تربية وطنية'],
        'histoire' => ['histoire', 'history', 'تاريخ'],
    ];

    public function analyze(string $text, ?string $gradeOverride = null): array
    {
        $grade = $gradeOverride ?: $this->detectGrade($text);
        $items = $this->extractItems($text, $grade, $gradeOverride !== null);

        return $this->matchItems($items);
    }

    public function analyzeExtractedItems(array $items): array
    {
        $items = collect($items)
            ->filter(fn ($item) => is_array($item) && filled($item['title'] ?? null))
            ->map(fn (array $item) => [
                'id' => (string) Str::uuid(),
                'raw' => mb_substr(trim((string) ($item['raw'] ?? $item['title'])), 0, 1000),
                'title' => mb_substr(trim((string) $item['title']), 0, 255),
                'subject' => filled($item['subject'] ?? null) ? mb_substr(trim((string) $item['subject']), 0, 100) : null,
                'book_type' => in_array($item['book_type'] ?? null, Book::BOOK_TYPES, true) ? $item['book_type'] : null,
                'part' => filled($item['part'] ?? null) ? mb_substr(trim((string) $item['part']), 0, 50) : null,
                'grade' => filled($item['grade'] ?? null) ? mb_substr(trim((string) $item['grade']), 0, 30) : null,
                'isbn' => filled($item['isbn'] ?? null) ? app(IsbnService::class)->normalize((string) $item['isbn']) : null,
            ])
            ->unique(fn (array $item) => $this->normalize($item['title']).'|'.($item['subject'] ?? '').'|'.($item['book_type'] ?? '').'|'.($item['part'] ?? '').'|'.($item['grade'] ?? ''))
            ->take(80)
            ->values();

        return $this->matchItems($items);
    }

    private function matchItems(Collection $items): array
    {
        $catalog = Book::query()
            ->whereHas(
                'listings',
                fn ($query) => $query->where(
                    'status',
                    'available'
                )
            )
            ->with([
                'listings' => fn ($query) => $query
                    ->with('seller:id,name')
                    ->where('status', 'available')
                    ->orderBy('price'),
            ])
            ->get();

        $results = $items->map(fn (array $item) => $this->matchItem($item, $catalog))->values();

        return [
            'grade' => $items->pluck('grade')->filter()->unique()->count() === 1 ? $items->pluck('grade')->filter()->first() : null,
            'grades' => $items->pluck('grade')->filter()->unique()->values(),
            'items' => $results,
            'summary' => [
                'total' => $results->count(),
                'available' => $results->where('status', 'available')->count(),
                'possible' => $results->where('status', 'possible')->count(),
                'unavailable' => $results->where('status', 'unavailable')->count(),
                'not_found' => $results->where('status', 'not_found')->count(),
            ],
        ];
    }

    private function extractItems(string $text, ?string $grade, bool $gradeIsForced): Collection
    {
        $lines = preg_split('/\R/u', str_replace(["\u{2022}", "\u{25CF}", "\u{25AA}"], "\n• ", $text)) ?: [];
        $subject = null;
        $currentGrade = $grade;
        $items = collect();

        foreach ($lines as $line) {
            $line = trim(preg_replace('/\s+/u', ' ', $line) ?? '');
            if ($line === '') {
                continue;
            }

            if (! $gradeIsForced && ($lineGrade = $this->detectGrade($line)) !== null) {
                $currentGrade = $lineGrade;
            }

            $subjectRow = $this->extractLeadingSubject($line);
            if ($subjectRow !== null) {
                $subject = $subjectRow['subject'];
                $line = $subjectRow['remainder'];
            } elseif (($detectedSubject = $this->detectSubject($line)) !== null && mb_strlen($line) < 45) {
                $subject = $detectedSubject;

                continue;
            }

            $line = trim(preg_replace('/^[\-–—•*▪●\d.)\s]+/u', '', $line) ?? $line);
            if ($this->isNoise($line) || mb_strlen($line) < 4) {
                continue;
            }

            // A list row often contains several bullet-separated books after PDF extraction.
            $parts = preg_split('/\s*[•▪●]\s*/u', $line, -1, PREG_SPLIT_NO_EMPTY) ?: [$line];
            foreach ($parts as $part) {
                $part = trim($part);
                if (! $this->looksLikeBook($part)) {
                    continue;
                }

                $items->push([
                    'id' => (string) Str::uuid(),
                    'raw' => $part,
                    'title' => $this->extractTitle($part),
                    'subject' => $subject,
                    'grade' => $currentGrade,
                    'isbn' => $this->extractIsbn($part),
                ]);
            }
        }

        return $items
            ->unique(fn (array $item) => $this->normalize($item['title']).'|'.($item['subject'] ?? ''))
            ->take(80)
            ->values();
    }

    private function matchItem(array $item, Collection $catalog): array
    {
        $ranked = $catalog->map(function (Book $book) use ($item): array {
            $score = $this->score($item, $book);
            $listings = $book->listings->map(fn ($listing) => [
                'id' => $listing->id,
                'price' => (float) $listing->price,
                'location' => $listing->location,
                'seller' => $listing->seller?->name,
                'photo_url' => $listing->photo_url,
            ])->values();

            return [
                'id' => $book->id,
                'title' => $book->title,
                'author' => $book->author,
                'publisher' => $book->publisher,
                'subject' => $book->subject,
                'grade' => $book->grade,
                'edition_year' => $book->edition_year,
                'isbn' => $book->isbn,
                'cover_image_url' => $book->cover_image_url,
                'score' => round($score, 3),
                'listings' => $listings,
                'available_count' => $listings->count(),
                'lowest_price' => $listings->min('price'),
            ];
        })->filter(fn (array $match) => $match['score'] >= 0.58)
            ->sortByDesc('score')
            ->take(5)
            ->values();

        $best = $ranked->first();
        $confident = $best && $best['score'] >= 0.72;
        $available = $ranked->contains(fn (array $match) => $match['score'] >= 0.58 && $match['available_count'] > 0);

        $status = 'not_found';
        $reason = 'no_catalog_match';
        if ($available) {
            $status = $confident ? 'available' : 'possible';
            $reason = $confident ? null : 'needs_confirmation';
        } elseif ($best) {
            $status = $confident ? 'unavailable' : 'possible';
            $reason = $confident ? 'no_available_copy' : 'needs_confirmation';
        }

        return [...$item, 'status' => $status, 'reason' => $reason, 'matches' => $ranked];
    }

    private function score(array $item, Book $book): float
    {
        if ($item['isbn'] && $book->isbn_normalized === $item['isbn']) {
            return 1.0;
        }

        if (
            filled($item['book_type'] ?? null) &&
            filled($book->book_type) &&
            $item['book_type'] !== $book->book_type
        ) {
            return 0.0;
        }

        if (
            filled($item['part'] ?? null) &&
            filled($book->part) &&
            $this->normalize($item['part']) !== $this->normalize($book->part)
        ) {
            return 0.0;
        }

        $wanted = $this->normalize($item['title']);
        $actual = $this->normalize($book->title);
        if ($wanted === '' || $actual === '') {
            return 0.0;
        }

        similar_text($wanted, $actual, $percent);
        $wantedTokens = array_values(array_unique(array_filter(explode(' ', $wanted), fn ($token) => mb_strlen($token) > 2)));
        $actualTokens = array_values(array_unique(array_filter(explode(' ', $actual), fn ($token) => mb_strlen($token) > 2)));
        $overlap = count(array_intersect($wantedTokens, $actualTokens)) / max(1, count($wantedTokens));
        $contains = str_contains($actual, $wanted) || str_contains($wanted, $actual) ? 1 : 0;

        $score = ($percent / 100 * .48) + ($overlap * .37) + ($contains * .15);
        if ($item['subject'] && $this->normalize($book->subject) === $this->normalize($item['subject'])) {
            $score += .05;
        }
        if ($item['grade'] && $this->normalizeGrade($book->grade) === $this->normalizeGrade($item['grade'])) {
            $score += .05;
        }

        return min(1, $score);
    }

    private function detectGrade(string $text): ?string
    {
        if (preg_match('/(?:classe|class|grade|صف)\s*[:\-]?\s*(?:eb\s*)?(\d{1,2}|SE|SV|SG|LH)/iu', $text, $match)) {
            return strtoupper($match[1]);
        }

        return null;
    }

    private function detectSubject(string $line): ?string
    {
        $normalized = $this->normalize($line);
        foreach (self::SUBJECTS as $subject => $aliases) {
            foreach ($aliases as $alias) {
                if ($normalized === $this->normalize($alias)) {
                    return $subject;
                }
            }
        }

        return null;
    }

    private function extractLeadingSubject(string $line): ?array
    {
        foreach (self::SUBJECTS as $subject => $aliases) {
            foreach ($aliases as $alias) {
                if (preg_match('/^'.preg_quote($alias, '/').'\s*[:\-|]?\s+(.+)$/iu', $line, $match) === 1) {
                    $remainder = trim($match[1]);
                    if (mb_strlen($remainder) >= 4) {
                        return ['subject' => $subject, 'remainder' => $remainder];
                    }
                }
            }
        }

        return null;
    }

    private function looksLikeBook(string $line): bool
    {
        return ! $this->isNoise($line)
            && (mb_strlen($line) >= 8)
            && (preg_match('/[\p{L}]{3,}/u', $line) === 1);
    }

    private function isNoise(string $line): bool
    {
        if (preg_match('/^(?:mybooks academy|school book list|required book list|subject\s+required books?|document prepared to test|note\s*:|students may choose|used books must)/iu', $line) === 1) {
            return true;
        }

        return preg_match('/(?:année scolaire|school year|classe\s*[:\-]?\s*(?:eb)?\s*\d|class\s*[:\-]?\s*\d|grade\s*[:\-]?\s*\d|remarques?|facebook|e-?mail|t[ée]l\.?|fax|b\.?p\.?|page \d+|liste des livres|mati[eè]re\s+livres|sign in)/iu', $line) === 1;
    }

    private function extractTitle(string $line): string
    {
        $title = preg_split('/\s+[–—]\s+|\s+-\s+/u', $line, 2)[0] ?? $line;

        return trim($title, " \t\n\r\0\x0B:;,.\"");
    }

    private function extractIsbn(string $line): ?string
    {
        if (preg_match('/(?:ISBN(?:-1[03])?\s*[:]?\s*)?((?:97[89][\s-]?)?\d[\d\s-]{8,16}[\dX])/iu', $line, $match)) {
            return app(IsbnService::class)->normalize($match[1]);
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
}
