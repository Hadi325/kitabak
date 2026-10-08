<?php

namespace Tests\Feature;

use App\Models\Book;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BookBarcodeLookupTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_verified_normal_user_can_open_the_add_book_page(): void
    {
        $user = User::factory()->withPhone()->create(['email_verified_at' => now()]);

        $this->actingAs($user)
            ->get(route('add.book'))
            ->assertOk();
    }

    public function test_guests_cannot_lookup_books_by_isbn(): void
    {
        $this->getJson(route('books.lookup-isbn', ['isbn' => '9780306406157']))
            ->assertUnauthorized();
    }

    public function test_unverified_users_cannot_lookup_books_by_isbn(): void
    {
        $user = User::factory()->unverified()->create();

        $this->actingAs($user)
            ->getJson(route('books.lookup-isbn', ['isbn' => '9780306406157']))
            ->assertForbidden();
    }

    public function test_a_scanned_isbn_13_matches_a_saved_isbn_10_and_returns_catalog_fields(): void
    {
        $user = User::factory()->withPhone()->create(['email_verified_at' => now()]);
        $book = Book::create([
            'title' => 'Theoretical Physics',
            'subject' => 'Physics',
            'grade' => '11',
            'publisher' => 'Academic Press',
            'author' => 'Test Author',
            'language' => 'english',
            'edition_year' => 2024,
            'isbn' => '0-306-40615-2',
            'cover_image_url' => '/storage/book_covers/test.jpg',
            'created_by' => $user->id,
        ]);

        $this->actingAs($user)
            ->getJson(route('books.lookup-isbn', ['isbn' => '9780306406157']))
            ->assertOk()
            ->assertJsonPath('source', 'local')
            ->assertJsonPath('found', true)
            ->assertJsonPath('isbn', '9780306406157')
            ->assertJsonPath('book.id', $book->id)
            ->assertJsonPath('book.title', 'Theoretical Physics')
            ->assertJsonPath('book.author', 'Test Author')
            ->assertJsonPath('book.publisher', 'Academic Press')
            ->assertJsonPath('book.language', 'english')
            ->assertJsonPath('book.subject', 'Physics')
            ->assertJsonPath('book.grade', '11')
            ->assertJsonPath('book.edition_year', 2024)
            ->assertJsonPath('book.isbn', '0-306-40615-2')
            ->assertJsonPath('book.cover_image_url', '/storage/book_covers/test.jpg')
            ->assertJsonMissingPath('book.created_by');
    }

    public function test_an_unknown_isbn_keeps_the_form_in_manual_mode(): void
    {
        $user = User::factory()->withPhone()->create(['email_verified_at' => now()]);

        $this->actingAs($user)
            ->getJson(route('books.lookup-isbn', ['isbn' => '9783161484100']))
            ->assertOk()
            ->assertJsonPath('source', 'not_found')
            ->assertJsonPath('isbn', '9783161484100')
            ->assertJsonPath('identifier.identifier_type', 'isbn')
            ->assertJsonPath('found', false)
            ->assertJsonPath('book', null);
    }

    public function test_a_non_book_ean_is_preserved_as_a_custom_identifier(): void
    {
        $user = User::factory()->withPhone()->create(['email_verified_at' => now()]);

        $this->actingAs($user)
            ->getJson(route('books.lookup-isbn', [
                'identifier' => '4006381333931',
                'barcode_format' => 'EAN_13',
            ]))
            ->assertOk()
            ->assertJsonPath('identifier.identifier_type', 'custom')
            ->assertJsonPath('identifier.normalized_value', '4006381333931')
            ->assertJsonPath('found', false);
    }

    public function test_a_custom_alphanumeric_barcode_matches_only_the_local_catalog(): void
    {
        $user = User::factory()->withPhone()->create(['email_verified_at' => now()]);
        $book = Book::create([
            'title' => 'Local workbook',
            'barcode' => 'G2V1Y5LAB005',
            'barcode_format' => 'CODE_128',
            'created_by' => $user->id,
        ]);

        $this->actingAs($user)
            ->getJson(route('books.lookup-isbn', [
                'identifier' => 'g2v1y5lab005',
                'barcode_format' => 'CODE_128',
            ]))
            ->assertOk()
            ->assertJsonPath('source', 'local')
            ->assertJsonPath('identifier.identifier_type', 'custom')
            ->assertJsonPath('book.id', $book->id);
    }

    public function test_duplicate_isbns_resolve_deterministically_to_the_oldest_catalog_record(): void
    {
        $user = User::factory()->withPhone()->create(['email_verified_at' => now()]);
        $first = Book::create([
            'title' => 'First catalog record',
            'isbn' => '9780306406157',
            'created_by' => $user->id,
        ]);
        Book::create([
            'title' => 'Duplicate catalog record',
            'isbn' => '978-0-306-40615-7',
            'created_by' => $user->id,
        ]);

        $this->actingAs($user)
            ->getJson(route('books.lookup-isbn', ['isbn' => '9780306406157']))
            ->assertOk()
            ->assertJsonPath('book.id', $first->id);
    }
}
