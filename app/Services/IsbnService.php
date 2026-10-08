<?php

namespace App\Services;

final class IsbnService
{
    public function normalize(?string $value): ?string
    {
        if ($value === null || trim($value) === '') {
            return null;
        }

        $withoutLabel = preg_replace('/ISBN(?:-1[03])?/i', '', $value);
        $isbn = strtoupper((string) preg_replace('/[^0-9X]/i', '', (string) $withoutLabel));

        if (preg_match('/^97[89]\d{10}$/', $isbn) && $this->isValidIsbn13($isbn)) {
            return $isbn;
        }

        if (! preg_match('/^\d{9}[\dX]$/', $isbn) || ! $this->isValidIsbn10($isbn)) {
            return null;
        }

        $body = '978'.substr($isbn, 0, 9);
        $sum = 0;

        for ($index = 0; $index < 12; $index++) {
            $sum += (int) $body[$index] * ($index % 2 === 0 ? 1 : 3);
        }

        return $body.((10 - ($sum % 10)) % 10);
    }

    private function isValidIsbn10(string $isbn): bool
    {
        $sum = 0;

        for ($index = 0; $index < 10; $index++) {
            $digit = $isbn[$index] === 'X' ? 10 : (int) $isbn[$index];
            $sum += $digit * (10 - $index);
        }

        return $sum % 11 === 0;
    }

    private function isValidIsbn13(string $isbn): bool
    {
        $sum = 0;

        for ($index = 0; $index < 12; $index++) {
            $sum += (int) $isbn[$index] * ($index % 2 === 0 ? 1 : 3);
        }

        return (10 - ($sum % 10)) % 10 === (int) $isbn[12];
    }
}
