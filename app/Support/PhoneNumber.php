<?php

namespace App\Support;

final class PhoneNumber
{
    public static function normalize(?string $value, string $defaultCountryCode = '961'): ?string
    {
        $value = trim((string) $value);

        if ($value === '') {
            return null;
        }

        $hasInternationalPrefix = str_starts_with($value, '+') || str_starts_with($value, '00');
        $digits = preg_replace('/\D+/', '', $value);

        if (! is_string($digits) || $digits === '') {
            return null;
        }

        if (str_starts_with($value, '00')) {
            $digits = substr($digits, 2);
        } elseif (! $hasInternationalPrefix && ! str_starts_with($digits, $defaultCountryCode)) {
            $digits = $defaultCountryCode.ltrim($digits, '0');
        }

        $normalized = '+'.$digits;

        return preg_match('/^\+[1-9]\d{7,14}$/', $normalized) === 1
            ? $normalized
            : null;
    }

    public static function whatsapp(?string $value): ?string
    {
        $normalized = self::normalize($value);

        return $normalized ? ltrim($normalized, '+') : null;
    }
}
