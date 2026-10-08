<?php

namespace Tests\Feature;

use App\Models\Book;
use App\Models\Listing;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class FavoriteBooksTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_user_can_save_a_book_and_view_it_on_the_favorites_page(): void
    {
        $user = User::factory()->create();
        $book = Book::create([
            'title' => 'Favorite Book',
            'isbn' => '9781234567897',
            'created_by' => $user->id,
        ]);

        Listing::create([
            'book_id' => $book->id,
            'seller_id' => $user->id,
            'price' => 12.50,
            'status' => 'available',
        ]);

        $this->actingAs($user)
            ->post(route('favorites.toggle', $book->listings()->first()))
            ->assertRedirect();

        $this->assertDatabaseHas('favorite_listings', [
            'user_id' => $user->id,
            'listing_id' => $book->listings()->first()->id,
        ]);

        $this->actingAs($user)
            ->get(route('favorites.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('MyFavorites')
                ->has('listings', 1)
                ->where('listings.0.id', $book->listings()->first()->id)
                ->where('listings.0.book.id', $book->id));
    }

    public function test_same_catalog_book_listings_can_be_favorited_independently(): void
    {
        $user = User::factory()->create();
        $seller = User::factory()->create();
        $book = Book::create([
            'title' => 'Shared Catalog Book',
            'created_by' => $seller->id,
        ]);
        $firstListing = Listing::create([
            'book_id' => $book->id,
            'seller_id' => $seller->id,
            'price' => 10,
            'status' => 'available',
        ]);
        $secondListing = Listing::create([
            'book_id' => $book->id,
            'seller_id' => $seller->id,
            'price' => 20,
            'status' => 'available',
        ]);

        $this->actingAs($user)
            ->post(route('favorites.toggle', $firstListing))
            ->assertRedirect();

        $this->assertDatabaseHas('favorite_listings', [
            'user_id' => $user->id,
            'listing_id' => $firstListing->id,
        ]);
        $this->assertDatabaseMissing('favorite_listings', [
            'user_id' => $user->id,
            'listing_id' => $secondListing->id,
        ]);
    }
}