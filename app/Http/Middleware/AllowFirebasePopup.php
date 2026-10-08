<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AllowFirebasePopup
{
    /**
     * Keep Firebase's Google sign-in popup connected to this window while it
     * completes and closes. The stricter default COOP policy blocks that flow.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $response->headers->set(
            'Cross-Origin-Opener-Policy',
            'same-origin-allow-popups',
        );

        return $response;
    }
}
