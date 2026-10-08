<?php

namespace App\Http\Controllers\Auth;

use App\Contracts\FirebaseTokenVerifier;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Throwable;

class FirebaseSessionController extends Controller
{
    public function store(
        Request $request,
        FirebaseTokenVerifier $firebase,
    ): RedirectResponse {
        $validated = $request->validate([
            'id_token' => ['required', 'string', 'max:10000'],
        ]);

        try {
            $identity = $firebase->verify($validated['id_token']);
        } catch (Throwable $exception) {
            report($exception);

            throw ValidationException::withMessages([
                'google' => __('Google sign-in could not be verified. Please try again.'),
            ]);
        }

        $uid = trim($identity['uid'] ?? '');
        $email = Str::lower(trim($identity['email'] ?? ''));

        if (
            $uid === ''
            || $email === ''
            || ! ($identity['email_verified'] ?? false)
            || ($identity['sign_in_provider'] ?? null) !== 'google.com'
        ) {
            throw ValidationException::withMessages([
                'google' => __('A verified Google account is required.'),
            ]);
        }

        $user = DB::transaction(function () use ($identity, $uid, $email): User {
            $user = User::query()
                ->where('firebase_uid', $uid)
                ->lockForUpdate()
                ->first();

            if ($user && Str::lower($user->email) !== $email) {
                throw ValidationException::withMessages([
                    'google' => __('This Google account does not match the linked account.'),
                ]);
            }

            if (! $user) {
                $user = User::query()
                    ->whereRaw('LOWER(email) = ?', [$email])
                    ->lockForUpdate()
                    ->first();
            }

            if ($user && $user->firebase_uid && $user->firebase_uid !== $uid) {
                throw ValidationException::withMessages([
                    'google' => __('This email is already linked to another Google account.'),
                ]);
            }

            if ($user) {
                $user->forceFill([
                    'firebase_uid' => $uid,
                    'email_verified_at' => $user->email_verified_at ?? now(),
                ])->save();

                return $user;
            }

            $name = trim($identity['name'] ?? '') ?: Str::before($email, '@');

            $user = User::create([
                'name' => $name,
                'email' => $email,
                'firebase_uid' => $uid,
                'password' => Hash::make(Str::random(64)),
                'password_set_at' => null,
                'role' => 'user',
                'registration_method' => User::REGISTRATION_EMAIL,
            ]);

            $user->forceFill(['email_verified_at' => now()])->save();
            $user->assignRole('user');

            return $user;
        });

        Auth::guard('web')
            ->setRememberDuration((int) config('auth.google_remember_minutes', 7 * 24 * 60))
            ->login($user, true);
        $request->session()->regenerate();

        return redirect()->intended(route('dashboard', absolute: false));
    }
}
