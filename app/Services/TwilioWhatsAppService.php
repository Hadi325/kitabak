<?php

namespace App\Services;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class TwilioWhatsAppService
{
    public function sendOtp(string $phone, string $otp, string $language = 'en'): void
    {
        $sid = config('services.twilio.sid');
        $token = config('services.twilio.token');
        $from = config('services.twilio.whatsapp_from');
        $template = str_starts_with($language, 'ar')
            ? config('services.twilio.templates.otp_ar')
            : config('services.twilio.templates.otp_en');

        if (blank($sid) || blank($token) || blank($from) || blank($template)) {
            throw new RuntimeException('Twilio WhatsApp OTP is not configured.');
        }

        $this->client($sid, $token)
            ->asForm()
            ->post("https://api.twilio.com/2010-04-01/Accounts/{$sid}/Messages.json", [
                'From' => $this->asWhatsAppNumber($from),
                'To' => $this->asWhatsAppNumber($phone),
                'ContentSid' => $template,
                'ContentVariables' => json_encode(['1' => $otp], JSON_THROW_ON_ERROR),
            ])
            ->throw();
    }

    public function sendBookAvailable(
        string $phone,
        string $recipientName,
        string $bookTitle,
        string $sellerName,
        string $listingUrl,
        string $language = 'en',
    ): void {
        $sid = config('services.twilio.sid');
        $token = config('services.twilio.token');
        $from = config('services.twilio.whatsapp_from');
        $template = match ($language) {
            'ar' => config('services.twilio.templates.book_alert_ar'),
            'fr' => config('services.twilio.templates.book_alert_fr'),
            default => config('services.twilio.templates.book_alert_en'),
        } ?: config('services.twilio.templates.book_alert_en');

        if (blank($sid) || blank($token) || blank($from) || blank($template)) {
            throw new RuntimeException('Twilio WhatsApp book alerts are not configured.');
        }

        $this->client($sid, $token)
            ->asForm()
            ->post("https://api.twilio.com/2010-04-01/Accounts/{$sid}/Messages.json", [
                'From' => $this->asWhatsAppNumber($from),
                'To' => $this->asWhatsAppNumber($phone),
                'ContentSid' => $template,
                'ContentVariables' => json_encode([
                    '1' => $recipientName,
                    '2' => $bookTitle,
                    '3' => $sellerName,
                    '4' => $listingUrl,
                ], JSON_THROW_ON_ERROR),
            ])
            ->throw();
    }

    protected function client(string $sid, string $token): PendingRequest
    {
        return Http::withBasicAuth($sid, $token)->acceptJson()->timeout(15);
    }

    protected function asWhatsAppNumber(string $phone): string
    {
        $phone = trim($phone);

        return str_starts_with($phone, 'whatsapp:') ? $phone : 'whatsapp:'.$phone;
    }
}
