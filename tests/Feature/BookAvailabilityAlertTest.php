<?php

namespace Tests\Feature;

use App\Models\Book;
use App\Models\BookAlertSubscription;
use App\Models\Listing;
use App\Models\User;
use App\Notifications\BookAvailableNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class BookAvailabilityAlertTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_guest_is_asked_to_log_in_before_enabling_an_alert(): void
    {
        $this->post(route('book-alerts.store'), [
            'items' => [['title' => 'Le voyage des mots']],
        ])->assertRedirect(route('login'));
    }

    public function test_a_user_can_enable_alerts_for_many_missing_books_without_duplicates(): void
    {
        $user = User::factory()->create();

        $payload = [
            'locale' => 'fr',
            'items' => [
                [
                    'title' => 'Le voyage des mots',
                    'subject' => 'Français',
                    'grade' => '5',
                ],
                [
                    'title' => 'A nous les maths',
                    'subject' => 'Mathématiques',
                    'grade' => '5',
                ],
            ],
        ];

        $this->actingAs($user)
            ->postJson(route('book-alerts.store'), $payload)
            ->assertOk()
            ->assertJsonCount(2, 'subscriptions');

        $this->actingAs($user)
            ->postJson(route('book-alerts.store'), $payload)
            ->assertOk()
            ->assertJsonCount(2, 'subscriptions');

        $this->assertDatabaseCount('book_alert_subscriptions', 2);
        $this->assertDatabaseHas('book_alert_subscriptions', [
            'user_id' => $user->id,
            'title' => 'Le voyage des mots',
            'locale' => 'fr',
            'is_active' => true,
        ]);
    }

    public function test_an_email_registered_user_is_notified_when_another_user_lists_the_book(): void
    {
        Notification::fake();

        $subscriber = User::factory()->create();
        $seller = User::factory()->create();

        $this->actingAs($subscriber)
            ->postJson(route('book-alerts.store'), [
                'locale' => 'en',
                'items' => [[
                    'title' => 'Healing Is the New High',
                    'grade' => '11',
                ]],
            ])
            ->assertOk();

        $book = $this->createBook([
            'title' => 'HEALING IS THE NEW HIGH',
            'grade' => '11',
        ]);
        $listing = Listing::query()->create([
            'book_id' => $book->id,
            'seller_id' => $seller->id,
            'price' => 6,
            'status' => 'available',
            'location' => 'Beirut',
        ]);

        Notification::assertSentTo(
            $subscriber,
            BookAvailableNotification::class,
            fn (BookAvailableNotification $notification) => $notification->listing->is($listing),
        );

        $this->assertDatabaseHas('book_alert_subscriptions', [
            'user_id' => $subscriber->id,
            'is_active' => false,
            'matched_listing_id' => $listing->id,
        ]);
        $this->assertNotNull(
            BookAlertSubscription::query()->first()->notified_at,
        );
    }

    public function test_a_phone_registered_user_receives_the_whatsapp_template_alert(): void
    {
        config()->set('services.twilio.sid', 'AC_test');
        config()->set('services.twilio.token', 'token_test');
        config()->set('services.twilio.whatsapp_from', '+96170000000');
        config()->set('services.twilio.templates.book_alert_ar', 'HX_alert_ar');

        Http::fake([
            'api.twilio.com/*' => Http::response(['sid' => 'SM_test'], 201),
        ]);

        $subscriber = User::factory()
            ->phoneRegistered('+96171111111')
            ->create();
        $seller = User::factory()->create(['name' => 'Maya']);

        $this->actingAs($subscriber)
            ->postJson(route('book-alerts.store'), [
                'locale' => 'ar',
                'items' => [['title' => 'المنير في الأدب العربي']],
            ])
            ->assertOk();

        $book = $this->createBook([
            'title' => 'المنير في الأدب العربي',
        ]);
        $listing = Listing::query()->create([
            'book_id' => $book->id,
            'seller_id' => $seller->id,
            'price' => 10,
            'status' => 'available',
        ]);

        Http::assertSent(function (Request $request) use ($listing): bool {
            $variables = json_decode(
                (string) $request['ContentVariables'],
                true,
                flags: JSON_THROW_ON_ERROR,
            );

            return str_contains($request->url(), '/Accounts/AC_test/Messages.json')
                && $request['To'] === 'whatsapp:+96171111111'
                && $request['ContentSid'] === 'HX_alert_ar'
                && $variables['2'] === 'المنير في الأدب العربي'
                && $variables['3'] === 'Maya'
                && str_contains($variables['4'], "/listings/{$listing->id}");
        });
    }

    public function test_a_different_grade_does_not_trigger_the_alert(): void
    {
        Notification::fake();

        $subscriber = User::factory()->create();
        $seller = User::factory()->create();

        $this->actingAs($subscriber)
            ->postJson(route('book-alerts.store'), [
                'items' => [[
                    'title' => 'Science for Tomorrow',
                    'grade' => '5',
                ]],
            ])
            ->assertOk();

        $book = $this->createBook([
            'title' => 'Science for Tomorrow',
            'grade' => '6',
        ]);

        Listing::query()->create([
            'book_id' => $book->id,
            'seller_id' => $seller->id,
            'price' => 12,
            'status' => 'available',
        ]);

        Notification::assertNothingSent();
        $this->assertDatabaseHas('book_alert_subscriptions', [
            'user_id' => $subscriber->id,
            'is_active' => true,
            'notified_at' => null,
        ]);
    }

    public function test_a_different_part_or_book_type_does_not_trigger_the_alert(): void
    {
        Notification::fake();

        $subscriber = User::factory()->create();
        $seller = User::factory()->create();

        $this->actingAs($subscriber)
            ->postJson(route('book-alerts.store'), [
                'items' => [[
                    'title' => 'Learning Together',
                    'book_type' => 'workbook',
                    'part' => '1',
                    'grade' => '5',
                ]],
            ])
            ->assertOk();

        $book = $this->createBook([
            'title' => 'Learning Together',
            'book_type' => 'textbook',
            'part' => '2',
            'grade' => '5',
        ]);

        Listing::query()->create([
            'book_id' => $book->id,
            'seller_id' => $seller->id,
            'price' => 12,
            'status' => 'available',
        ]);

        Notification::assertNothingSent();
        $this->assertDatabaseHas('book_alert_subscriptions', [
            'user_id' => $subscriber->id,
            'is_active' => true,
        ]);
    }

    private function createBook(array $attributes = []): Book
    {
        return Book::query()->create(array_merge([
            'title' => 'Test book',
            'subject' => 'Literature',
            'grade' => null,
            'created_by' => null,
        ], $attributes));
    }
}
