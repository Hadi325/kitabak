<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use App\Models\VerificationCode;
use App\Notifications\AdminOtpDailyLimitReached;
use App\Services\PhoneVerificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Notification;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class PhoneVerificationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config()->set('services.twilio', [
            'sid' => 'AC_test',
            'token' => 'secret-token',
            'whatsapp_from' => '+15005550006',
            'templates' => [
                'otp_en' => 'HX_english',
                'otp_ar' => 'HX_arabic',
            ],
        ]);
    }

    public function test_phone_registration_sends_hashed_whatsapp_otp_without_authenticating(): void
    {
        $sentCode = null;
        Http::fake(function (Request $request) use (&$sentCode) {
            $sentCode = json_decode($request['ContentVariables'], true, flags: JSON_THROW_ON_ERROR)['1'];

            return Http::response(['sid' => 'SM_test'], 201);
        });

        $response = $this->post(route('register'), $this->registrationData());

        $user = User::where('phone', '+96170123456')->firstOrFail();
        $record = VerificationCode::whereBelongsTo($user)->firstOrFail();

        $this->assertGuest();
        $response->assertRedirect(route('phone.verify.notice'));
        $this->assertSame(User::REGISTRATION_PHONE, $user->registration_method);
        $this->assertNull($user->phone_verified_at);
        $this->assertSame(6, strlen($sentCode));
        $this->assertTrue(Hash::check($sentCode, $record->code_hash));
        $this->assertNotSame($sentCode, $record->code_hash);
        $this->assertTrue($record->expires_at->between(now()->addMinutes(4), now()->addMinutes(5)->addSecond()));

        Http::assertSent(fn (Request $request) => $request->url() === 'https://api.twilio.com/2010-04-01/Accounts/AC_test/Messages.json'
            && $request['From'] === 'whatsapp:+15005550006'
            && $request['To'] === 'whatsapp:+96170123456'
            && $request['ContentSid'] === 'HX_english'
        );
    }

    public function test_valid_otp_verifies_phone_deletes_code_and_authenticates_user(): void
    {
        $user = User::factory()->create([
            'email' => null,
            'phone' => '+96170123456',
            'phone_verified_at' => null,
        ]);
        VerificationCode::create([
            'user_id' => $user->id,
            'code_hash' => Hash::make('123456'),
            'expires_at' => now()->addMinutes(5),
        ]);

        $response = $this
            ->withSession(['phone_verification_user_id' => $user->id])
            ->post(route('phone.verify'), ['code' => '123456']);

        $response->assertRedirect(route('dashboard', absolute: false));
        $this->assertAuthenticatedAs($user);
        $this->assertNotNull($user->refresh()->phone_verified_at);
        $this->assertDatabaseMissing('verification_codes', ['user_id' => $user->id]);
        $response->assertSessionMissing('phone_verification_user_id');
    }

    public function test_legacy_unverified_phone_receives_code_when_verification_screen_opens(): void
    {
        Http::fake(['api.twilio.com/*' => Http::response(['sid' => 'SM_test'], 201)]);
        $user = User::factory()->create([
            'phone' => '+96170123456',
            'phone_verified_at' => null,
        ]);

        $this
            ->actingAs($user)
            ->withSession(['phone_verification_user_id' => $user->id])
            ->get(route('phone.verify.notice'))
            ->assertOk();

        $this->assertSame(1, VerificationCode::whereBelongsTo($user)->count());
        Http::assertSentCount(1);

        $this->get(route('phone.verify.notice'))->assertOk();

        Http::assertSentCount(1);
    }

    public function test_expired_otp_is_rejected(): void
    {
        $user = User::factory()->create(['email' => null, 'phone' => '+96170123456']);
        VerificationCode::create([
            'user_id' => $user->id,
            'code_hash' => Hash::make('123456'),
            'expires_at' => now()->subSecond(),
        ]);

        $response = $this
            ->withSession(['phone_verification_user_id' => $user->id])
            ->post(route('phone.verify'), ['code' => '123456']);

        $this->assertGuest();
        $response->assertSessionHasErrors('code');
        $this->assertNull($user->refresh()->phone_verified_at);
    }

    public function test_resend_replaces_old_code_and_uses_arabic_template(): void
    {
        app()->setLocale('ar');
        Http::fake(['api.twilio.com/*' => Http::response(['sid' => 'SM_test'], 201)]);
        $user = User::factory()->create(['email' => null, 'phone' => '+96170123456']);
        $old = VerificationCode::create([
            'user_id' => $user->id,
            'code_hash' => Hash::make('123456'),
            'expires_at' => now()->addMinute(),
        ]);

        $response = $this
            ->withSession(['phone_verification_user_id' => $user->id])
            ->post(route('phone.verify.resend'));

        $response->assertSessionHas('status', 'verification-code-sent');
        $this->assertDatabaseMissing('verification_codes', ['id' => $old->id]);
        $this->assertSame(1, VerificationCode::whereBelongsTo($user)->count());
        Http::assertSent(fn (Request $request) => $request['ContentSid'] === 'HX_arabic');
    }

    public function test_failed_whatsapp_send_does_not_leave_an_unusable_account(): void
    {
        Http::fake(['api.twilio.com/*' => Http::response(['message' => 'failed'], 500)]);

        $response = $this->from(route('register'))->post(route('register'), $this->registrationData());

        $this->assertGuest();
        $response->assertRedirect(route('register'));
        $response->assertSessionHasErrors('phone');
        $this->assertDatabaseMissing('users', ['phone' => '+96170123456']);
    }

    public function test_admin_is_alerted_once_when_a_phone_reaches_six_otp_sends(): void
    {
        Notification::fake();
        Http::fake(['api.twilio.com/*' => Http::response(['sid' => 'SM_test'], 201)]);

        Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $user = User::factory()->create([
            'phone' => '+96170123456',
            'phone_verified_at' => null,
        ]);
        $verification = app(PhoneVerificationService::class);

        foreach ([0, 60, 60, 900, 1800, 7200] as $wait) {
            if ($wait > 0) {
                $this->travel($wait)->seconds();
            }

            $verification->issue($user);
        }

        Notification::assertSentToTimes($admin, AdminOtpDailyLimitReached::class, 1);
        Notification::assertSentTo(
            $admin,
            AdminOtpDailyLimitReached::class,
            fn (AdminOtpDailyLimitReached $notification) => $notification->userId === $user->id
                && str_ends_with($notification->maskedPhone, '3456'),
        );
        Http::assertSentCount(6);
    }

    private function registrationData(): array
    {
        return [
            'name' => 'Phone User',
            'registration_method' => 'phone',
            'phone' => '70 123 456',
            'password' => 'password',
            'password_confirmation' => 'password',
        ];
    }
}
