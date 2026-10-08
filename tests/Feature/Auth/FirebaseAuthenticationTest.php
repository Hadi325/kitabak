<?php

namespace Tests\Feature\Auth;

use App\Contracts\FirebaseTokenVerifier;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class FirebaseAuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_verified_google_user_can_create_an_account_and_login(): void
    {
        Role::firstOrCreate(['name' => 'user', 'guard_name' => 'web']);
        $this->bindFirebaseIdentity([
            'uid' => 'firebase-uid-1',
            'email' => 'New.User@Example.com',
            'email_verified' => true,
            'name' => 'New User',
            'sign_in_provider' => 'google.com',
        ]);

        $response = $this->post(route('auth.firebase'), [
            'id_token' => 'valid-firebase-token',
        ]);

        $response->assertRedirect(route('dashboard', absolute: false));
        $this->assertAuthenticated();

        $user = User::where('email', 'new.user@example.com')->firstOrFail();
        $this->assertSame('firebase-uid-1', $user->firebase_uid);
        $this->assertSame(User::REGISTRATION_EMAIL, $user->registration_method);
        $this->assertNotNull($user->email_verified_at);
        $this->assertNull($user->password_set_at);
        $this->assertTrue($user->hasRole('user'));
    }

    public function test_google_login_survives_a_lost_session_for_one_week_and_logout_revokes_it(): void
    {
        Role::firstOrCreate(['name' => 'user', 'guard_name' => 'web']);
        $this->bindFirebaseIdentity([
            'uid' => 'remembered-google-user',
            'email' => 'remembered@example.com',
            'email_verified' => true,
            'name' => 'Remembered User',
            'sign_in_provider' => 'google.com',
        ]);

        $response = $this->post(route('auth.firebase'), [
            'id_token' => 'valid-firebase-token',
        ]);

        $user = User::where('email', 'remembered@example.com')->firstOrFail();
        $recallerName = Auth::guard('web')->getRecallerName();
        $recaller = collect($response->headers->getCookies())
            ->first(fn ($cookie) => $cookie->getName() === $recallerName);

        $this->assertNotNull($recaller);
        $this->assertNotEmpty($user->remember_token);
        $this->assertTrue($recaller->isHttpOnly());
        $this->assertGreaterThanOrEqual(7 * 24 * 60 * 60 - 5, $recaller->getMaxAge());
        $this->assertLessThanOrEqual(7 * 24 * 60 * 60, $recaller->getMaxAge());

        $oldRememberToken = $user->remember_token;
        $this->flushSession();
        Auth::forgetGuards();

        $this->withUnencryptedCookie($recallerName, $recaller->getValue())
            ->get(route('dashboard'))
            ->assertOk();
        $this->assertAuthenticatedAs($user);

        $this->post(route('logout'))->assertRedirect('/');
        $this->assertGuest();
        $this->assertNotSame($oldRememberToken, $user->refresh()->remember_token);
    }

    public function test_google_sign_in_links_an_existing_email_without_changing_its_role(): void
    {
        Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
        $user = User::factory()->unverified()->create([
            'email' => 'existing@example.com',
        ]);
        $user->assignRole('admin');

        $this->bindFirebaseIdentity([
            'uid' => 'firebase-uid-2',
            'email' => 'existing@example.com',
            'email_verified' => true,
            'name' => 'Existing User',
            'sign_in_provider' => 'google.com',
        ]);

        $this->post(route('auth.firebase'), [
            'id_token' => 'valid-firebase-token',
        ])->assertRedirect(route('dashboard', absolute: false));

        $user->refresh();

        $this->assertAuthenticatedAs($user);
        $this->assertSame('firebase-uid-2', $user->firebase_uid);
        $this->assertNotNull($user->email_verified_at);
        $this->assertNotNull($user->password_set_at);
        $this->assertTrue($user->hasRole('admin'));
        $this->assertFalse($user->hasRole('user'));
    }

    public function test_new_google_user_receives_default_user_role(): void
    {
        $this->bindFirebaseIdentity([
           'uid' => 'test-firebase-uid',
'email' => 'testuser@example.com',
'email_verified' => true,
'name' => 'Test User',
'sign_in_provider' => 'google.com',
        ]);

        $this->post(route('auth.firebase'), [
            'id_token' => 'valid-test-firebase-token',
        ])->assertRedirect(route('dashboard', absolute: false));

        $user = User::where('email', 'testuser@example.com')->firstOrFail();

$this->assertSame('test-firebase-uid', $user->firebase_uid);
$this->assertNotNull($user->email_verified_at);
$this->assertFalse($user->hasRole('admin'));
$this->assertTrue($user->hasRole('user'));
    }

    public function test_a_non_google_firebase_token_is_rejected(): void
    {
        $this->bindFirebaseIdentity([
            'uid' => 'firebase-uid-3',
            'email' => 'user@example.com',
            'email_verified' => true,
            'name' => 'User',
            'sign_in_provider' => 'password',
        ]);

        $response = $this->from('/login')->post(route('auth.firebase'), [
            'id_token' => 'valid-but-not-google-token',
        ]);

        $response->assertRedirect('/login');
        $response->assertSessionHasErrors('google');
        $this->assertGuest();
        $this->assertDatabaseMissing('users', ['email' => 'user@example.com']);
    }

    /** @param array<string, mixed> $identity */
    private function bindFirebaseIdentity(array $identity): void
    {
        $this->app->instance(
            FirebaseTokenVerifier::class,
            new class($identity) implements FirebaseTokenVerifier
            {
                /** @param array<string, mixed> $identity */
                public function __construct(private readonly array $identity) {}

                public function verify(string $idToken): array
                {
                    return $this->identity;
                }
            },
        );
    }
}
