<?php

namespace Database\Seeders;

use App\Models\Book;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class LebaneseBooksSeeder extends Seeder
{
    private const ALLOWED_GRADES = [
        '1', '2', '3', '4', '5', '6',
        '7', '8', '9', '10', '11',
        'SE', 'SV', 'SG', 'SS',
    ];

    private const ALLOWED_LANGUAGES = [
        'Arabic',
        'French',
        'English',
    ];

    public function run(): void
    {
        $filePath = database_path('data/lebanese_books.csv');

        if (!file_exists($filePath)) {
            throw new RuntimeException(
                "CSV file not found: {$filePath}"
            );
        }

        $file = fopen($filePath, 'r');

        if ($file === false) {
            throw new RuntimeException(
                "Cannot open CSV file: {$filePath}"
            );
        }

        // Read the first row containing column names.
        $headers = fgetcsv($file);

        if ($headers === false) {
            fclose($file);
            throw new RuntimeException('The CSV file is empty.');
        }

        // Remove the UTF-8 BOM that Excel may add.
        $headers[0] = preg_replace('/^\xEF\xBB\xBF/', '', $headers[0]);

        $headers = array_map(
            fn ($header) => trim($header),
            $headers
        );

        $requiredHeaders = [
            'title',
            'subject',
            'grade',
            'publisher',
            'author',
            'language',
            'edition_year',
            'isbn',
            'cover_image_url',
        ];

        if ($headers !== $requiredHeaders) {
            fclose($file);

            throw new RuntimeException(
                'The CSV headers are incorrect. Expected: ' .
                implode(',', $requiredHeaders)
            );
        }

        $inserted = 0;
        $updated = 0;
        $skipped = 0;
        $lineNumber = 1;

        DB::beginTransaction();

        try {
            while (($row = fgetcsv($file)) !== false) {
                $lineNumber++;

                // Ignore completely empty rows.
                if ($this->rowIsEmpty($row)) {
                    continue;
                }

                if (count($row) !== count($headers)) {
                    $this->command?->warn(
                        "Line {$lineNumber} skipped: incorrect column count."
                    );

                    $skipped++;
                    continue;
                }

                $data = array_combine($headers, $row);

                $data = array_map(
                    fn ($value) => trim($value),
                    $data
                );

                $data['grade'] = strtoupper($data['grade']);

                if ($data['title'] === '' || $data['subject'] === '') {
                    $this->command?->warn(
                        "Line {$lineNumber} skipped: title or subject is empty."
                    );

                    $skipped++;
                    continue;
                }

                if (!in_array($data['grade'], self::ALLOWED_GRADES, true)) {
                    $this->command?->warn(
                        "Line {$lineNumber} skipped: invalid grade " .
                        "'{$data['grade']}'."
                    );

                    $skipped++;
                    continue;
                }

                if (!in_array(
                    $data['language'],
                    self::ALLOWED_LANGUAGES,
                    true
                )) {
                    $this->command?->warn(
                        "Line {$lineNumber} skipped: invalid language " .
                        "'{$data['language']}'."
                    );

                    $skipped++;
                    continue;
                }

                $bookData = [
                    'title' => $data['title'],
                    'subject' => $data['subject'],
                    'grade' => $data['grade'],
                    'publisher' => $this->nullable($data['publisher']),
                    'author' => $this->nullable($data['author']),
                    'language' => $data['language'],
                    'edition_year' => $this->nullableInteger(
                        $data['edition_year']
                    ),
                    'isbn' => $this->nullable($data['isbn']),
                    'cover_image_url' => $this->nullable(
                        $data['cover_image_url']
                    ),

                    // Official imported books are not created by a user.
                    'created_by' => null,


                ];

                /*
                 * ISBN is the best identifier when it exists.
                 * Otherwise, identify the book by its catalog information.
                 */
                if ($bookData['isbn'] !== null) {
                    $searchFields = [
                        'isbn' => $bookData['isbn'],
                    ];
                } else {
                    $searchFields = [
                        'title' => $bookData['title'],
                        'subject' => $bookData['subject'],
                        'grade' => $bookData['grade'],
                        'language' => $bookData['language'],
                        'publisher' => $bookData['publisher'],
                        'edition_year' => $bookData['edition_year'],
                    ];
                }

                $book = Book::updateOrCreate(
                    $searchFields,
                    $bookData
                );

                if ($book->wasRecentlyCreated) {
                    $inserted++;
                } else {
                    $updated++;
                }
            }

            DB::commit();
        } catch (\Throwable $exception) {
            DB::rollBack();
            fclose($file);

            throw $exception;
        }

        fclose($file);

        $this->command?->info('Lebanese books import completed.');
        $this->command?->info("Inserted: {$inserted}");
        $this->command?->info("Updated: {$updated}");
        $this->command?->info("Skipped: {$skipped}");
    }

    private function nullable(string $value): ?string
    {
        return $value === '' ? null : $value;
    }

    private function nullableInteger(string $value): ?int
    {
        if ($value === '') {
            return null;
        }

        return is_numeric($value) ? (int) $value : null;
    }

    private function rowIsEmpty(array $row): bool
    {
        foreach ($row as $value) {
            if (trim((string) $value) !== '') {
                return false;
            }
        }

        return true;
    }
}