<?php

namespace App\Http\Controllers;

use App\Models\Book;
use App\Models\Listing;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        // This is null when the visitor is a guest.
        $userId = $request->user()?->id;

        $favoriteListingIds = $userId
            ? Listing::query()
                ->whereHas('favoritedBy', function ($query) use ($userId) {
                    $query->where('users.id', $userId);
                })
                ->pluck('id')
                ->all()
            : [];

        return Inertia::render('Dashboard', [
            'stats' => [
                'total_books' => Book::count(),

                'my_books' => $userId
                    ? Book::where('created_by', $userId)->count()
                    : 0,

                'available_copies' => Listing::where(
                    'status',
                    'available',
                )->count(),

                'subjects' => Book::whereNotNull('subject')
                    ->distinct()
                    ->count('subject'),
            ],

            'recentBooks' => Listing::query()
                ->where('status', 'available')
                ->with([
                    'book.images',
                    'images',
                ])
                ->latest()
                ->limit(10)
                ->get()
                ->map(function (Listing $listing): Book {
                    $book = clone $listing->book;

                    $listing->unsetRelation('book');
                    $book->setRelation('listings', collect([$listing]));
                    $book->setAttribute(
                        'home_card_key',
                        "listing-{$listing->id}",
                    );

                    return $book;
                }),
            'subjects' => Book::query()
                ->whereHas('listings', function ($query) {
                    $query->where(
                        'status',
                        'available'
                    );
                })
                ->selectRaw(
                    'subject, COUNT(*) as books_count',
                )
                ->whereNotNull('subject')
                ->where('subject', '!=', '')
                ->groupBy('subject')
                ->orderByDesc('books_count')
                ->limit(6)
                ->get(),
            'favoriteListingIds' => $favoriteListingIds,
        ]);
    }
}
