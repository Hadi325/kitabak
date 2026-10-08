<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\PhoneVerificationService;
use App\Support\PhoneNumber;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class ProfilePhoneController extends Controller
{
    public function edit(Request $request): Response|RedirectResponse
    {
        if (filled($request->user()->phone)) {
            if ($request->user()->phone_verified_at) {
                return redirect()->intended(route('add.book'));
            }

            $request->session()->put('phone_verification_user_id', $request->user()->id);

            return redirect()->route('phone.verify.notice');
        }

        return Inertia::render('Profile/CompletePhone');
    }

    public function update(Request $request, PhoneVerificationService $verification): RedirectResponse
    {
        if ($request->user()->registeredWithPhone() && filled($request->user()->phone)) {
            throw ValidationException::withMessages([
                'phone' => __('profile.phone_locked'),
            ]);
        }

        $normalized = PhoneNumber::normalize($request->string('phone')->toString());
        $request->merge(['phone' => $normalized]);

        $validated = $request->validate([
            'phone' => [
                'required',
                'string',
                'max:20',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if (PhoneNumber::normalize((string) $value) === null) {
                        $fail('Enter a valid phone number including the country code.');
                    }
                },
                Rule::unique(User::class, 'phone')->ignore($request->user()->id),
            ],
        ]);

        $request->user()->forceFill([
            'phone' => $validated['phone'],
            'phone_verified_at' => null,
        ])->save();

        $request->session()->put('phone_verification_user_id', $request->user()->id);

        try {
            $verification->issue($request->user(), app()->getLocale());
        } catch (Throwable $exception) {
            report($exception);
            $request->user()->forceFill(['phone' => null])->save();
            $request->session()->forget('phone_verification_user_id');

            return back()->withErrors([
                'phone' => __('Unable to send a WhatsApp code right now. Please try again.'),
            ]);
        }

        return redirect()->route('phone.verify.notice');
    }
}
