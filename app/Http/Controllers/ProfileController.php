<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use App\Services\PhoneVerificationService;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class ProfileController extends Controller
{
    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): Response
    {
        $user = $request->user();

        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail' => $user instanceof MustVerifyEmail,

            'status' => session('status'),

            'phone' => $user->phone,

            'registrationMethod' => $user->registeredWithPhone()
                ? 'phone'
                : 'email',

            'hasPassword' => $user->hasPassword(),

            'profilePhotoUrl' => $user->profile_photo_path
                    ? Storage::url(
                        $user->profile_photo_path
                    )
                    : null,
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request, PhoneVerificationService $verification): RedirectResponse
    {
        $validated = $request->validated();
        $newPhone = $validated['phone'] ?? null;
        $phoneChanged = $newPhone !== $request->user()->phone;
        $newEmail = $validated['email'] ?? null;
        $emailChanged = $newEmail !== $request->user()->email;

        $request->user()->fill([
            'name' => $validated['name'],
            'email' => $newEmail,
        ]);

        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;

            if ($request->user()->registeredWithPhone()) {
                $request->user()->firebase_uid = null;
            }
        }

        $request->user()->save();

        if ($phoneChanged && $newPhone !== null) {
            $request->session()->put([
                'phone_verification_user_id' => $request->user()->id,
                'phone_verification_pending_phone' => $newPhone,
                'url.intended' => route('profile.edit'),
            ]);

            try {
                $verification->issue($request->user(), app()->getLocale(), $newPhone);
            } catch (Throwable $exception) {
                report($exception);
                $request->session()->forget([
                    'phone_verification_user_id',
                    'phone_verification_pending_phone',
                ]);

                return back()->withErrors([
                    'phone' => __('Unable to send a WhatsApp code right now. Please try again.'),
                ]);
            }

            return Redirect::route('phone.verify.notice');
        }

        if ($phoneChanged) {
            $request->user()->forceFill([
                'phone' => null,
                'phone_verified_at' => null,
            ])->save();
        }

        if ($emailChanged && $newEmail !== null) {
            try {
                $request->user()->sendEmailVerificationNotification();
            } catch (Throwable $exception) {
                report($exception);

                return Redirect::route('verification.notice')
                    ->with('verification_error', 'verification-email-send-failed');
            }

            return Redirect::route('verification.notice')
                ->with('status', 'verification-link-sent');
        }

      return Redirect::route('profile.edit')
    ->with([
        'success' => 'profile.updated_success',
        'flash_id' => (string) \Illuminate\Support\Str::uuid(),
    ]);
    }

    /**
     * Update the user's profile photo.
     */
    public function updatePhoto(

        Request $request
    ): RedirectResponse {
        $validated = $request->validate([
            'photo' => [
                'required',
                'image',
                'mimes:jpeg,jpg,png,webp',
                'max:5120',
            ],
        ]);
        app()->setLocale(
            $request->input('locale') === 'ar'
                ? 'ar'
                : 'en'
        );

        $user = $request->user();

        $oldPhotoPath =
            $user->profile_photo_path;

        $newPhotoPath =
            $validated['photo']->store(
                'profile_photos'
            );

        $user->forceFill([
            'profile_photo_path' => $newPhotoPath,
        ])->save();

        if ($oldPhotoPath) {
            Storage::delete($oldPhotoPath);
        }

       return Redirect::route('profile.edit')
    ->with([
        'success' => 'profile_photo.updated_success',
        'flash_id' => (string) \Illuminate\Support\Str::uuid(),
    ]);
    }

    /**
     * Remove the user's profile photo.
     */
    public function removePhoto(
        Request $request
    ): RedirectResponse {
        $user = $request->user();

        if ($user->profile_photo_path) {
            Storage::delete(
                $user->profile_photo_path
            );

            $user->forceFill([
                'profile_photo_path' => null,
            ])->save();
        }
return Redirect::route('profile.edit')
    ->with([
        'success' => 'profile_photo.removed_success',
        'flash_id' => (string) \Illuminate\Support\Str::uuid(),
    ]);
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }
}
