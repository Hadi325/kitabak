<?php

namespace Tests\Feature;

use App\Models\Book;
use App\Models\Listing;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class BookListAnalysisTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_must_sign_in_to_open_or_analyze_school_lists(): void
    {
        $this->get(route('book-lists.create'))
            ->assertRedirect(route('login'));

        $this->postJson(
            route('book-lists.analyze'),
            ['text' => 'A nous les maths']
        )->assertUnauthorized();
    }

    public function test_it_returns_only_listed_books_as_found(): void
    {
        $this->fakeAi([
            ['raw' => 'Le nouveau Millefeuille', 'title' => 'Le nouveau Millefeuille', 'subject' => 'francais', 'grade' => '5', 'isbn' => null],
            ['raw' => 'A nous les maths', 'title' => 'A nous les maths', 'subject' => 'maths', 'grade' => '5', 'isbn' => null],
            ['raw' => 'Biology discovery workbook', 'title' => 'Biology discovery workbook', 'subject' => 'anglais', 'grade' => '5', 'isbn' => null],
        ]);
        $user = User::factory()->create();
        $seller = User::factory()->create();

        $availableBook = Book::query()->create([
            'title' => 'Le nouveau Millefeuille',
            'subject' => 'francais',
            'grade' => '5',
            'publisher' => 'Nathan',
            'edition_year' => 2019,
            'created_by' => $seller->id,
        ]);
        Listing::query()->create([
            'book_id' => $availableBook->id,
            'seller_id' => $seller->id,
            'price' => 12.50,
            'status' => 'available',
            'location' => 'Beirut',
        ]);

        Book::query()->create([
            'title' => 'A nous les maths',
            'subject' => 'maths',
            'grade' => '5',
            'publisher' => 'Hachette',
            'edition_year' => 2021,
            'created_by' => $seller->id,
        ]);

        $response = $this->actingAs($user)->postJson(route('book-lists.analyze'), [
            'file_name' => 'liste-eb5.pdf',
            'text' => <<<'TEXT'
                Année scolaire: 2026-2027
                Classe: EB 5
                Français
                • Le nouveau Millefeuille – Français CM2 – Nathan – Édition 2019
                Maths
                • A nous les maths – EB5 – HACHETTE – Édition 2021
                Anglais
                • Biology discovery workbook – New Edition
                TEXT,
        ]);

        $response->assertOk()->assertJsonPath('grade', '5');
        $items = collect($response->json('items'));

        $this->assertSame('available', $items->firstWhere('title', 'Le nouveau Millefeuille')['status']);
        $this->assertSame(12.5, $items->firstWhere('title', 'Le nouveau Millefeuille')['matches'][0]['lowest_price']);
        $this->assertSame('not_found', $items->firstWhere('title', 'A nous les maths')['status']);
        $this->assertSame('no_catalog_match', $items->firstWhere('title', 'A nous les maths')['reason']);
        $this->assertSame('not_found', $items->firstWhere('title', 'Biology discovery workbook')['status']);
    }

    public function test_analysis_rejects_oversized_extracted_text(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->postJson(route('book-lists.analyze'), ['text' => str_repeat('a', 100001)])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('text');
    }

    public function test_it_keeps_the_class_of_each_section_in_a_multi_class_document(): void
    {
        $this->fakeAi([
            ['raw' => 'Workbook five', 'title' => 'Workbook five', 'subject' => 'maths', 'grade' => '5', 'isbn' => null],
            ['raw' => 'Workbook six', 'title' => 'Workbook six', 'subject' => 'sciences', 'grade' => '6', 'isbn' => null],
        ]);
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson(route('book-lists.analyze'), [
            'text' => "Classe: EB 5\nMaths\n• Workbook five – Publisher\nClasse: EB 6\nSciences\n• Workbook six – Publisher",
        ]);

        $response->assertOk()->assertJsonPath('grades', ['5', '6']);
        $items = collect($response->json('items'));
        $this->assertSame('5', $items->firstWhere('title', 'Workbook five')['grade']);
        $this->assertSame('6', $items->firstWhere('title', 'Workbook six')['grade']);
    }

    public function test_school_list_matching_rejects_a_different_part_or_book_type(): void
    {
        $this->fakeAi([[
            'raw' => 'Learning Together - workbook - part 2',
            'title' => 'Learning Together',
            'subject' => 'english',
            'book_type' => 'workbook',
            'part' => '2',
            'grade' => '5',
            'isbn' => null,
        ]]);

        $seller = User::factory()->create();
        $book = Book::query()->create([
            'title' => 'Learning Together',
            'subject' => 'english',
            'book_type' => 'textbook',
            'part' => '1',
            'grade' => '5',
            'created_by' => $seller->id,
        ]);
        Listing::query()->create([
            'book_id' => $book->id,
            'seller_id' => $seller->id,
            'price' => 10,
            'status' => 'available',
        ]);

        $this->actingAs($seller)
            ->postJson(route('book-lists.analyze'), [
                'text' => 'Learning Together - workbook - part 2',
            ])
            ->assertOk()
            ->assertJsonPath('items.0.status', 'not_found');
    }

    public function test_it_understands_flattened_pdf_table_rows_and_ignores_headings(): void
    {
        $this->fakeAi([
            ['raw' => 'Le voyage des mots', 'title' => 'Le voyage des mots', 'subject' => 'francais', 'grade' => '1', 'isbn' => null],
            ['raw' => 'Galactic Arithmetic Lab', 'title' => 'Galactic Arithmetic Lab', 'subject' => 'maths', 'grade' => null, 'isbn' => null],
        ]);
        $user = User::factory()->create();
        Book::query()->create([
            'title' => 'Le voyage des mots',
            'subject' => 'Language',
            'grade' => '1',
            'created_by' => $user->id,
        ]);

        $response = $this->actingAs($user)->postJson(route('book-lists.analyze'), [
            'text' => implode("\n", [
                'Required Book List',
                'Document prepared to test catalog matching and availability reporting.',
                'Subject Required books',
                'French Le voyage des mots - CRDP - Edition 2002',
                'Maths Galactic Arithmetic Lab - Missing Publisher - Edition 2026',
                'Note: Students may choose any available seller copy.',
            ]),
        ]);

        $response->assertOk()->assertJsonPath('summary.total', 2);
        $items = collect($response->json('items'));
        $this->assertSame('Le voyage des mots', $items[0]['title']);
        $this->assertSame('francais', $items[0]['subject']);
        $this->assertSame('not_found', $items[0]['status']);
        $this->assertSame('Galactic Arithmetic Lab', $items[1]['title']);
        $this->assertSame('maths', $items[1]['subject']);
        $this->assertSame('not_found', $items[1]['status']);
    }

    private function fakeAi(array $items): void
    {
        config(['services.openai.key' => 'test-key']);
        Http::fake([
            'api.openai.com/*' => Http::response([
                'status' => 'completed',
                'output' => [[
                    'content' => [[
                        'type' => 'output_text',
                        'text' => json_encode([
                            'extracted_text' => collect($items)->pluck('raw')->implode("\n"),
                            'items' => $items,
                        ]),
                    ]],
                ]],
            ]),
        ]);
    }
}
