<?php

namespace Tests\Unit;

use App\Http\Middleware\SecurityHeaders;
use Illuminate\Http\Request;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeadersTest extends TestCase
{
    public function test_http_requests_are_not_forced_to_https(): void
    {
        $response = $this->handle(Request::create('http://127.0.0.1:8000/books'));

        $this->assertSame(
            "object-src 'none'; base-uri 'self'; frame-ancestors 'none'",
            $response->headers->get('Content-Security-Policy')
        );
    }

    public function test_https_requests_keep_the_upgrade_policy(): void
    {
        $response = $this->handle(Request::create('https://staging.kitabak.me/books'));

        $this->assertSame(
            "object-src 'none'; base-uri 'self'; frame-ancestors 'none'; upgrade-insecure-requests",
            $response->headers->get('Content-Security-Policy')
        );
    }

    private function handle(Request $request): Response
    {
        return (new SecurityHeaders)->handle(
            $request,
            fn (): Response => new Response
        );
    }
}
