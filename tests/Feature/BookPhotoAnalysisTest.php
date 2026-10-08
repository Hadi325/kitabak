<?php

namespace Tests\Feature;

use App\Models\Book;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class BookPhotoAnalysisTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_cannot_analyze_book_photos(): void
    {
        $this->postJson(route('books.analyze-photos'))
            ->assertUnauthorized();
    }

    public function test_a_front_cover_is_required(): void
    {
        $user = User::factory()->withPhone()->create(['email_verified_at' => now()]);

        $this->actingAs($user)
            ->postJson(route('books.analyze-photos'))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('front');
    }

    public function test_a_back_cover_is_required(): void
    {
        $user = User::factory()->withPhone()->create(['email_verified_at' => now()]);

        $this->actingAs($user)
            ->postJson(route('books.analyze-photos'), ['front' => $this->image('front.png')])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('back');
    }

    public function test_it_uses_openai_and_returns_normalized_catalog_fields(): void
    {
        config([
            'services.openai.key' => 'test-key',
            'services.openai.url' => 'https://api.openai.test/v1',
            'services.openai.model' => 'gpt-5.6-luna',
        ]);

        Http::fake([
            'api.openai.test/*' => Http::response([
                'status' => 'completed',
                'output' => [[
                    'type' => 'message',
                    'content' => [[
                        'type' => 'output_text',
                        'text' => json_encode([
                            'is_book' => true,
                            'confidence' => 0.93,
                            'title' => 'Le voyage des mots',
                            'author' => 'Marcelle Abinader',
                            'book_type' => 'workbook',
                            'part' => 'Tome II',
                            'subject' => 'Français',
                            'grade' => '5',
                            'publisher' => 'CRDP',
                            'language' => 'French',
                            'edition_year' => 2024,
                            'isbn' => '0-306-40615-2',
                            'barcode' => null,
                            'warning' => null,
                        ]),
                    ]],
                ]],
            ]),
        ]);

        $user = User::factory()->withPhone()->create(['email_verified_at' => now()]);

        $response = $this->actingAs($user)->post(route('books.analyze-photos'), [
            'front' => $this->image('front.png'),
            'back' => $this->image('back.png'),
        ]);

        $response->assertOk()
            ->assertJsonPath('data.is_book', true)
            ->assertJsonPath('data.title', 'Le voyage des mots')
            ->assertJsonPath('data.subject', 'Français')
            ->assertJsonPath('data.book_type', 'workbook')
            ->assertJsonPath('data.part', '2')
            ->assertJsonPath('data.grade', '5')
            ->assertJsonPath('data.language', 'french')
            ->assertJsonPath('data.edition_year', 2024)
            ->assertJsonPath('data.isbn', '9780306406157');

        Http::assertSent(fn ($request) => $request->url() === 'https://api.openai.test/v1/responses'
            && $request['model'] === 'gpt-5.6-luna'
            && $request['reasoning']['effort'] === 'none'
            && $request['store'] === false
            && count($request['input'][0]['content']) === 5
            && $request['input'][0]['content'][2]['detail'] === 'high'
            && $request['input'][0]['content'][4]['detail'] === 'high'
            && $request['text']['format']['type'] === 'json_schema'
            && $request['text']['format']['strict'] === true
            && in_array('barcode', $request['text']['format']['schema']['required'], true)
            && in_array('book_type', $request['text']['format']['schema']['required'], true)
            && in_array('part', $request['text']['format']['schema']['required'], true)
            && $request['text']['format']['schema']['properties']['book_type']['enum'] === ['textbook', 'workbook', null]
            && $request->hasHeader('Authorization', 'Bearer test-key')
        );
    }

    public function test_similar_catalog_matches_exclude_different_book_types_and_parts(): void
    {
        config([
            'services.openai.key' => 'test-key',
            'services.openai.url' => 'https://api.openai.test/v1',
        ]);

        $otherBookType = Book::create([
            'title' => 'Mathematics for School',
            'book_type' => 'textbook',
            'part' => '2',
        ]);
        $otherWorkbookPart = Book::create([
            'title' => 'Mathematics for School',
            'book_type' => 'workbook',
            'part' => '1',
        ]);
        $exactMatch = Book::create([
            'title' => 'Mathematics for School',
            'book_type' => 'workbook',
            'part' => '2',
        ]);

        Http::fake([
            'api.openai.test/*' => Http::response([
                'status' => 'completed',
                'output' => [[
                    'content' => [[
                        'type' => 'output_text',
                        'text' => json_encode([
                            'is_book' => true,
                            'confidence' => 0.97,
                            'title' => 'Mathematics for School',
                            'author' => null,
                            'subject' => 'Mathematics',
                            'book_type' => 'workbook',
                            'part' => '2',
                            'grade' => '6',
                            'grade_evidence' => 'Grade 6',
                            'publisher' => null,
                            'language' => 'english',
                            'edition_year' => null,
                            'isbn' => null,
                            'barcode' => null,
                            'warning' => null,
                        ]),
                    ]],
                ]],
            ]),
        ]);

        $user = User::factory()->withPhone()->create(['email_verified_at' => now()]);

        $response = $this->actingAs($user)->post(route('books.analyze-photos'), [
            'front' => $this->image('front.png'),
            'back' => $this->image('back.png'),
        ]);

        $response->assertOk()
            ->assertJsonPath('data.matches.0.id', $exactMatch->id)
            ->assertJsonPath('data.matches.0.book_type', 'workbook')
            ->assertJsonPath('data.matches.0.part', '2')
            ->assertJsonCount(1, 'data.matches')
            ->assertJsonMissing(['id' => $otherWorkbookPart->id])
            ->assertJsonMissing(['id' => $otherBookType->id]);
    }

    public function test_it_extracts_a_visible_custom_barcode_without_inventing_an_isbn(): void
    {
        config([
            'services.openai.key' => 'test-key',
            'services.openai.url' => 'https://api.openai.test/v1',
        ]);

        Http::fake([
            'api.openai.test/*' => Http::response([
                'status' => 'completed',
                'output' => [[
                    'content' => [[
                        'type' => 'output_text',
                        'text' => json_encode([
                            'is_book' => true,
                            'confidence' => 0.98,
                            'title' => 'De la LANGUE à la LITTÉRATURE',
                            'author' => null,
                            'subject' => 'Français',
                            'grade' => '11',
                            'grade_evidence' => 'Deuxième Année Série Humanités',
                            'publisher' => 'Centre National de Recherche et de Développement Pédagogiques',
                            'language' => 'french',
                            'edition_year' => null,
                            'isbn' => null,
                            'barcode' => ' 7ss026 ',
                            'warning' => null,
                        ], JSON_UNESCAPED_UNICODE),
                    ]],
                ]],
            ]),
        ]);

        $user = User::factory()->withPhone()->create(['email_verified_at' => now()]);

        $this->actingAs($user)
            ->post(route('books.analyze-photos'), [
                'front' => $this->image('front.png'),
                'back' => $this->image('back.png'),
            ])
            ->assertOk()
            ->assertJsonPath('data.isbn', null)
            ->assertJsonPath('data.barcode', '7SS026')
            ->assertJsonPath('data.barcode_format', 'AI_VISION');
    }

    public function test_it_returns_a_safe_error_when_openai_is_not_configured(): void
    {
        config(['services.openai.key' => null]);
        $user = User::factory()->withPhone()->create(['email_verified_at' => now()]);

        $this->actingAs($user)
            ->post(route('books.analyze-photos'), [
                'front' => $this->image('front.png'),
                'back' => $this->image('back.png'),
            ])
            ->assertStatus(503)
            ->assertJsonPath('message', 'OpenAI is not configured. Add OPENAI_API_KEY to the environment.');

        Http::assertNothingSent();
    }

    public function test_a_third_secondary_sociology_and_economics_book_maps_to_se(): void
    {
        config([
            'services.openai.key' => 'test-key',
            'services.openai.url' => 'https://api.openai.test/v1',
        ]);

        Http::fake([
            'api.openai.test/*' => Http::response([
                'status' => 'completed',
                'output' => [[
                    'content' => [[
                        'type' => 'output_text',
                        'text' => json_encode([
                            'is_book' => true,
                            'confidence' => 0.95,
                            'title' => 'المنير في الأدب العربي',
                            'subject' => 'الأدب العربي',
                            'grade' => '3',
                            'grade_evidence' => 'التعليم الثانوي - السنة الثالثة - فرع الاجتماع والاقتصاد',
                            'language' => 'arabic',
                        ], JSON_UNESCAPED_UNICODE),
                    ]],
                ]],
            ]),
        ]);

        $user = User::factory()->withPhone()->create(['email_verified_at' => now()]);

        $this->actingAs($user)
            ->post(route('books.analyze-photos'), [
                'front' => $this->image('front.png'),
                'back' => $this->image('back.png'),
            ])
            ->assertOk()
            ->assertJsonPath('data.grade', 'SE');
    }

    public function test_it_explains_when_the_openai_rate_limit_is_reached(): void
    {
        config(['services.openai.key' => 'test-key']);
        Http::fake([
            '*' => Http::response([
                'error' => [
                    'message' => 'Rate limit reached. Please try again in 10.5825s.',
                    'code' => 'rate_limit_exceeded',
                ],
            ], 429),
        ]);
        $user = User::factory()->withPhone()->create(['email_verified_at' => now()]);

        $this->actingAs($user)
            ->post(route('books.analyze-photos'), [
                'front' => $this->image('front.png'),
                'back' => $this->image('back.png'),
            ])
            ->assertStatus(429)
            ->assertJsonPath('retry_after', 11)
            ->assertJsonPath('message', 'The OpenAI rate limit was reached. Wait 11 seconds, then try again.');
    }

    private function image(string $name): UploadedFile
    {
        $png = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=');

        return UploadedFile::fake()->createWithContent($name, $png);
    }
}
