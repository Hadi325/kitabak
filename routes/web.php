<?php

use App\Http\Controllers\Admin\AdminController;
use App\Http\Controllers\Admin\IssueAgentController as AdminIssueAgentController;
use App\Http\Controllers\BookAlertSubscriptionController;
use App\Http\Controllers\BookListController;
use App\Http\Controllers\BookLookupController;
use App\Http\Controllers\BookPhotoAnalysisController;
use App\Http\Controllers\BookSearchController;
use App\Http\Controllers\BookWebController;
use App\Http\Controllers\BookWhatsAppController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\LikeController;
use App\Http\Controllers\ListingController;
use App\Http\Controllers\ListingShowController;
use App\Http\Controllers\ListingShareController;
use App\Http\Controllers\ListingWhatsAppController;
use App\Http\Controllers\LocationController;
use App\Http\Controllers\PostController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ProfilePhoneController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\SellerBooksController;
use App\Http\Controllers\TagController;
use App\Http\Controllers\UserProfileController;
use App\Models\Book;
use App\Models\Listing;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Public home
|--------------------------------------------------------------------------
*/

Route::post(
    '/location/reverse',
    [LocationController::class, 'reverse'],
)
    ->middleware('throttle:10,1')
    ->name('location.reverse');

    Route::get(
    '/location/search',
    [LocationController::class, 'search'],
)
    ->middleware('throttle:60,1')
    ->name('location.search');

Route::get('/', function () {
    return redirect()->route('dashboard');
});

Route::get('/home', DashboardController::class)
    ->name('dashboard');

Route::get('/share/listings/{listing}', ListingShareController::class)
    ->name('listings.share');

Route::get('/listings/{listing}', ListingShowController::class)
    ->middleware('auth')
    ->name('listings.show');

Route::get('/sellers/{seller}/books', SellerBooksController::class)
    ->middleware('auth')
    ->name('sellers.books');

Route::get('/listings/{listing}/contact/whatsapp', ListingWhatsAppController::class)
    ->middleware(['auth', 'throttle:20,1'])
    ->name('listings.contact.whatsapp');

/*
|--------------------------------------------------------------------------
| Alerts
|--------------------------------------------------------------------------
*/

Route::get('/alerts', function () {
    return Inertia::render('Alerts');
})
    ->middleware(['auth', 'verified'])
    ->name('alerts.index');

/*
|--------------------------------------------------------------------------
| My Books
|--------------------------------------------------------------------------
*/

Route::get('/my-books', function () {
    $listings = Listing::query()
        ->where('seller_id', Auth::id())
        ->with([
            'book.images',
            'images',
        ])
        ->latest()
        ->get();

    return Inertia::render('MyBooks', [
        'listings' => $listings,
    ]);
})
    ->middleware(['auth', 'verified'])
    ->name('my-books');

Route::get('/my-favorites', function () {
    $listings = Auth::user()
        ->favoriteListings()
        ->with([
            'book.images',
            'images',
        ])
        ->latest()
        ->get();

    return Inertia::render('MyFavorites', [
        'listings' => $listings,
    ]);
})
    ->middleware(['auth', 'verified'])
    ->name('favorites.index');

Route::post('/listings/{listing}/favorite', function (Listing $listing) {
    $user = Auth::user();

    $isFavorite = $user->favoriteListings()->whereKey($listing->id)->exists();

    if ($isFavorite) {
        $user->favoriteListings()->detach($listing->id);

        return back()->with('success', 'Removed from favorites');
    }

    $user->favoriteListings()->attach($listing->id);

    return back()->with('success', 'Add to favorites');
})
    ->middleware(['auth', 'verified'])
    ->name('favorites.toggle');

/*
|--------------------------------------------------------------------------
| Mark listing as sold
|--------------------------------------------------------------------------
*/

Route::patch(
    '/my-books/{listing}/sold',
    function (Listing $listing) {
        abort_unless(
            $listing->seller_id === Auth::id(),
            403,
            'You are not allowed to update this listing.'
        );

        $listing->update([
            'status' => 'sold',
        ]);
return redirect()
    ->route(request()->boolean('from_listing_details') ? 'dashboard' : 'my-books')
    ->with([
        'success' => 'The book was marked as sold.',
        'flash_id' => (string) \Illuminate\Support\Str::uuid(),
    ]);
    }
)
    ->middleware(['auth', 'verified'])
    ->name('listings.mark-sold');



    /*
|--------------------------------------------------------------------------
| Repost sold listing
|--------------------------------------------------------------------------
*/

Route::patch(
    '/my-books/{listing}/repost',
    function (Listing $listing) {
        abort_unless(
            $listing->seller_id === Auth::id(),
            403,
            'You are not allowed to update this listing.'
        );

        $listing->update([
            'status' => 'available',
        ]);

        return back()->with(
            'success',
            'The book was reposted successfully.'
        );
    }
)
    ->middleware(['auth', 'verified'])
    ->name('listings.repost');

/*
|--------------------------------------------------------------------------
| Listing Management
|--------------------------------------------------------------------------
*/

Route::get(
    '/my-books/{listing}/edit',
    [ListingController::class, 'edit']
)
    ->middleware(['auth', 'verified'])
    ->name('listings.edit');

Route::patch(
    '/my-books/{listing}',
    [ListingController::class, 'update']
)
    ->middleware(['auth', 'verified'])
    ->name('listings.update');

Route::delete(
    '/my-books/{listing}',
    [ListingController::class, 'destroy']
)
    ->middleware(['auth', 'verified'])
    ->name('listings.destroy');

Route::get('/add-book', function () {
    return Inertia::render('Admin/AddBook');
})
    ->middleware([
        'auth',
        'verified',
        'phone.required',
    ])
    ->name('add.book');

Route::post(
    '/books',
    [BookWebController::class, 'store']
)
    ->middleware([
        'auth',
        'verified',
        'phone.required',
    ])
    ->name('books.store');

Route::post(
    '/books/analyze-photos',
    BookPhotoAnalysisController::class
)
    ->middleware([
        'auth',
        'verified',
        'phone.required',
        'throttle:10,1',
    ])
    ->name('books.analyze-photos');

/*
|--------------------------------------------------------------------------
| Admin
|--------------------------------------------------------------------------
*/

Route::middleware([
    'auth',
    'verified',
    'role:admin',
])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::get(
            '/',
            [AdminController::class, 'index']
        )->name('index');

        Route::get(
            '/users',
            [AdminController::class, 'users']
        )->name('users');

        Route::patch(
            '/users/{user}/toggle-admin',
            [
                AdminController::class,
                'toggleAdmin',
            ]
        )->name('users.toggle-admin');

        Route::get(
            '/posts',
            [AdminController::class, 'posts']
        )->name('posts');

        Route::get(
            '/reports',
            [AdminController::class, 'reports']
        )->name('reports');

        Route::patch(
            '/reports/{report}/resolve',
            [
                AdminController::class,
                'resolveReport',
            ]
        )->name('reports.resolve');

        Route::patch(
            '/reports/{report}/dismiss',
            [
                AdminController::class,
                'dismissReport',
            ]
        )->name('reports.dismiss');


Route::get(
    '/listings',
    [AdminController::class, 'listings']
)->name('listings');

        Route::get(
    '/listings',
    [AdminController::class, 'listings']
)->name('listings');

        Route::get(
            '/issue-agent',
            [AdminIssueAgentController::class, 'index']
        )->name('issue-agent.index');

        Route::post(
            '/issue-agent/{issueAgentRequest}/retry',
            [AdminIssueAgentController::class, 'retry']
        )->name('issue-agent.retry');
    });

/*
|--------------------------------------------------------------------------
| Public community browsing
|--------------------------------------------------------------------------
*/

Route::get(
    '/posts',
    [PostController::class, 'index']
)->name('posts.index');

Route::get(
    '/tags',
    [TagController::class, 'index']
)->name('tags.index');

Route::get(
    '/tags/{tag:slug}',
    [TagController::class, 'show']
)->name('tags.show');

Route::post(
    '/posts/{post}/reports',
    [ReportController::class, 'store']
)->name('posts.reports.store');

Route::get(
    '/users/{user}',
    [UserProfileController::class, 'show']
)->name('users.show');

/*
|--------------------------------------------------------------------------
| Authenticated community actions
|--------------------------------------------------------------------------
*/

Route::middleware([
    'auth',
    'verified',
])->group(function () {

    // Report a book listing.
    Route::post(
        '/listings/{listing}/reports',
        [ReportController::class, 'storeListing']
    )->name('listings.reports.store');

    // Report a seller or user.
    Route::post(
        '/users/{user}/reports',
        [ReportController::class, 'storeUser']
    )->name('users.reports.store');

    Route::get(
        '/posts/create',
        [PostController::class, 'create']
    )->name('posts.create');

    Route::post(
        '/posts',
        [PostController::class, 'store']
    )->name('posts.store');

    Route::get(
        '/posts/{post}/edit',
        [PostController::class, 'edit']
    )->name('posts.edit');

    Route::match(
        ['put', 'patch'],
        '/posts/{post}',
        [PostController::class, 'update']
    )->name('posts.update');

    Route::delete(
        '/posts/{post}',
        [PostController::class, 'destroy']
    )->name('posts.destroy');

    Route::post(
        '/posts/{post}/comments',
        [CommentController::class, 'store']
    )->name('posts.comments.store');

    Route::delete(
        '/comments/{comment}',
        [CommentController::class, 'destroy']
    )->name('comments.destroy');

    Route::post(
        '/posts/{post}/like',
        [LikeController::class, 'toggle']
    )->name('posts.like');
});

/*
|--------------------------------------------------------------------------
| Public single post
|--------------------------------------------------------------------------
*/

Route::get(
    '/posts/{post}',
    [PostController::class, 'show']
)->name('posts.show');

/*
|--------------------------------------------------------------------------
| Public book search
|--------------------------------------------------------------------------
*/

Route::get(
    '/books/search',
    BookSearchController::class
)
    ->middleware('throttle:60,1')
    ->name('books.search');

/*
|--------------------------------------------------------------------------
| ISBN camera lookup
|--------------------------------------------------------------------------
*/

Route::get(
    '/books/lookup/isbn',
    BookLookupController::class
)
    ->middleware([
        'auth',
        'verified',
        'throttle:30,1',
    ])
    ->name('books.lookup-isbn');

/*
|--------------------------------------------------------------------------
| School Book List
|--------------------------------------------------------------------------
*/

Route::get(
    '/book-lists/create',
    [BookListController::class, 'create']
)
    ->middleware(['auth', 'verified'])
    ->name('book-lists.create');

Route::post(
    '/book-lists/analyze',
    [BookListController::class, 'analyze']
)
    ->middleware([
        'auth',
        'verified',
        'throttle:10,1',
    ])
    ->name('book-lists.analyze');

Route::post(
    '/book-availability-alerts',
    [BookAlertSubscriptionController::class, 'store'],
)
    ->middleware(['auth', 'verified', 'throttle:20,1'])
    ->name('book-alerts.store');

/*
|--------------------------------------------------------------------------
| Public Books Catalogue
|--------------------------------------------------------------------------
*/

Route::get('/books', [AdminController::class, 'books'])
    ->middleware('auth')
    ->name('books');

Route::get(
    '/books/{book}/contact/whatsapp',
    BookWhatsAppController::class
)
    ->middleware([
        'auth',
        'throttle:20,1',
    ])
    ->name('books.contact.whatsapp');

/*
|--------------------------------------------------------------------------
| Protected Book Management
|--------------------------------------------------------------------------
*/

Route::get('/books/{id}/edit', function ($id) {
    $book = Book::findOrFail($id);
    $user = Auth::user();

    if (
        $book->created_by !== $user->id &&
        ! $user->hasRole('admin')
    ) {
        abort(
            403,
            'You are not allowed to edit this book.'
        );
    }

    return Inertia::render(
        'Admin/EditBook',
        [
            'book' => $book,
        ]
    );
})
    ->middleware(['auth', 'verified'])
    ->name('books.edit');

Route::put(
    '/books/{book}',
    [BookWebController::class, 'update']
)
    ->middleware(['auth', 'verified'])
    ->name('books.update');

Route::delete('/books/{id}', function ($id) {
    $book = Book::findOrFail($id);
    $user = Auth::user();

    if (
        $book->created_by !== $user->id &&
        ! $user->hasRole('admin')
    ) {
        abort(
            403,
            'You are not allowed to delete this book.'
        );
    }

    $book->delete();

    return redirect()
        ->back()
        ->with(
            'success',
            'Book deleted successfully!'
        );
})
    ->middleware(['auth', 'verified'])
    ->name('books.destroy');

/*
|--------------------------------------------------------------------------
| Profile
|--------------------------------------------------------------------------
*/

Route::middleware('auth')
    ->group(function () {
        Route::get(
            '/profile/phone',
            [
                ProfilePhoneController::class,
                'edit',
            ]
        )->name('profile.phone.edit');

        Route::patch(
            '/profile/phone',
            [
                ProfilePhoneController::class,
                'update',
            ]
        )->name('profile.phone.update');

        Route::get(
            '/profile',
            [ProfileController::class, 'edit']
        )->name('profile.edit');

        Route::post(
    '/profile/photo',
    [ProfileController::class, 'updatePhoto']
)->name('profile.photo.update');

Route::delete(
    '/profile/photo',
    [ProfileController::class, 'removePhoto']
)->name('profile.photo.destroy');
        Route::patch(
            '/profile',
            [
                ProfileController::class,
                'update',
            ]
        )->name('profile.update');

        Route::delete(
            '/profile',
            [
                ProfileController::class,
                'destroy',
            ]
        )->name('profile.destroy');
    });

/*
|--------------------------------------------------------------------------
| Authentication
|--------------------------------------------------------------------------
*/

require __DIR__.'/auth.php';
