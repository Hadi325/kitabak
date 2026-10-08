<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;

class PasswordController extends Controller
{
    /**
     * Update the user's password.
     */
    public function update(Request $request): RedirectResponse
    {
        $user = $request->user();
        $hasPassword = $user->hasPassword();
        $rules = [
            'password' => ['required', Password::defaults(), 'confirmed'],
        ];

        if ($hasPassword) {
            $rules['current_password'] = ['required', 'current_password'];
        }

        $validated = $request->validate($rules);

        $user->forceFill([
            'password' => Hash::make($validated['password']),
            'password_set_at' => now(),
        ])->save();

        return back()->with([
            'success' => $hasPassword
                ? 'profile.password_updated_success'
                : 'profile_forms.password_created_success',
            'flash_id' => (string) Str::uuid(),
        ]);
    }
}
