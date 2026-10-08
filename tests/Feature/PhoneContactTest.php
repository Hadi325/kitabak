<?php

namespace Tests\Feature;

use App\Models\Book;
use App\Models\Listing;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class PhoneContactTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config()->set('services.twilio', [
            'sid' => 'AC_test',
            'token' => 'secret-token',
            'whatsapp_from' => '+15005550006',
            'templates' => ['otp_en' => 'HX_english', 'otp_ar' => 'HX_arabic'],
        ]);
    }

    public function test_user_without_a_phone_is_sent_to_phone_completion_before_adding_a_book(): void
    {
        $user = User::factory()->create(['phone' => null]);

        $response = $this->actingAs($user)->get(route('add.book'));

        $response->assertRedirect(route('profile.phone.edit'));
        $this->assertSame(route('add.book'), session('url.intended'));
    }

    public function test_user_must_verify_the_added_phone_before_continuing_to_add_book(): void
    {
        $sentCode = null;
        Http::fake(function (Request $request) use (&$sentCode) {
            $sentCode = json_decode($request['ContentVariables'], true, flags: JSON_THROW_ON_ERROR)['1'];

            return Http::response(['sid' => 'SM_test'], 201);
        });
        $user = User::factory()->create(['phone' => null]);

        $this->actingAs($user)->get(route('add.book'));

        $response = $this->patch(route('profile.phone.update'), [
            'phone' => '70 123 456',
        ]);

        $response->assertRedirect(route('phone.verify.notice'));
        $this->assertSame('+96170123456', $user->refresh()->phone);
        $this->assertNull($user->phone_verified_at);

        $this->get(route('add.book'))->assertRedirect(route('phone.verify.notice'));

        $response = $this->post(route('phone.verify'), ['code' => $sentCode]);

        $response->assertRedirect(route('add.book'));
        $this->assertNotNull($user->refresh()->phone_verified_at);
        $this->get(route('add.book'))->assertOk();
    }

    public function test_authenticated_reader_can_open_the_book_owners_whatsapp_chat(): void
    {
        $owner = User::factory()->withPhone('+96170123456')->create(['name' => 'Book Owner']);
        $reader = User::factory()->create();
        $book = Book::query()->create([
            'title' => 'The Test Book',
            'created_by' => $owner->id,
        ]);
        Listing::query()->create([
            'book_id' => $book->id,
            'seller_id' => $owner->id,
            'price' => 10,
            'status' => 'available',
        ]);

        $response = $this->actingAs($reader)->get(route('books.contact.whatsapp', $book));

        $response->assertRedirectContains('https://wa.me/96170123456?text=');

        parse_str(parse_url($response->headers->get('Location'), PHP_URL_QUERY), $query);

        $this->assertStringContainsString('The Test Book', $query['text']);
        $this->assertStringContainsString(route('listings.show', $book->listings()->first()), $query['text']);
    }

    public function test_phone_numbers_are_not_exposed_in_the_books_page_payload(): void
    {
        Role::firstOrCreate([
            'name' => 'admin',
            'guard_name' => 'web',
        ]);
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $owner = User::factory()->withPhone('+96170123456')->create();
        Book::query()->create(['title' => 'Private Contact Book', 'created_by' => $owner->id]);

        $this->actingAs($admin)
            ->get(route('books'))
            ->assertOk()
            ->assertDontSee('+96170123456');
    }
}
