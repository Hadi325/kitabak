<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\PhoneVerificationService;
use App\Support\PhoneNumber;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Register');
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws ValidationException
     */
    public function store(Request $request, PhoneVerificationService $phoneVerification): RedirectResponse
    {
        $method = $request->string('registration_method')->toString();
        $normalizedPhone = $method === 'phone'
            ? PhoneNumber::normalize($request->string('phone')->toString())
            : null;

        $request->merge([
            'email' => $method === 'email' ? Str::lower($request->string('email')->toString()) : null,
            'phone' => $normalizedPhone,
        ]);

        $request->validate([
            'name' => 'required|string|max:255',
            'registration_method' => ['required', Rule::in(['email', 'phone'])],
            'email' => [Rule::requiredIf($method === 'email'), 'nullable', 'string', 'email', 'max:255', Rule::unique(User::class, 'email')],
            'phone' => [
                Rule::requiredIf($method === 'phone'),
                'nullable',
                'string',
                'max:20',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if (filled($value) && PhoneNumber::normalize((string) $value) === null) {
                        $fail('Enter a valid phone number including the country code.');
                    }
                },
                Rule::unique(User::class, 'phone'),
            ],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'password' => Hash::make($request->password),
            'password_set_at' => now(),
            'role' => 'user',
            'registration_method' => $method,
        ]);

        $user->assignRole('user');

        if ($method === 'phone') {
            session(['phone_verification_user_id' => $user->id]);

            try {
                $phoneVerification->issue($user, app()->getLocale());
            } catch (Throwable $exception) {
                report($exception);
                session()->forget('phone_verification_user_id');
                $user->delete();

                return back()
                    ->withErrors(['phone' => __('Unable to send a WhatsApp code right now. Please try again.')])
                    ->withInput($request->except(['password', 'password_confirmation']));
            }

            return redirect()->route('phone.verify.notice');
        }

        Auth::login($user);

        try {
            event(new Registered($user));
        } catch (Throwable $exception) {
            report($exception);

            return redirect()
                ->route('verification.notice')
                ->with('verification_error', 'verification-email-send-failed');
        }

        return redirect()
            ->route('verification.notice')
            ->with('status', 'verification-link-sent');
    }
}
