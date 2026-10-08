<?php

namespace Tests\Feature;

use App\Models\Book;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AdminBooksServerSideTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_books_are_paginated_with_recent_books_first(): void
    {
        $admin = $this->admin();

        foreach (range(1, 25) as $number) {
            Book::create([
                'title' => sprintf('Catalog Book %02d', $number),
                'created_by' => $admin->id,
            ]);
        }

        $this->actingAs($admin)
            ->get(route('books'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Books')
                ->has('books.data', 20)
                ->where('books.total', 25)
                ->where('books.current_page', 1)
                ->where('books.data.0.title', 'Catalog Book 25')
                ->where('stats.total', 25));
    }

    public function test_admin_book_search_filters_and_sorting_run_on_the_server(): void
    {
        $admin = $this->admin();

        $matchingBook = Book::create([
            'title' => 'Alpha Mathematics',
            'grade' => '5',
            'language' => 'english',
            'created_by' => $admin->id,
        ]);
        Book::create([
            'title' => 'Alpha French',
            'grade' => '5',
            'language' => 'french',
            'created_by' => $admin->id,
        ]);
        Book::create([
            'title' => 'Beta Mathematics',
            'grade' => '5',
            'language' => 'english',
            'created_by' => $admin->id,
        ]);

        $this->actingAs($admin)
            ->get(route('books', [
                'q' => 'Alpha',
                'grade' => '5',
                'language' => 'English',
                'sort' => 'title',
            ]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Books')
                ->has('books.data', 1)
                ->where('books.total', 1)
                ->where('books.data.0.id', $matchingBook->id)
                ->where('filters.q', 'Alpha')
                ->where('filters.grade', '5')
                ->where('filters.language', 'English')
                ->where('filters.sort', 'title'));
    }

    private function admin(): User
    {
        Role::firstOrCreate([
            'name' => 'admin',
            'guard_name' => 'web',
        ]);

        $admin = User::factory()->create();
        $admin->assignRole('admin');

        return $admin;
    }
}
