<?php

namespace App\Services;

use App\Models\User;
use App\Models\VerificationCode;
use App\Notifications\AdminOtpDailyLimitReached;
use Illuminate\Support\Facades\Hash;
use Throwable;

class PhoneVerificationService
{
    public function __construct(
        private readonly TwilioWhatsAppService $twilio,
        private readonly OtpSendRateLimiter $rateLimiter,
    ) {}

    public function issue(User $user, string $language = 'en', ?string $destination = null): void
    {
        $code = (string) random_int(100000, 999999);

        $phone = $destination ?? $user->phone;

        $this->rateLimiter->attempt($phone, function () use ($user, $code, $language, $phone): void {
            $this->twilio->sendOtp($phone, $code, $language);

            $user->verificationCodes()->delete();
            $user->verificationCodes()->create([
                'code_hash' => Hash::make($code),
                'expires_at' => now()->addMinutes(5),
            ]);
        });

        if ($this->rateLimiter->sendCount($phone) === 6) {
            $this->notifyAdminsOfDailyLimit($user, $phone);
        }
    }

    public function verify(User $user, string $code): bool
    {
        $record = VerificationCode::query()
            ->whereBelongsTo($user)
            ->where('expires_at', '>', now())
            ->latest('id')
            ->first();

        return $record !== null && Hash::check($code, $record->code_hash);
    }

    public function clear(User $user): void
    {
        $user->verificationCodes()->delete();
    }

    public function retryAfter(string $phone): int
    {
        return $this->rateLimiter->retryAfter($phone);
    }

    private function notifyAdminsOfDailyLimit(User $user, string $phone): void
    {
        $notification = new AdminOtpDailyLimitReached($user, $phone);

        User::role('admin')
            ->whereNotNull('email')
            ->each(function (User $admin) use ($notification): void {
                try {
                    $admin->notify($notification);
                } catch (Throwable $exception) {
                    // The OTP was already delivered. An unavailable mail
                    // provider must not make that successful send look failed.
                    report($exception);
                }
            });
    }
}
