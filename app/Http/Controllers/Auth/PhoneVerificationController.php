<?php

namespace App\Http\Controllers\Auth;

use App\Exceptions\OtpSendRateLimitException;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\PhoneVerificationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class PhoneVerificationController extends Controller
{
    public function show(Request $request, PhoneVerificationService $verification): Response|RedirectResponse
    {
        $user = $this->pendingUser($request);

        if (! $user || ($user->phone_verified_at && ! $request->session()->has('phone_verification_pending_phone'))) {
            return redirect()->route('login');
        }

        $hasActiveCode = $user->verificationCodes()
            ->where('expires_at', '>', now())
            ->exists();

        $sendFailed = false;
        $retryAfter = 0;
        if (! $hasActiveCode) {
            try {
                $verification->issue($user, app()->getLocale(), $this->destination($request, $user));
            } catch (OtpSendRateLimitException $exception) {
                $retryAfter = $exception->retryAfter();
            } catch (Throwable $exception) {
                report($exception);
                $sendFailed = true;
            }
        }

        $retryAfter = max(
            $retryAfter,
            (int) session('otp_retry_after', 0),
            $verification->retryAfter($this->destination($request, $user)),
        );

        return Inertia::render('Auth/VerifyEmailCode', [
            'phone' => $this->maskedPhone($this->destination($request, $user)),
            'status' => session('status'),
            'sendFailed' => $sendFailed,
            'retryAfter' => $retryAfter,
        ]);
    }

    public function resend(Request $request, PhoneVerificationService $verification): RedirectResponse
    {
        $user = $this->pendingUser($request);

        if (! $user || ($user->phone_verified_at && ! $request->session()->has('phone_verification_pending_phone'))) {
            return redirect()->route('login');
        }

        try {
            $verification->issue($user, app()->getLocale(), $this->destination($request, $user));
        } catch (OtpSendRateLimitException $exception) {
            return back()
                ->withErrors([
                    'code' => __('Please wait before requesting another WhatsApp code.'),
                ])
                ->with('otp_retry_after', $exception->retryAfter());
        } catch (Throwable $exception) {
            report($exception);

            return back()->withErrors([
                'code' => __('Unable to send a WhatsApp code right now. Please try again.'),
            ]);
        }

        return back()->with('status', 'verification-code-sent');
    }

    public function verify(Request $request, PhoneVerificationService $verification): RedirectResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'digits:6'],
        ]);
        $user = $this->pendingUser($request);

        if (! $user) {
            return redirect()->route('login');
        }

        if (! $verification->verify($user, $validated['code'])) {
            throw ValidationException::withMessages([
                'code' => __('The verification code is invalid or expired.'),
            ]);
        }

        $pendingPhone = $request->session()->get('phone_verification_pending_phone');
        if ($pendingPhone !== null) {
            validator(
                ['phone' => $pendingPhone],
                ['phone' => ['required', Rule::unique(User::class, 'phone')->ignore($user->id)]],
            )->validate();
        }

        $user->forceFill([
            'phone' => $pendingPhone ?? $user->phone,
            'phone_verified_at' => now(),
        ])->save();
        $verification->clear($user);
        $request->session()->forget([
            'phone_verification_user_id',
            'phone_verification_pending_phone',
        ]);
        Auth::login($user);
        $request->session()->regenerate();

        return redirect()->intended(route('dashboard', absolute: false));
    }

    private function pendingUser(Request $request): ?User
    {
        $id = $request->session()->get('phone_verification_user_id');

        if ($request->user() && (int) $id !== (int) $request->user()->id) {
            return null;
        }

        return $id ? User::find($id) : null;
    }

    private function maskedPhone(?string $phone): string
    {
        $phone = (string) $phone;

        return strlen($phone) > 4
            ? str_repeat('•', strlen($phone) - 4).substr($phone, -4)
            : $phone;
    }

    private function destination(Request $request, User $user): string
    {
        return (string) ($request->session()->get('phone_verification_pending_phone') ?? $user->phone);
    }
}
