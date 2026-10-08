<?php

namespace App\Http\Controllers;

use App\Http\Requests\LookupBookByIsbnRequest;
use App\Models\Book;
use App\Services\BookIdentifierService;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class BookLookupController extends Controller
{
    public function __invoke(LookupBookByIsbnRequest $request, BookIdentifierService $identifierService): JsonResponse
    {
        $identifier = $identifierService->classify(
            $request->validated('identifier'),
            $request->validated('barcode_format'),
        );

        if ($identifier === null) {
            throw ValidationException::withMessages([
                'identifier' => 'The scanned identifier is not valid.',
            ]);
        }

        $book = Book::query()
            ->with(['listings' => fn ($query) => $query
                ->where('status', 'available')
                ->orderBy('price')
                ->select(['id', 'book_id', 'price', 'status', 'location'])])
            ->select([
                'id',
                'title',
                'subject',
                'book_category',
                'book_type',
                'part',
                'grade',
                'publisher',
                'author',
                'language',
                'edition_year',
                'edition_number',
                'isbn',
                'barcode',
                'barcode_format',
                'cover_image_url',
            ])
            ->when(
                $identifier['identifier_type'] === 'isbn',
                fn ($query) => $query->where('isbn_normalized', $identifier['isbn']),
                fn ($query) => $query->where('barcode_normalized', $identifier['normalized_value']),
            )
            ->oldest('id')
            ->first();

        if ($book !== null) {
            $book->setAttribute('available_count', $book->listings->count());
            $book->setAttribute('lowest_price', $book->listings->min('price'));
        }

        return response()->json([
            'source' => $book === null ? 'not_found' : 'local',
            'isbn' => $identifier['isbn'],
            'identifier' => $identifier,
            'found' => $book !== null,
            'book' => $book,
        ]);
    }
}
