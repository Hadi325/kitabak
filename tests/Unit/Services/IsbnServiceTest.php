<?php

namespace Tests\Unit\Services;

use App\Services\IsbnService;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class IsbnServiceTest extends TestCase
{
    #[DataProvider('validIsbnProvider')]
    public function test_it_normalizes_valid_isbns(string $input, string $expected): void
    {
        $this->assertSame($expected, (new IsbnService)->normalize($input));
    }

    /** @return array<string, array{string, string}> */
    public static function validIsbnProvider(): array
    {
        return [
            'isbn 13 barcode' => ['9780306406157', '9780306406157'],
            'formatted isbn 13' => ['ISBN-13: 978-0-306-40615-7', '9780306406157'],
            'isbn 10 equivalent' => ['0-306-40615-2', '9780306406157'],
            'isbn 10 x check digit' => ['0-8044-2957-X', '9780804429573'],
            '979 isbn' => ['9791090636071', '9791090636071'],
        ];
    }

    #[DataProvider('invalidIsbnProvider')]
    public function test_it_rejects_invalid_or_non_book_barcodes(?string $input): void
    {
        $this->assertNull((new IsbnService)->normalize($input));
    }

    /** @return array<string, array{?string}> */
    public static function invalidIsbnProvider(): array
    {
        return [
            'empty' => [''],
            'null' => [null],
            'invalid checksum' => ['9780306406158'],
            'non isbn ean' => ['4006381333931'],
            'short number' => ['97803064'],
        ];
    }
}
