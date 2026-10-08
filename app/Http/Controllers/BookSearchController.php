<?php

namespace App\Http\Controllers;

use App\Models\Book;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class BookSearchController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:120'],
            'category' => [
                'nullable',
                Rule::in(Book::BOOK_CATEGORIES),
            ],
            'price' => [
                'nullable',
                Rule::in([
                    'under_5',
                    '5_10',
                    '10_20',
                    '20_50',
                    'over_50',
                ]),
            ],
            'location' => ['nullable', 'string', 'max:120'],
            'page' => [
                'sometimes',
                'integer',
                'min:1',
                'max:100',
            ],
        ]);

        $search = trim($validated['search'] ?? '');
        $category = $validated['category'] ?? '';
        $price = $validated['price'] ?? '';
        $location = trim($validated['location'] ?? '');

        $isbn = preg_replace('/\D/', '', $search);

        /*
         * Apply the listing filters in both places:
         *
         * 1. whereHas() decides whether the book matches.
         * 2. with() decides which listings are returned.
         */
        $applyListingFilters = function ($query) use (
            $price,
            $location
        ) {
            $query->where('status', 'available');

            if ($location !== '') {
                $query->where('location', $location);
            }

        switch ($price) {
    case 'under_5':
        $query->where('price', '<', 5);
        break;

    case '5_10':
        $query
            ->where('price', '>=', 5)
            ->where('price', '<', 10);
        break;

    case '10_20':
        $query
            ->where('price', '>=', 10)
            ->where('price', '<', 20);
        break;

    case '20_50':
        $query
            ->where('price', '>=', 20)
            ->where('price', '<=', 50);
        break;

    case 'over_50':
        $query->where('price', '>', 50);
        break;
}
        };

        $query = Book::query()
            ->whereHas('listings', $applyListingFilters)
            ->with([
                'images' => fn ($query) => $query
                    ->oldest()
                    ->limit(1),

                'listings' => function ($query) use (
                    $applyListingFilters
                ) {
                    $applyListingFilters($query);

                    $query
                        ->orderBy('price')
                        ->with([
                            'images',
                            'seller:id,name',
                        ]);
                },
            ]);

        if ($category !== '') {
            $query->where('book_category', $category);
        }

        if ($search !== '') {
            $query->where(
                function ($query) use ($search, $isbn) {
                    $query
                        ->where(
                            'title',
                            'like',
                            "%{$search}%"
                        )
                        ->orWhere(
                            'author',
                            'like',
                            "%{$search}%"
                        )
                        ->orWhere(
                            'publisher',
                            'like',
                            "%{$search}%"
                        )
                        ->orWhere(
                            'subject',
                            'like',
                            "%{$search}%"
                        )
                        ->orWhere(
                            'book_category',
                            'like',
                            "%{$search}%"
                        )
                        ->orWhere(
                            'book_type',
                            'like',
                            "%{$search}%"
                        )
                        ->orWhere(
                            'part',
                            'like',
                            "%{$search}%"
                        )
                        ->orWhere(
                            'grade',
                            'like',
                            "%{$search}%"
                        )
                        ->orWhere(
                            'isbn',
                            'like',
                            "%{$search}%"
                        );

                    if ($isbn !== '') {
                        $query->orWhere(
                            'isbn_normalized',
                            $isbn
                        );
                    }
                }
            );
        }

        $books = $query
            ->latest()
            ->paginate(
                perPage: 24,
                columns: [
                    'id',
                    'title',
                    'subject',
                    'book_category',
                    'book_type',
                    'part',
                    'grade',
                    'author',
                    'publisher',
                    'isbn',
                    'cover_image_url',
                    'created_at',
                ],
                page: (int) ($validated['page'] ?? 1),
            );

        /*
         * Real locations from available listings.
         * These are used by the Home Location dropdown.
         */
        $locations = \App\Models\Listing::query()
            ->where('status', 'available')
            ->whereNotNull('location')
            ->where('location', '<>', '')
            ->distinct()
            ->orderBy('location')
            ->pluck('location')
            ->values();

        return response()->json([
            'query' => $search,
            'count' => $books->total(),
            'books' => $books->items(),
            'page' => $books->currentPage(),
            'has_more' => $books->hasMorePages(),
            'locations' => $locations,
        ]);
    }
}