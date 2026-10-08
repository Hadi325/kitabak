<?php

namespace Database\Seeders;

use App\Models\Book;
use Illuminate\Database\Seeder;

class BarcodeDemoBookSeeder extends Seeder
{
    public function run(): void
    {
        $book = Book::query()->where('isbn_normalized', '9780306406157')->first() ?? new Book;

        $book->fill([
            'title' => 'Barcode Scanner Test Book',
            'subject' => 'Computer Science',
            'grade' => '11',
            'publisher' => 'myBooks Demo Press',
            'author' => 'myBooks QA Team',
            'language' => 'english',
            'edition_year' => 2026,
            'isbn' => '978-0-306-40615-7',
        ])->save();
    }
}
