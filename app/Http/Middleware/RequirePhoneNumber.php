<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RequirePhoneNumber
{
    public function handle(Request $request, Closure $next): Response
    {
        if (blank($request->user()?->phone)) {
            if ($request->isMethod('GET')) {
                $request->session()->put('url.intended', $request->fullUrl());
            }

            return redirect()
                ->route('profile.phone.edit')
                ->with('warning', 'Add your phone number before adding a book.');
        }

        if ($request->user()->phone_verified_at === null) {
            if ($request->isMethod('GET')) {
                $request->session()->put('url.intended', $request->fullUrl());
            }

            $request->session()->put('phone_verification_user_id', $request->user()->id);

            return redirect()
                ->route('phone.verify.notice')
                ->with('warning', 'Verify your phone number before adding a book.');
        }

        return $next($request);
    }
}
