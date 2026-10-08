<?php

namespace App\Http\Controllers\Auth;

use App\Exceptions\OtpSendRateLimitException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Services\PhoneVerificationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request, PhoneVerificationService $phoneVerification): RedirectResponse
    {
        $request->authenticate();

        $user = $request->user();
        if ($user && $user->email === null && $user->phone_verified_at === null) {
            Auth::guard('web')->logout();
            $request->session()->put('phone_verification_user_id', $user->id);

            try {
                $phoneVerification->issue($user, app()->getLocale());
            } catch (OtpSendRateLimitException) {
                return redirect()->route('phone.verify.notice');
            } catch (Throwable $exception) {
                report($exception);

                return back()->withErrors([
                    'login' => __('Unable to send a WhatsApp code right now. Please try again.'),
                ]);
            }

            return redirect()->route('phone.verify.notice');
        }

        $request->session()->regenerate();

        if ($user && filled($user->email) && ! $user->hasRole('admin') && ! $user->hasVerifiedEmail()) {
            return redirect()->intended(route('verification.notice', absolute: false));
        }

        return redirect()->intended(route('dashboard', absolute: false));
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return redirect('/');
    }
}
