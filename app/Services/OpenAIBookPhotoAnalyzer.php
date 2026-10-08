<?php

namespace App\Services;

use App\Exceptions\OpenAIRateLimitException;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class OpenAIBookPhotoAnalyzer
{
    private const LANGUAGES = ['english', 'french', 'arabic'];

    private const GRADES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', 'SE', 'SV', 'SG', 'LH'];

    private const BOOK_TYPES = ['textbook', 'workbook'];

    public function analyze(
    UploadedFile $front,
    ?UploadedFile $back = null,
    string $bookCategory = 'school',
): array
    {
        $apiKey = (string) config('services.openai.key');

        if ($apiKey === '') {
            throw new RuntimeException('OpenAI is not configured. Add OPENAI_API_KEY to the environment.');
        }

        $content = [
            ['type' => 'input_text', 'text' => $this->prompt($bookCategory)],
            ['type' => 'input_text', 'text' => 'IMAGE 1: FRONT COVER'],
            $this->imagePart($front, 'Front cover'),
        ];

        if ($back) {
            $content[] = ['type' => 'input_text', 'text' => 'IMAGE 2: BACK COVER. Carefully inspect any ISBN and the exact value printed beside or beneath every barcode.'];
            $content[] = $this->imagePart($back, 'Back cover');
        }

        $response = Http::withToken($apiKey)
            ->acceptJson()
            ->timeout((int) config('services.openai.timeout', 120))
            ->retry(2, 300, function ($exception, $request) {
                return $exception instanceof ConnectionException;
            }, throw: false)
            ->post(rtrim((string) config('services.openai.url'), '/').'/responses', [
                'model' => config('services.openai.model', 'gpt-5.6-luna'),
                'store' => false,
                'input' => [[
                    'role' => 'user',
                    'content' => $content,
                ]],
                'reasoning' => ['effort' => 'none'],
                'max_output_tokens' => 1200,
                'text' => ['format' => $this->responseFormat()],
            ]);

        if ($response->status() === 429) {
            $retryAfter = $this->retryAfter($response->header('Retry-After'), (string) $response->json('error.message'));
            throw new OpenAIRateLimitException($retryAfter);
        }

        if ($response->failed()) {
            report(new RuntimeException(sprintf(
                'OpenAI request failed with status %d: %s (%s)',
                $response->status(),
                (string) $response->json('error.message', 'Unknown OpenAI error'),
                (string) $response->json('error.code', 'no_code'),
            )));
            throw new RuntimeException('The AI service could not analyze these photos. Please try again.');
        }

        $raw = $this->outputText($response->json('output', []));
        $result = $this->decodeResult($raw);

        if (! is_array($result)) {
            report(new RuntimeException(sprintf(
                'OpenAI returned invalid JSON (status: %s, content_length: %d).',
                (string) $response->json('status', 'unknown'),
                strlen((string) $raw),
            )));
            throw new RuntimeException('The AI service returned an invalid response. Please try again.');
        }

        return $this->normalize($result, $bookCategory);
    }

    private function decodeResult(mixed $raw): ?array
    {
        if (! is_string($raw) || trim($raw) === '') {
            return null;
        }

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

    private function imagePart(UploadedFile $image, string $label): array
    {
        $bytes = file_get_contents($image->getRealPath());

        if ($bytes === false) {
            throw new RuntimeException("The {$label} image could not be read.");
        }

        return [
            'type' => 'input_image',
            'image_url' => 'data:'.($image->getMimeType() ?: 'image/jpeg').';base64,'.base64_encode($bytes),
            'detail' => 'high',
        ];
    }

    private function responseFormat(): array
    {
        $nullableString = ['type' => ['string', 'null']];

        return [
            'type' => 'json_schema',
            'name' => 'book_catalog_metadata',
            'strict' => true,
            'schema' => [
                'type' => 'object',
                'properties' => [
                    'is_book' => ['type' => 'boolean'],
                    'confidence' => ['type' => 'number', 'minimum' => 0, 'maximum' => 1],
                    'title' => $nullableString,
                    'author' => $nullableString,
                    'subject' => $nullableString,
                    'book_type' => [
                        'type' => ['string', 'null'],
                        'enum' => ['textbook', 'workbook', null],
                    ],
                    'part' => $nullableString,
                    'grade' => $nullableString,
                    'grade_evidence' => $nullableString,
                    'publisher' => $nullableString,
                    'language' => $nullableString,
                    'edition_year' => ['type' => ['integer', 'null']],
                    'edition_number' => ['type' => ['integer', 'null']],
                    'isbn' => $nullableString,
                    'barcode' => $nullableString,
                    'warning' => $nullableString,
                ],
                'required' => [
                    'is_book', 'confidence', 'title', 'author', 'subject', 'book_type', 'part', 'grade',
                    'grade_evidence', 'publisher', 'language', 'edition_year', 'edition_number', 'isbn', 'barcode', 'warning',
                ],
                'additionalProperties' => false,
            ],
        ];
    }

private function prompt(string $bookCategory): string
{
    $categoryInstructions = match ($bookCategory) {
        'university' => <<<'TEXT'
The user has explicitly selected UNIVERSITY as the book category.
Analyze this as a university/college/higher-education book.
- subject should be the academic subject or field when clearly visible or directly stated by the title, such as Calculus, Biology, Accounting, Engineering, Computer Science, Economics, or Law.
- book_type must be null.
- grade must be null.
- grade_evidence must be null.
- part may be used only when an explicit volume or part is printed on the book.
- Do not reinterpret the book as a school book or novel. The user's selected category is authoritative.
TEXT,
        'novel' => <<<'TEXT'
The user has explicitly selected NOVEL as the book category.
Analyze this as a novel or literary book.
- subject must be null.
- book_type must be null.
- grade must be null.
- grade_evidence must be null.
- part may be used only when an explicit volume or part is printed on the book.
- Focus especially on title, author, publisher, language, edition information, ISBN, and barcode.
- Do not reinterpret the book as a school or university book. The user's selected category is authoritative.
TEXT,
        default => <<<'TEXT'
The user has explicitly selected SCHOOL as the book category.
Analyze this as a school book.
- subject is the school subject, for example Mathematics, French, Arabic, Science, Physics, Chemistry, or History, using the language printed on the book.
- Detect book_type only when supported by visible wording.
- Detect the school grade/class when supported by visible wording.
- The user's selected category is authoritative.
TEXT,
    };

    return <<<PROMPT
You are a meticulous multilingual book cataloger. Inspect the supplied front cover and optional back cover. They may contain Arabic, English, or French text.

Selected book category: {$bookCategory}

{$categoryInstructions}

Return one compact JSON object only. Do not use Markdown, explanations, or code fences. Use exactly these keys:
{"is_book":true,"confidence":0.0,"title":null,"author":null,"subject":null,"book_type":null,"part":null,"grade":null,"grade_evidence":null,"publisher":null,"language":null,"edition_year":null,"edition_number":null,"isbn":null,"barcode":null,"warning":null}

General rules:
- is_book must be false when the images do not clearly show a book.
- Copy title, author, publisher, and other visible bibliographic text in their original script. Do not translate or invent them.
- language must be exactly english, french, or arabic based on the book's primary language.
- part identifies the book's volume or part, not its grade, level, edition, series, or school year. Normalize explicit numeric or letter labels to a compact value: Part 2, Volume II, Tome 2, الجزء الثاني, and القسم الثاني become "2"; Book A and Partie A become "A". Return null when no part is explicitly visible.
- edition_year is a four-digit integer, not a printing or copyright year unless clearly identified as the edition.
- edition_number is the explicitly printed edition number. Examples: "Second edition", "2nd edition", "Deuxième édition", and "الطبعة الثانية" return 2. "Third edition", "3rd edition", "Troisième édition", and "الطبعة الثالثة" return 3. Return null when an edition number is not clearly visible.
- IDENTIFIER EXTRACTION IS A PRIORITY: inspect the entire back cover at high detail, especially every value printed immediately above or below barcode bars.
- isbn must contain only a real, checksum-valid ISBN-10 or ISBN-13 explicitly visible on the cover. Remove spaces and hyphens. Prefer ISBN ouvrage/book over ISBN collection. Never convert a short inventory code into an ISBN and never invent an ISBN; return null when none is visible.
- barcode is the exact non-ISBN code printed immediately beside, above, or below barcode bars. Preserve its letters and digits, but remove surrounding spaces. Return null if there is no separate readable code or if uncertain.
- Use null for every field not clearly visible. Never guess missing bibliographic facts.
- confidence is between 0 and 1. warning briefly explains ambiguity or missing details, or is null.

School-only rules:
- Apply the following rules ONLY when the selected category is school.
- book_type must be "workbook" only when the cover clearly identifies an exercise/activity book, such as Workbook, Exercise Book, Activity Book, Cahier d'exercices, Cahier d'activites, Livre d'exercices, دفتر تمارين, كراسة تمارين, or كتاب التمارين.
- Return "textbook" when the cover clearly identifies a course/student/text book, such as Textbook, Course Book, Student's Book, Manuel scolaire, Livre de l'eleve, كتاب مدرسي, or كتاب الطالب.
- Return null for book_type when the type is not clear. Do not classify from appearance alone.
- grade is the learner's school grade or class, never the edition number. It must be exactly one of: 1,2,3,4,5,6,7,8,9,10,11,SE,SV,SG,LH; otherwise null.
- Lebanese mappings: EB1-EB8 map to 1-8, EB9/Brevet maps to 9, Secondary First/Seconde maps to 10, Secondary Second/Bac1 maps to 11.
- French curriculum class labels must be converted to the corresponding Kitabak/Lebanese grade when clearly printed on the book: CP = 1, CE1 = 2, CE2 = 3, CM1 = 4, CM2 = 5, 6e/6ème/6ème = 6, 5e/5ème/5ème = 7, 4e/4ème/4ème = 8, 3e/3ème/3ème = 9, Seconde/2de/2nde = 10, Première/1re/1ère = 11.
- For example, if the cover clearly says "CM2", return grade "5" and copy "CM2" into grade_evidence.
- Do not return the French class label itself as grade. grade must still use Kitabak's allowed values.
- For Lebanese third-secondary books, the printed branch overrides the number 3: فرع الاجتماع والاقتصاد / اجتماع واقتصاد = SE; فرع علوم الحياة = SV; فرع العلوم العامة = SG; فرع الآداب والإنسانيات = LH.
- Never return 3 when one of these branches is printed.
- Language levels such as A1, B2, or C1 are not school grades and must return null.
- grade_evidence must copy the exact grade/class/branch phrase visible on the cover in its original script. Use null when no grade evidence is visible.
- Never use the school grade, book part, volume, level, printing number, or edition year as the edition number.
PROMPT;
}
    private function normalize(array $result, string $bookCategory): array
    {
        $text = fn (string $key): ?string => filled(Arr::get($result, $key))
            ? mb_substr(trim((string) Arr::get($result, $key)), 0, 255)
            : null;

        $language = strtolower((string) Arr::get($result, 'language'));
        $bookType = strtolower(trim((string) Arr::get($result, 'book_type')));
     $grade = $bookCategory === 'school'
    ? $this->normalizeGrade(
        Arr::get($result, 'grade'),
        Arr::get($result, 'grade_evidence'),
    )
    : null;
        $year = filter_var(Arr::get($result, 'edition_year'), FILTER_VALIDATE_INT);
        $editionNumber = filter_var(
    Arr::get($result, 'edition_number'),
    FILTER_VALIDATE_INT
);
        $isbn = app(IsbnService::class)->normalize((string) Arr::get($result, 'isbn'));
        $barcode = $this->normalizeVisibleBarcode(Arr::get($result, 'barcode'));

        return [
            'is_book' => filter_var(Arr::get($result, 'is_book'), FILTER_VALIDATE_BOOL),
            'confidence' => round(max(0, min(1, (float) Arr::get($result, 'confidence', 0))), 2),
            'title' => $text('title'),
            'author' => $text('author'),
          'subject' => $bookCategory === 'novel'
    ? null
    : $text('subject'),

'book_type' => $bookCategory === 'school'
    && in_array($bookType, self::BOOK_TYPES, true)
        ? $bookType
        : null,
            'part' => $this->normalizePart(Arr::get($result, 'part')),
            'grade' => $grade,
            'publisher' => $text('publisher'),
            'language' => in_array($language, self::LANGUAGES, true) ? $language : null,
            'edition_year' => $year && $year >= 1800 && $year <= ((int) date('Y') + 1) ? $year : null,
            'edition_number' =>
                $editionNumber &&
                $editionNumber >= 1 &&
                $editionNumber <= 999
                    ? $editionNumber
        : null,
            'isbn' => $isbn,
            'barcode' => $barcode,
            'barcode_format' => $barcode === null ? null : 'AI_VISION',
            'warning' => $text('warning'),
        ];
    }

    private function normalizeVisibleBarcode(mixed $value): ?string
    {
        $barcode = strtoupper((string) preg_replace('/\s+/u', '', trim((string) $value)));

        if (
            $barcode === '' ||
            strlen($barcode) > 64 ||
            preg_match('/^[A-Z0-9][A-Z0-9._\/-]{2,63}$/', $barcode) !== 1 ||
            preg_match('/\d/', $barcode) !== 1
        ) {
            return null;
        }

        return app(IsbnService::class)->normalize($barcode) === null
            ? $barcode
            : null;
    }

    private function normalizePart(mixed $value): ?string
    {
        $part = trim((string) $value);

        if ($part === '') {
            return null;
        }

        if (preg_match('/^(?:grade|class|classe|level|niveau|edition|ed\.?|year|année|annee|صف|السنة)\b/iu', $part) === 1) {
            return null;
        }

        $part = preg_replace('/^(?:part|partie|tome|volume|vol\.?|book|livre|section|قسم|الجزء|جزء)\s*[:#.-]?\s*/iu', '', $part) ?? $part;
        $part = trim($part, " \t\n\r\0\x0B:;,.#-");
        $part = strtr($part, [
            '٠' => '0',
            '١' => '1',
            '٢' => '2',
            '٣' => '3',
            '٤' => '4',
            '٥' => '5',
            '٦' => '6',
            '٧' => '7',
            '٨' => '8',
            '٩' => '9',
        ]);

        $romanParts = [
            'I' => '1',
            'II' => '2',
            'III' => '3',
            'IV' => '4',
            'V' => '5',
            'VI' => '6',
        ];
        $upperPart = mb_strtoupper($part);

        if (isset($romanParts[$upperPart])) {
            return $romanParts[$upperPart];
        }

        $wordParts = [
            'first' => '1',
            'one' => '1',
            'premier' => '1',
            'première' => '1',
            'premiere' => '1',
            'الأول' => '1',
            'الاول' => '1',
            'second' => '2',
            'two' => '2',
            'deuxième' => '2',
            'deuxieme' => '2',
            'الثاني' => '2',
            'third' => '3',
            'three' => '3',
            'troisième' => '3',
            'troisieme' => '3',
            'الثالث' => '3',
        ];
        $lowerPart = mb_strtolower($part);

        if (isset($wordParts[$lowerPart])) {
            return $wordParts[$lowerPart];
        }

        if (preg_match('/^[a-z]$/i', $part) === 1) {
            return $upperPart;
        }

        return mb_substr($part, 0, 50);
    }

    private function normalizeGrade(mixed $grade, mixed $evidence): ?string
    {
        $evidence = mb_strtolower(trim((string) $evidence));
        $frenchGrades = [
    'CP' => '1',
    'CE1' => '2',
    'CE2' => '3',
    'CM1' => '4',
    'CM2' => '5',
];

$normalizedEvidence = mb_strtoupper(
    preg_replace('/\s+/u', '', $evidence) ?? $evidence
);

foreach ($frenchGrades as $frenchGrade => $lebaneseGrade) {
    if (
        preg_match(
            '/(?<![A-Z0-9])' . preg_quote($frenchGrade, '/') . '(?![A-Z0-9])/u',
            $normalizedEvidence
        ) === 1
    ) {
        return $lebaneseGrade;
    }
}

$frenchSecondaryGrades = [
    '/\b6(?:E|EME|ÈME)\b/u' => '6',
    '/\b5(?:E|EME|ÈME)\b/u' => '7',
    '/\b4(?:E|EME|ÈME)\b/u' => '8',
    '/\b3(?:E|EME|ÈME)\b/u' => '9',
    '/\b(?:2DE|2NDE|SECONDE)\b/u' => '10',
    '/\b(?:1RE|1ERE|1ÈRE|PREMIERE|PREMIÈRE)\b/u' => '11',
];

foreach ($frenchSecondaryGrades as $pattern => $lebaneseGrade) {
    if (preg_match($pattern, $normalizedEvidence) === 1) {
        return $lebaneseGrade;
    }
}

        $branches = [
            'SE' => '/(?:فرع\s*)?(?:ال)?اجتماع\s*و(?:ال)?اقتصاد/u',
            'SV' => '/(?:فرع\s*)?علوم\s*(?:ال)?حياة/u',
            'SG' => '/(?:فرع\s*)?(?:ال)?علوم\s*(?:ال)?عامة/u',
            'LH' => '/(?:فرع\s*)?(?:ال)?[آا]داب\s*و(?:ال)?[إا]نسانيات/u',
        ];

        foreach ($branches as $normalized => $pattern) {
            if (preg_match($pattern, $evidence) === 1) {
                return $normalized;
            }
        }

        $grade = strtoupper(trim((string) $grade));

        return in_array($grade, self::GRADES, true) ? $grade : null;
    }
}
