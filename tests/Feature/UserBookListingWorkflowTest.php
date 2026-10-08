<?php

namespace Tests\Feature;

use App\Models\Book;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class UserBookListingWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_user_lists_an_existing_catalog_book_without_creating_a_duplicate(): void
    {
        Storage::fake('public');
        $user = User::factory()->withPhone()->create(['email_verified_at' => now()]);
        $book = Book::create(['title' => 'Existing book', 'isbn' => '9780306406157']);

        $this->actingAs($user)->post(route('books.store'), [
            'catalog_mode' => 'existing',
            'book_id' => $book->id,
            'price' => 12.50,
            'location' => 'Beirut',
            'listing_photos' => [$this->image('condition.png')],
        ])->assertRedirect(route('my-books'));

        $this->assertDatabaseCount('books', 1);
        $this->assertDatabaseHas('listings', [
            'book_id' => $book->id,
            'seller_id' => $user->id,
            'location' => 'Beirut',
        ]);
        $this->assertDatabaseCount('listing_images', 1);
    }

    public function test_confirming_a_legacy_match_attaches_its_detected_physical_barcode(): void
    {
        Storage::fake('public');
        $user = User::factory()->withPhone()->create(['email_verified_at' => now()]);
        $book = Book::create([
            'title' => 'De la LANGUE à la LITTÉRATURE',
            'barcode' => 'KIT-20260909-LEGACYBOOK',
            'barcode_format' => 'INTERNAL',
        ]);

        $this->actingAs($user)->post(route('books.store'), [
            'catalog_mode' => 'existing',
            'book_id' => $book->id,
            'barcode' => '7SS026',
            'barcode_format' => 'AI_VISION',
            'price' => 5,
            'listing_photos' => [$this->image('condition.png')],
        ])->assertRedirect(route('my-books'));

        $book->refresh();

        $this->assertSame('7SS026', $book->barcode);
        $this->assertSame('7SS026', $book->barcode_normalized);
        $this->assertSame('AI_VISION', $book->barcode_format);
        $this->assertDatabaseCount('books', 1);
    }

    public function test_a_user_can_create_a_new_catalog_book_and_listing_in_one_request(): void
    {
        Storage::fake('public');
        $user = User::factory()->withPhone()->create(['email_verified_at' => now()]);
        $front = $this->image('front.png');

        $this->actingAs($user)->post(route('books.store'), [
            'catalog_mode' => 'new',
            'title' => 'New AI book',
            'author' => 'Author',
            'book_type' => 'workbook',
            'part' => '2',
            'language' => 'english',
            'cover_image' => $front,
            'listing_photos' => [$this->image('listing-front.png'), $this->image('damage.png')],
            'price' => 8,
        ])->assertRedirect(route('my-books'));

        $book = Book::where('title', 'New AI book')->firstOrFail();
        $this->assertSame('workbook', $book->book_type);
        $this->assertSame('2', $book->part);
        $this->assertStringStartsWith('KIT-', $book->barcode);
        $this->assertSame('INTERNAL', $book->barcode_format);
        $this->assertNotNull($book->cover_image_url);
        $this->assertDatabaseHas('listings', ['book_id' => $book->id, 'seller_id' => $user->id]);
        $this->assertDatabaseCount('listing_images', 2);
    }

    public function test_selecting_a_legacy_catalog_match_enriches_missing_type_and_part(): void
    {
        Storage::fake('public');
        $user = User::factory()->withPhone()->create(['email_verified_at' => now()]);
        $book = Book::create(['title' => 'Legacy mathematics book']);

        $this->actingAs($user)->post(route('books.store'), [
            'catalog_mode' => 'existing',
            'book_id' => $book->id,
            'book_type' => 'textbook',
            'part' => 'A',
            'price' => 6,
            'listing_photos' => [$this->image('condition.png')],
        ])->assertRedirect(route('my-books'));

        $book->refresh();

        $this->assertSame('textbook', $book->book_type);
        $this->assertSame('A', $book->part);
        $this->assertDatabaseCount('books', 1);
    }

    public function test_an_existing_catalog_book_only_accepts_allowed_metadata_changes(): void
    {
        Storage::fake('public');
        $user = User::factory()->withPhone()->create(['email_verified_at' => now()]);
        $book = Book::create([
            'title' => 'Original title',
            'subject' => 'Mathematics',
            'book_type' => 'textbook',
            'part' => null,
            'grade' => null,
            'publisher' => null,
            'author' => 'Original author',
            'language' => 'english',
            'edition_year' => 2020,
            'isbn' => '9780306406157',
        ]);

        $this->actingAs($user)->post(route('books.store'), [
            'catalog_mode' => 'existing',
            'book_id' => $book->id,
            'title' => 'Corrected title',
            'subject' => 'Attempted subject overwrite',
            'book_type' => 'workbook',
            'part' => '2',
            'grade' => '5',
            'publisher' => 'Added publisher',
            'author' => 'Attempted author overwrite',
            'language' => 'french',
            'edition_year' => 2024,
            'isbn' => '9783161484100',
            'price' => 9,
            'listing_photos' => [$this->image('condition.png')],
        ])->assertRedirect(route('my-books'));

        $book->refresh();

        $this->assertSame('Corrected title', $book->title);
        $this->assertSame(2024, $book->edition_year);
        $this->assertSame('Mathematics', $book->subject);
        $this->assertSame('textbook', $book->book_type);
        $this->assertSame('Original author', $book->author);
        $this->assertSame('english', $book->language);
        $this->assertSame('2', $book->part);
        $this->assertSame('5', $book->grade);
        $this->assertSame('Added publisher', $book->publisher);
        $this->assertSame('9780306406157', $book->isbn);
        $this->assertDatabaseCount('books', 1);
    }

    public function test_an_unknown_book_type_is_rejected(): void
    {
        Storage::fake('public');
        $user = User::factory()->withPhone()->create(['email_verified_at' => now()]);

        $this->actingAs($user)->post(route('books.store'), [
            'catalog_mode' => 'new',
            'title' => 'Unknown type book',
            'book_type' => 'not-a-real-type',
            'cover_image' => $this->image('front.png'),
            'listing_photos' => [$this->image('condition.png')],
            'price' => 5,
        ])->assertSessionHasErrors('book_type');

        $this->assertDatabaseCount('books', 0);
    }

    public function test_a_new_submission_reuses_a_catalog_book_when_the_isbn_now_exists(): void
    {
        Storage::fake('public');
        $user = User::factory()->withPhone()->create(['email_verified_at' => now()]);
        $book = Book::create(['title' => 'Already created', 'isbn' => '9780306406157']);

        $this->actingAs($user)->post(route('books.store'), [
            'catalog_mode' => 'new',
            'title' => 'Duplicate attempt',
            'isbn' => '0-306-40615-2',
            'cover_image' => $this->image('front.png'),
            'listing_photos' => [$this->image('condition.png')],
            'price' => 5,
        ])->assertRedirect(route('my-books'));

        $this->assertDatabaseCount('books', 1);
        $this->assertDatabaseHas('listings', ['book_id' => $book->id, 'seller_id' => $user->id]);
    }

    public function test_a_new_submission_reuses_a_catalog_book_when_its_custom_barcode_exists(): void
    {
        Storage::fake('public');
        $user = User::factory()->withPhone()->create(['email_verified_at' => now()]);
        $book = Book::create([
            'title' => 'De la LANGUE à la LITTÉRATURE',
            'barcode' => '7SS026',
            'barcode_format' => 'AI_VISION',
        ]);

        $this->actingAs($user)->post(route('books.store'), [
            'catalog_mode' => 'new',
            'title' => 'De la LANGUE à la LITTÉRATURE — Textes et Méthodes',
            'barcode' => '7ss026',
            'barcode_format' => 'CODE_128',
            'cover_image' => $this->image('front.png'),
            'listing_photos' => [$this->image('condition.png')],
            'price' => 5,
        ])->assertRedirect(route('my-books'));

        $this->assertDatabaseCount('books', 1);
        $this->assertDatabaseHas('listings', [
            'book_id' => $book->id,
            'seller_id' => $user->id,
        ]);
    }

    public function test_an_admin_uses_the_same_catalog_and_listing_workflow(): void
    {
        Storage::fake('public');
        Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
        $admin = User::factory()->withPhone()->create(['email_verified_at' => now()]);
        $admin->assignRole('admin');

        $this->actingAs($admin)->post(route('books.store'), [
            'catalog_mode' => 'new',
            'title' => 'Administrator listing',
            'cover_image' => $this->image('front.png'),
            'listing_photos' => [$this->image('condition.png')],
            'price' => 10,
        ])->assertRedirect(route('my-books'));

        $book = Book::where('title', 'Administrator listing')->firstOrFail();
        $this->assertDatabaseHas('listings', [
            'book_id' => $book->id,
            'seller_id' => $admin->id,
        ]);
        $this->assertDatabaseCount('listing_images', 1);
    }

    private function image(string $name): UploadedFile
    {
        $png = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=');

        return UploadedFile::fake()->createWithContent($name, $png);
    }
}
