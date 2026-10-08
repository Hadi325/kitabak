<?php

namespace App\Notifications;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AdminOtpDailyLimitReached extends Notification
{
    use Queueable;

    public readonly int $userId;

    public readonly string $userName;

    public readonly string $maskedPhone;

    public function __construct(User $user, string $phone)
    {
        $this->userId = $user->id;
        $this->userName = $user->name;
        $this->maskedPhone = $this->maskPhone($phone);
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('OTP daily limit reached')
            ->greeting('Hello '.$notifiable->name.',')
            ->line('A user has reached the daily limit of six WhatsApp verification-code sends.')
            ->line('User: '.$this->userName.' (ID '.$this->userId.')')
            ->line('Phone: '.$this->maskedPhone)
            ->line('Further OTP sends for this phone are blocked for 24 hours using server time.');
    }

    private function maskPhone(string $phone): string
    {
        $visibleLength = min(4, strlen($phone));

        return str_repeat('*', max(0, strlen($phone) - $visibleLength))
            .substr($phone, -$visibleLength);
    }
}
