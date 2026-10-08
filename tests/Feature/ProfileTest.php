<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class ProfileTest extends TestCase
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

    public function test_profile_page_is_displayed(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->get('/profile');

        $response->assertOk();
    }

    public function test_profile_information_can_be_updated(): void
    {
        Notification::fake();
        $user = User::factory()->phoneRegistered('+96170111111')->create([
            'email' => 'old@example.com',
            'email_verified_at' => now(),
            'firebase_uid' => 'previous-google-link',
        ]);

        $response = $this
            ->actingAs($user)
            ->patch('/profile', [
                'name' => 'Test User',
                'email' => 'test@example.com',
                'phone' => '70 111 111',
            ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertSessionHas('status', 'verification-link-sent')
            ->assertRedirect(route('verification.notice'));

        $user->refresh();

        $this->assertSame('Test User', $user->name);
        $this->assertSame('test@example.com', $user->email);
        $this->assertNull($user->email_verified_at);
        $this->assertNull($user->firebase_uid);
        Notification::assertSentTo($user, VerifyEmail::class);
    }

    public function test_email_registered_account_cannot_change_its_email(): void
    {
        $user = User::factory()->create(['email' => 'original@example.com']);

        $response = $this->actingAs($user)->patch(route('profile.update'), [
            'name' => $user->name,
            'email' => 'different@example.com',
        ]);

        $response->assertSessionHasErrors('email');
        $this->assertSame('original@example.com', $user->refresh()->email);
    }

    public function test_phone_registered_account_cannot_change_its_phone(): void
    {
        $user = User::factory()->phoneRegistered('+96170111111')->create();

        $response = $this->actingAs($user)->patch(route('profile.update'), [
            'name' => $user->name,
            'email' => null,
            'phone' => '70 222 222',
        ]);

        $response->assertSessionHasErrors('phone');
        $this->assertSame('+96170111111', $user->refresh()->phone);

        $this->actingAs($user)
            ->patch(route('profile.phone.update'), ['phone' => '70 222 222'])
            ->assertSessionHasErrors('phone');

        $this->assertSame('+96170111111', $user->refresh()->phone);
    }

    public function test_email_verification_status_is_unchanged_when_the_email_address_is_unchanged(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->patch('/profile', [
                'name' => 'Test User',
                'email' => $user->email,
            ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect('/profile');

        $this->assertNotNull($user->refresh()->email_verified_at);
    }

    public function test_changed_phone_is_saved_only_after_whatsapp_verification(): void
    {
        $sentCode = null;
        Http::fake(function (Request $request) use (&$sentCode) {
            $sentCode = json_decode($request['ContentVariables'], true, flags: JSON_THROW_ON_ERROR)['1'];

            return Http::response(['sid' => 'SM_test'], 201);
        });
        $user = User::factory()->withPhone('+96170111111')->create();

        $response = $this->actingAs($user)->patch(route('profile.update'), [
            'name' => $user->name,
            'email' => $user->email,
            'phone' => '70 123 456',
        ]);

        $response->assertRedirect(route('phone.verify.notice'));
        $this->assertSame('+96170111111', $user->refresh()->phone);
        Http::assertSent(fn (Request $request) => $request['To'] === 'whatsapp:+96170123456');

        $this->get(route('phone.verify.notice'))->assertOk();

        $response = $this->post(route('phone.verify'), ['code' => $sentCode]);

        $response->assertRedirect(route('profile.edit'));
        $this->assertSame('+96170123456', $user->refresh()->phone);
        $this->assertNotNull($user->phone_verified_at);
    }

    public function test_user_can_delete_their_account(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->delete('/profile', [
                'password' => 'password',
            ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect('/');

        $this->assertGuest();
        $this->assertNull($user->fresh());
    }

    public function test_correct_password_must_be_provided_to_delete_account(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->from('/profile')
            ->delete('/profile', [
                'password' => 'wrong-password',
            ]);

        $response
            ->assertSessionHasErrors('password')
            ->assertRedirect('/profile');

        $this->assertNotNull($user->fresh());
    }
}
