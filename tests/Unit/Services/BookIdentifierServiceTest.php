<?php

namespace Tests\Unit\Services;

use App\Services\BookIdentifierService;
use App\Services\IsbnService;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class BookIdentifierServiceTest extends TestCase
{
    #[DataProvider('isbnProvider')]
    public function test_it_classifies_and_normalizes_isbns(string $input, string $expected): void
    {
        $result = $this->service()->classify($input, 'EAN_13');

        $this->assertSame('isbn', $result['identifier_type']);
        $this->assertSame($expected, $result['normalized_value']);
        $this->assertSame($expected, $result['isbn']);
    }

    public static function isbnProvider(): array
    {
        return [
            'isbn 13' => ['9780306406157', '9780306406157'],
            'isbn 10' => ['0-8044-2957-X', '9780804429573'],
        ];
    }

    public function test_it_preserves_a_custom_alphanumeric_code(): void
    {
        $result = $this->service()->classify('G2V1Y5LAB005', 'CODE_128');

        $this->assertSame('custom', $result['identifier_type']);
        $this->assertSame('G2V1Y5LAB005', $result['raw_value']);
        $this->assertSame('G2V1Y5LAB005', $result['normalized_value']);
        $this->assertNull($result['isbn']);
    }

    public function test_a_non_book_ean_is_a_custom_identifier_not_an_isbn(): void
    {
        $result = $this->service()->classify('4006381333931', 'EAN_13');

        $this->assertSame('custom', $result['identifier_type']);
        $this->assertNull($result['isbn']);
    }

    public function test_it_rejects_an_isbn_shaped_value_with_an_invalid_checksum(): void
    {
        $this->assertNull($this->service()->classify('9780306406158', 'EAN_13'));
    }

    private function service(): BookIdentifierService
    {
        return new BookIdentifierService(new IsbnService);
    }
}
