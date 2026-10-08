<?php

namespace Tests\Feature;

use App\Http\Middleware\AllowFirebasePopup;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\SecurityHeaders;
use App\Http\Middleware\UpdateLastSeen;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Tests\TestCase;

class WebMiddlewareStackTest extends TestCase
{
    public function test_custom_web_middleware_are_registered_once(): void
    {
        $webMiddleware = app('router')->getMiddlewareGroups()['web'];

        $expectedMiddleware = [
            AllowFirebasePopup::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
            UpdateLastSeen::class,
            SecurityHeaders::class,
        ];

        foreach ($expectedMiddleware as $middleware) {
            $registrations = array_filter(
                $webMiddleware,
                fn (string $registered) => $registered === $middleware
            );

            $this->assertCount(
                1,
                $registrations,
                "{$middleware} must be registered exactly once."
            );
        }
    }
}
