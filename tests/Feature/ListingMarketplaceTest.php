<?php

namespace Tests\Feature;

use App\Models\Book;
use App\Models\Listing;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ListingMarketplaceTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_user_can_open_an_available_listing_without_exposing_the_sellers_phone(): void
    {
        [$listing, $seller] = $this->listing();
        $reader = User::factory()->create();

        $this->actingAs($reader)
            ->get(route('listings.show', $listing))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('ListingDetails')
                ->where('listing.id', $listing->id)
                ->where('listing.seller.id', $seller->id)
                ->where('listing.can_contact_seller', true)
                ->where('listing.is_owner', false)
                ->missing('listing.seller.phone'));
    }

    public function test_an_admin_can_open_the_same_listing_details_page(): void
    {
        [$listing] = $this->listing();
        Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $this->actingAs($admin)
            ->get(route('listings.show', $listing))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('ListingDetails'));
    }

    public function test_a_user_can_browse_all_available_books_from_a_seller(): void
    {
        $seller = User::factory()->create(['name' => 'Seller Name']);
        $otherSeller = User::factory()->create();
        $reader = User::factory()->create();

        $availableBook = Book::create([
            'title' => 'Available Seller Book',
            'created_by' => $seller->id,
        ]);
        $secondAvailableBook = Book::create([
            'title' => 'Second Seller Book',
            'created_by' => $seller->id,
        ]);
        $soldBook = Book::create([
            'title' => 'Sold Seller Book',
            'created_by' => $seller->id,
        ]);
        $otherBook = Book::create([
            'title' => 'Another Sellers Book',
            'created_by' => $otherSeller->id,
        ]);

        $availableListing = Listing::create([
            'book_id' => $availableBook->id,
            'seller_id' => $seller->id,
            'price' => 10,
            'status' => 'available',
        ]);
        $secondAvailableListing = Listing::create([
            'book_id' => $secondAvailableBook->id,
            'seller_id' => $seller->id,
            'price' => 15,
            'status' => 'available',
        ]);
        Listing::create([
            'book_id' => $soldBook->id,
            'seller_id' => $seller->id,
            'price' => 20,
            'status' => 'sold',
        ]);
        Listing::create([
            'book_id' => $otherBook->id,
            'seller_id' => $otherSeller->id,
            'price' => 25,
            'status' => 'available',
        ]);

        $expectedListingIds = [
            $availableListing->id,
            $secondAvailableListing->id,
        ];

        $this->actingAs($reader)
            ->get(route('sellers.books', $seller))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('SellerBooks')
                ->where('seller.id', $seller->id)
                ->where('seller.name', 'Seller Name')
                ->has('listings', 2)
                ->where('listings', function ($listings) use ($expectedListingIds, $seller) {
                    return collect($listings)->pluck('id')->sort()->values()->all()
                            === collect($expectedListingIds)->sort()->values()->all()
                        && collect($listings)->every(
                            fn ($listing) => $listing['seller_id'] === $seller->id
                                && $listing['status'] === 'available',
                        );
                }));
    }

    public function test_guests_must_sign_in_to_view_a_sellers_books(): void
    {
        $seller = User::factory()->create();

        $this->get(route('sellers.books', $seller))
            ->assertRedirect(route('login'));
    }

    public function test_home_shows_each_available_listing_for_the_same_book(): void
    {
        $sellerOne = User::factory()->create();
        $sellerTwo = User::factory()->create();
        $book = Book::create([
            'title' => 'A Shared Book',
            'isbn' => '9789953849461',
            'created_by' => $sellerOne->id,
        ]);

        Listing::create([
            'book_id' => $book->id,
            'seller_id' => $sellerOne->id,
            'price' => 25,
            'status' => 'available',
        ]);
        Listing::create([
            'book_id' => $book->id,
            'seller_id' => $sellerTwo->id,
            'price' => 50,
            'status' => 'available',
        ]);

        $this->actingAs($sellerOne)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Dashboard')
                ->has('recentBooks', 2)
                ->where('recentBooks.0.id', $book->id)
                ->where('recentBooks.1.id', $book->id)
                ->where('recentBooks.0.listings', fn ($listings) => count($listings) === 1)
                ->where('recentBooks.1.listings', fn ($listings) => count($listings) === 1));
    }

    public function test_home_search_includes_the_current_users_available_listings(): void
    {
        $currentUser = User::factory()->create();
        $otherSeller = User::factory()->create();
        $ownBook = Book::create([
            'title' => 'Searchable Own Book',
            'created_by' => $currentUser->id,
        ]);
        $sharedBook = Book::create([
            'title' => 'Searchable Shared Book',
            'created_by' => $currentUser->id,
        ]);

        Listing::create([
            'book_id' => $ownBook->id,
            'seller_id' => $currentUser->id,
            'price' => 10,
            'status' => 'available',
        ]);
        Listing::create([
            'book_id' => $sharedBook->id,
            'seller_id' => $currentUser->id,
            'price' => 15,
            'status' => 'available',
        ]);
        Listing::create([
            'book_id' => $sharedBook->id,
            'seller_id' => $otherSeller->id,
            'price' => 20,
            'status' => 'available',
        ]);

        $response = $this->actingAs($currentUser)
            ->getJson(route('books.search', ['search' => 'Searchable']))
            ->assertOk()
            ->assertJsonPath('count', 2);

        $books = collect($response->json('books'))->keyBy('id');

        $this->assertTrue($books->has($ownBook->id));
        $this->assertTrue($books->has($sharedBook->id));
        $this->assertSame(
            [$currentUser->id],
            collect($books[$ownBook->id]['listings'])
                ->pluck('seller_id')
                ->all(),
        );
        $this->assertEqualsCanonicalizing(
            [$currentUser->id, $otherSeller->id],
            collect($books[$sharedBook->id]['listings'])
                ->pluck('seller_id')
                ->all(),
        );
    }

    public function test_whatsapp_contacts_the_listing_seller_not_the_catalog_creator(): void
    {
        $creator = User::factory()->withPhone('+96171111111')->create();
        $seller = User::factory()->withPhone('+96170222222')->create(['name' => 'Actual Seller']);
        $reader = User::factory()->create();
        $book = Book::create(['title' => 'Shared Catalog Book', 'created_by' => $creator->id]);
        $listing = Listing::create([
            'book_id' => $book->id,
            'seller_id' => $seller->id,
            'price' => 12,
            'status' => 'available',
        ]);

        $response = $this->actingAs($reader)
            ->get(route('listings.contact.whatsapp', $listing))
            ->assertRedirectContains('https://api.whatsapp.com/send?phone=96170222222&text=');

        parse_str(parse_url($response->headers->get('Location'), PHP_URL_QUERY), $query);

        $this->assertStringContainsString('Shared Catalog Book', $query['text']);
        $this->assertStringContainsString(route('listings.show', $listing), $query['text']);
    }

    public function test_whatsapp_message_uses_the_selected_arabic_locale(): void
    {
        [$listing, $seller] = $this->listing();
        $reader = User::factory()->create();

        $response = $this->actingAs($reader)->get(route(
            'listings.contact.whatsapp',
            [
                'listing' => $listing,
                'locale' => 'ar',
            ],
        ));

        parse_str(
            parse_url($response->headers->get('Location'), PHP_URL_QUERY),
            $query,
        );

        $this->assertStringContainsString('مرحباً '.$seller->name, $query['text']);
        $this->assertStringContainsString('أنا مهتم بكتابك', $query['text']);
        $this->assertStringContainsString('عرض الكتاب:', $query['text']);
        $this->assertStringContainsString(route('listings.show', $listing), $query['text']);
    }

    public function test_desktop_whatsapp_contact_opens_whatsapp_web(): void
    {
        [$listing] = $this->listing();
        $reader = User::factory()->create();

        $response = $this->actingAs($reader)
            ->get(route('listings.contact.whatsapp', [
                'listing' => $listing,
                'target' => 'web',
            ]))
            ->assertRedirectContains('https://web.whatsapp.com/send?phone=96170123456&text=');

        parse_str(parse_url($response->headers->get('Location'), PHP_URL_QUERY), $query);

        $this->assertStringContainsString(route('listings.show', $listing), $query['text']);
    }

    public function test_a_seller_cannot_contact_themselves(): void
    {
        [$listing, $seller] = $this->listing();

        $this->actingAs($seller)
            ->get(route('listings.contact.whatsapp', $listing))
            ->assertUnprocessable();
    }

    public function test_an_unavailable_listing_cannot_be_opened_or_contacted(): void
    {
        [$listing] = $this->listing(['status' => 'sold']);
        $reader = User::factory()->create();

        $this->actingAs($reader)->get(route('listings.show', $listing))->assertNotFound();
        $this->actingAs($reader)->get(route('listings.contact.whatsapp', $listing))->assertNotFound();
    }

    private function listing(array $attributes = []): array
    {
        $seller = User::factory()->withPhone('+96170123456')->create(['name' => 'Book Seller']);
        $book = Book::create(['title' => 'Marketplace Book', 'created_by' => $seller->id]);
        $listing = Listing::create([
            'book_id' => $book->id,
            'seller_id' => $seller->id,
            'price' => 9.50,
            'status' => 'available',
            ...$attributes,
        ]);

        return [$listing, $seller];
    }
}
