<?php

namespace Database\Seeders;

use App\Models\Book;
use Illuminate\Database\Seeder;
use RuntimeException;

class AntoineBooksSeeder extends Seeder
{
    public function run(): void
    {
        $filePath = base_path(
            'antoine-scraper/antoine_books.csv'
        );

        if (!file_exists($filePath)) {
            throw new RuntimeException(
                "CSV file not found: {$filePath}"
            );
        }

        $file = fopen($filePath, 'r');

        if ($file === false) {
            throw new RuntimeException(
                'Cannot open the CSV file.'
            );
        }

        $headers = fgetcsv($file);

        if ($headers === false) {
            fclose($file);

            throw new RuntimeException(
                'The CSV file is empty.'
            );
        }

        $headers = array_map(function (string $header): string {
            $header = preg_replace(
                '/^\xEF\xBB\xBF/',
                '',
                $header
            );

            return trim($header, " \t\n\r\0\x0B\"'");
        }, $headers);

        $inserted = 0;
        $updated = 0;
        $skipped = 0;

        while (($row = fgetcsv($file)) !== false) {
            if (count($row) !== count($headers)) {
                $skipped++;
                continue;
            }

            $data = array_combine($headers, $row);

            $title = trim($data['title'] ?? '');
            $grade = trim($data['grade'] ?? '');

            if ($title === '' || $grade === '') {
                $skipped++;
                continue;
            }

            $book = Book::updateOrCreate(
                [
                    'title' => $title,
                    'grade' => $grade,
                ],
                [
                    'subject' => $this->nullable(
                        $data['subject'] ?? ''
                    ),

                    'publisher' => $this->nullable(
                        $data['publisher'] ?? ''
                    ),

                    'author' => $this->nullable(
                        $data['author'] ?? ''
                    ),

                    'language' => $this->nullable(
                        $data['language'] ?? ''
                    ),

                    'edition_year' => $this->nullableInteger(
                        $data['edition_year'] ?? ''
                    ),

                    'isbn' => $this->nullable(
                        $data['isbn'] ?? ''
                    ),

                    'cover_image_url' => $this->nullable(
                        $data['cover_image_url'] ?? ''
                    ),
                ]
            );

            if ($book->wasRecentlyCreated) {
                $inserted++;
            } else {
                $updated++;
            }
        }

        fclose($file);

        $this->command?->info(
            'Antoine books imported successfully.'
        );

        $this->command?->info(
            "Inserted: {$inserted}"
        );

        $this->command?->info(
            "Updated: {$updated}"
        );

        $this->command?->info(
            "Skipped: {$skipped}"
        );
    }

    private function nullable(string $value): ?string
    {
        $value = trim($value);

        return $value === '' ? null : $value;
    }

    private function nullableInteger(string $value): ?int
    {
        $value = trim($value);

        if ($value === '' || !is_numeric($value)) {
            return null;
        }

        return (int) $value;
    }
}