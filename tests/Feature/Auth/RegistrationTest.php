<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use RuntimeException;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_screen_can_be_rendered(): void
    {
        $response = $this->get('/register');

        $response->assertStatus(200);
    }

    public function test_new_users_can_register(): void
    {
        Notification::fake();

        $response = $this->post('/register', [
            'name' => 'Test User',
            'registration_method' => 'email',
            'email' => 'test@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('verification.notice', absolute: false));
        $response->assertSessionHas('status', 'verification-link-sent');

        $user = User::where('email', 'test@example.com')->firstOrFail();

        $this->assertSame(User::REGISTRATION_EMAIL, $user->registration_method);
        Notification::assertSentTo($user, VerifyEmail::class);
    }

    public function test_registration_survives_an_email_delivery_failure(): void
    {
        Notification::shouldReceive('send')
            ->once()
            ->andThrow(new RuntimeException('SMTP authentication failed'));

        $response = $this->post('/register', [
            'name' => 'Test User',
            'registration_method' => 'email',
            'email' => 'test@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $this->assertAuthenticated();
        $this->assertDatabaseHas('users', ['email' => 'test@example.com']);
        $response->assertRedirect(route('verification.notice', absolute: false));
        $response->assertSessionHas(
            'verification_error',
            'verification-email-send-failed',
        );
    }
}
