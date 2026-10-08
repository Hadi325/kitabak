<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $contentSecurityPolicy = "object-src 'none'; base-uri 'self'; frame-ancestors 'none'";

        // Local development normally runs over HTTP. Forcing insecure requests to
        // HTTPS there breaks Inertia navigation after otherwise successful actions.
        if ($request->isSecure()) {
            $contentSecurityPolicy .= '; upgrade-insecure-requests';
        }

        $response->headers->set(
            'Referrer-Policy',
            'strict-origin-when-cross-origin'
        );

        $response->headers->set(
            'Content-Security-Policy',
            $contentSecurityPolicy
        );

        return $response;
    }
}