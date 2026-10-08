<?php

namespace App\Services;

use App\Exceptions\OtpSendRateLimitException;
use Closure;
use Illuminate\Support\Facades\Cache;

class OtpSendRateLimiter
{
    private const COOLDOWNS = [
        1 => 60,
        2 => 60,
        3 => 900,
        4 => 1800,
        5 => 7200,
        6 => 86400,
    ];

    public function attempt(string $phone, Closure $send): int
    {
        $key = $this->key($phone);
        $lock = Cache::lock($key.':lock', 15);

        if (! $lock->get()) {
            throw new OtpSendRateLimitException(5);
        }

        try {
            $now = now()->timestamp;
            $state = $this->state($key, $now);

            if ($state['next_allowed_at'] > $now) {
                throw new OtpSendRateLimitException($state['next_allowed_at'] - $now);
            }

            $send();

            $count = $state['count'] + 1;
            $cooldown = self::COOLDOWNS[$count] ?? self::COOLDOWNS[6];
            $windowStartedAt = $state['window_started_at'] ?: $now;
            Cache::put($key, [
                'count' => $count,
                'next_allowed_at' => $now + $cooldown,
                'window_started_at' => $windowStartedAt,
            ], now()->addHours(25));

            return $cooldown;
        } finally {
            $lock->release();
        }
    }

    public function retryAfter(string $phone): int
    {
        $now = now()->timestamp;
        $state = $this->state($this->key($phone), $now);

        return max(0, $state['next_allowed_at'] - $now);
    }

    public function sendCount(string $phone): int
    {
        return $this->state($this->key($phone), now()->timestamp)['count'];
    }

    private function state(string $key, int $now): array
    {
        $state = Cache::get($key, [
            'count' => 0,
            'next_allowed_at' => 0,
            'window_started_at' => 0,
        ]);

        $count = (int) ($state['count'] ?? 0);
        $nextAllowedAt = (int) ($state['next_allowed_at'] ?? 0);
        $windowStartedAt = (int) ($state['window_started_at'] ?? 0);
        $completedLockExpired = $count >= 6 && $nextAllowedAt <= $now;
        $dailyWindowExpired = $count < 6
            && $windowStartedAt > 0
            && $windowStartedAt + 86400 <= $now;

        if ($completedLockExpired || $dailyWindowExpired) {
            return ['count' => 0, 'next_allowed_at' => 0, 'window_started_at' => 0];
        }

        return [
            'count' => min(6, max(0, $count)),
            'next_allowed_at' => max(0, $nextAllowedAt),
            'window_started_at' => max(0, $windowStartedAt),
        ];
    }

    private function key(string $phone): string
    {
        return 'phone-otp-send:'.hash('sha256', $phone);
    }
}
