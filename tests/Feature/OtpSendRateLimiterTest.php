<?php

namespace Tests\Feature;

use App\Exceptions\OtpSendRateLimitException;
use App\Services\OtpSendRateLimiter;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class OtpSendRateLimiterTest extends TestCase
{
    public function test_it_enforces_the_complete_six_send_schedule_using_server_time(): void
    {
        $limiter = app(OtpSendRateLimiter::class);
        $phone = '+96170123456';
        $sent = 0;
        $send = function () use (&$sent): void {
            $sent++;
        };

        $this->assertSame(60, $limiter->attempt($phone, $send));
        $this->assertBlockedFor($limiter, $phone, 60);

        $this->travel(60)->seconds();
        $this->assertSame(60, $limiter->attempt($phone, $send));
        $this->travel(60)->seconds();
        $this->assertSame(900, $limiter->attempt($phone, $send));
        $this->assertBlockedFor($limiter, $phone, 900);

        // Waiting longer than required must not reset the cumulative send count.
        $this->travel(16)->minutes();
        $this->assertSame(1800, $limiter->attempt($phone, $send));
        $this->travel(30)->minutes();
        $this->assertSame(7200, $limiter->attempt($phone, $send));
        $this->assertBlockedFor($limiter, $phone, 7200);

        $this->travel(2)->hours();
        $this->assertSame(86400, $limiter->attempt($phone, $send));
        $this->assertSame(6, $sent);
        $this->assertBlockedFor($limiter, $phone, 86400);

        $this->travel(24)->hours();
        $this->assertSame(60, $limiter->attempt($phone, $send));
        $this->assertSame(7, $sent);
    }

    public function test_simultaneous_send_is_rejected_before_calling_twilio(): void
    {
        $phone = '+96170123456';
        $lock = Cache::lock('phone-otp-send:'.hash('sha256', $phone).':lock', 15);
        $lock->get();
        $called = false;

        try {
            app(OtpSendRateLimiter::class)->attempt($phone, function () use (&$called): void {
                $called = true;
            });
            $this->fail('The simultaneous request was not blocked.');
        } catch (OtpSendRateLimitException $exception) {
            $this->assertSame(5, $exception->retryAfter());
            $this->assertFalse($called);
        } finally {
            $lock->release();
        }
    }

    private function assertBlockedFor(OtpSendRateLimiter $limiter, string $phone, int $seconds): void
    {
        try {
            $limiter->attempt($phone, fn () => $this->fail('A blocked send reached the provider.'));
            $this->fail('The send was not rate limited.');
        } catch (OtpSendRateLimitException $exception) {
            $this->assertSame($seconds, $exception->retryAfter());
        }
    }
}
