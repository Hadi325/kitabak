<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Book;
use App\Models\Comment;
use App\Models\Listing;
use App\Models\Post;
use App\Models\Report;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminController extends Controller
{
public function index(Request $request): Response
{
    $startOfWeek = now()->startOfWeek();

    /*
     * Load recent users once.
     * React will handle the dashboard search instantly in the browser.
     */
    $recentUsers = User::query()
        ->with('roles:id,name')
        ->latest()
        ->limit(50)
        ->get([
            'id',
            'name',
            'email',
            'profile_photo_path',
            'created_at',
        ]);

    return Inertia::render('Admin/Dashboard', [
        'stats' => [
            'users' => User::count(),

            'users_this_week' => User::where(
                'created_at',
                '>=',
                $startOfWeek
            )->count(),

            'books' => Book::count(),

            'books_this_week' => Book::where(
                'created_at',
                '>=',
                $startOfWeek
            )->count(),

            'books_for_sale' => Listing::where(
                'status',
                'available'
            )->count(),

            'listings_this_week' => Listing::where(
                'status',
                'available'
            )
                ->where(
                    'created_at',
                    '>=',
                    $startOfWeek
                )
                ->count(),
        ],

        'recentUsers' => $recentUsers,
    ]);
}

    public function books(Request $request): Response|RedirectResponse
    {
        if (! $request->user()->hasRole('admin')) {
            return redirect()
                ->route('dashboard')
                ->with(
                    'error',
                    'You are not allowed to access the books catalogue.'
                );
        }

       $q = trim((string) $request->input('q', ''));
$category = trim((string) $request->input('category', ''));
$grade = trim((string) $request->input('grade', ''));
$language = trim((string) $request->input('language', ''));
$sort = (string) $request->input('sort', 'newest');

$allowedCategories = [
    'school',
    'university',
    'novel',
];

        $allowedGrades = [
            '1',
            '2',
            '3',
            '4',
            '5',
            '6',
            '7',
            '8',
            '9',
            '10',
            '11',
            'SE',
            'SG',
            'SV',
            'LH',
        ];
        $allowedLanguages = [
            'Arabic',
            'English',
            'French',
        ];
        $allowedSorts = [
            'newest',
            'oldest',
            'title',
        ];

        if (! in_array($category, $allowedCategories, true)) {
    $category = '';
}

      if (! in_array($grade, $allowedGrades, true)) {
    $grade = '';
}

// Grade only applies to school books.
if (in_array($category, ['university', 'novel'], true)) {
    $grade = '';
}

if (! in_array($language, $allowedLanguages, true)) {
    $language = '';
}

        if (! in_array($sort, $allowedSorts, true)) {
            $sort = 'newest';
        }

      $books = Book::query()
    ->with('images')
    ->when(
        $category !== '',
        fn ($query) => $query->where('book_category', $category)
    )
    ->when(
        $grade !== '',
        fn ($query) => $query->where('grade', $grade)
    )
            ->when(
                $language !== '',
                fn ($query) => $query->whereRaw(
                    'LOWER(language) = ?',
                    [strtolower($language)]
                )
            )
         ->when($q !== '', function ($query) use ($q) {
    $term = '%' . strtolower($q) . '%';

    $query->where(function ($search) use ($term) {
        $search
            ->whereRaw('LOWER(title) LIKE ?', [$term])
            ->orWhereRaw('LOWER(author) LIKE ?', [$term])
            ->orWhereRaw('LOWER(isbn) LIKE ?', [$term])
            ->orWhereRaw('LOWER(publisher) LIKE ?', [$term])
            ->orWhereRaw('LOWER(subject) LIKE ?', [$term])
            ->orWhereRaw('LOWER(book_type) LIKE ?', [$term])
            ->orWhereRaw('LOWER(part) LIKE ?', [$term]);
    });
})
            ->when(
                $sort === 'newest',
                fn ($query) => $query->orderByDesc('id')
            )
            ->when(
                $sort === 'oldest',
                fn ($query) => $query->orderBy('id')
            )
            ->when(
                $sort === 'title',
                fn ($query) => $query
                    ->orderBy('title')
                    ->orderBy('id')
            )
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Admin/Books', [
            'books' => $books,
            'stats' => [
                'total' => Book::count(),
                'new_this_week' => Book::where(
                    'created_at',
                    '>=',
                    now()->subDays(7)
                )->count(),
            ],
           'filters' => [
    'q' => $q,
    'category' => $category,
    'grade' => $grade,
    'language' => $language,
    'sort' => $sort,
],
        ]);
    }

  public function users(Request $request): Response
{
    $q = trim((string) $request->input('q', ''));

    $users = User::query()
        ->withCount('posts')
        ->with('roles:id,name')
        ->when($q !== '', function ($query) use ($q) {
            $query->where(function ($w) use ($q) {
                $w->where('name', 'like', "%{$q}%")
                    ->orWhere('email', 'like', "%{$q}%");
            });
        })
        ->latest()
        ->paginate(20)
        ->withQueryString();
        $users->getCollection()->transform(function ($user) {
    $user->is_online = $user->last_seen_at
        && $user->last_seen_at->gt(now()->subMinutes(5));

    return $user;
});

    return Inertia::render('Admin/Users', [
        'users' => $users,

        'stats' => [
            'total_users' => User::count(),
            'administrators' => User::role('admin')->count(),
        ],

        'filters' => [
            'q' => $q,
        ],
    ]);
}

    public function listings(Request $request): Response
    {
        $q = trim((string) $request->input('q', ''));

      $status = (string) $request->input('status', 'all');
$location = trim((string) $request->input('location', 'all'));
$price = (string) $request->input('price', 'all');
$category = (string) $request->input('category', 'all');

        $allowedStatuses = [
            'all',
            'available',
            'sold',
            'reserved',
        ];

        $allowedPrices = [
            'all',
            'under_10',
            '10_25',
            'over_25',
        ];

     $allowedCategories = [
    'all',
    'school',
    'university',
    'novel',
];

        if (! in_array($status, $allowedStatuses, true)) {
            $status = 'all';
        }

        if (! in_array($price, $allowedPrices, true)) {
            $price = 'all';
        }

      if (! in_array($category, $allowedCategories, true)) {
    $category = 'all';
}

        $startOfWeek = now()->startOfWeek();

        $stats = [
            'active' => Listing::where('status', 'available')->count(),
            'new_this_week' => Listing::where('created_at', '>=', $startOfWeek)->count(),
            'sold_this_week' => Listing::where('status', 'sold')
                ->where('updated_at', '>=', $startOfWeek)
                ->count(),
            'total' => Listing::count(),
        ];

        $locations = Listing::query()
            ->whereNotNull('location')
            ->where('location', '!=', '')
            ->distinct()
            ->orderBy('location')
            ->pluck('location')
            ->values();

        $listings = Listing::query()
            ->with([
                'book',
                'book.images',
                'images',
                'seller:id,name',
            ])
            ->when(
                $status !== 'all',
                fn ($query) => $query->where('status', $status)
            )
            ->when(
                $location !== 'all',
                fn ($query) => $query->where('location', $location)
            )
            ->when($price === 'under_10', fn ($query) => $query->where('price', '<', 10))
            ->when($price === '10_25', fn ($query) => $query->whereBetween('price', [10, 25]))
            ->when($price === 'over_25', fn ($query) => $query->where('price', '>', 25))
            ->when(
    $category !== 'all',
    fn ($query) => $query->whereHas(
        'book',
        fn ($bookQuery) => $bookQuery->where(
            'book_category',
            $category
        )
    )
)
            ->when($q !== '', function ($query) use ($q) {
                $query->where(function ($w) use ($q) {
                    $w->where('location', 'like', "%{$q}%")
                        ->orWhereHas('seller', function ($sellerQuery) use ($q) {
                            $sellerQuery->where('name', 'like', "%{$q}%");
                        })
                        ->orWhereHas('book', function ($bookQuery) use ($q) {
                            $bookQuery
                                ->where('title', 'like', "%{$q}%")
                                ->orWhere('author', 'like', "%{$q}%")
                                ->orWhere('publisher', 'like', "%{$q}%")
                                ->orWhere('subject', 'like', "%{$q}%")
                                ->orWhere('isbn', 'like', "%{$q}%");
                        });
                });
            })
      ->latest()
->paginate(20)
->withQueryString();

return Inertia::render('Admin/Listings', [
            'listings' => $listings,
            'stats' => $stats,
            'locations' => $locations,
            'filters' => [
    'q' => $q,
    'status' => $status,
    'location' => $location,
    'price' => $price,
    'category' => $category,
],
        ]);
    }

    public function toggleAdmin(User $user): RedirectResponse
    {
        if ($user->id === auth()->id()) {
            return back()->with(
                'error',
                __('You cannot change your own role.')
            );
        }

        if ($user->hasRole('admin')) {
            $user->removeRole('admin');
            $user->assignRole('user');

            $message = __('User demoted to regular user.');
        } else {
            $user->syncRoles(['admin']);

            $message = __('User promoted to admin.');
        }

        return back()->with('success', $message);
    }

    public function posts(Request $request): Response
    {
        $q = trim((string) $request->input('q', ''));

        $posts = Post::query()
            ->with([
                'user:id,name',
                'images' => fn ($qq) => $qq->limit(1),
            ])
            ->withCount([
                'comments',
                'likes',
                'reports',
            ])
            ->when($q !== '', function ($query) use ($q) {
                $query->where(function ($w) use ($q) {
                    $w->where('title', 'like', "%{$q}%")
                        ->orWhere('description', 'like', "%{$q}%");
                });
            })
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Admin/Posts', [
            'posts' => $posts,
            'filters' => [
                'q' => $q,
            ],
        ]);
    }

public function reports(Request $request): Response
{
    $q = trim((string) $request->query('q', ''));
    $status = (string) $request->query('status', 'all');
    $type = (string) $request->query('type', 'all');
    $reason = (string) $request->query('reason', 'all');
    $sort = (string) $request->query('sort', 'newest');

    $allowedStatuses = [
        'all',
        Report::STATUS_PENDING,
        Report::STATUS_RESOLVED,
        Report::STATUS_DISMISSED,
    ];

    $allowedTypes = [
        'all',
        'listing',
        'user',
        'post',
    ];

    $allowedReasons = [
        'all',
        'fake_or_misleading',
        'inappropriate_content',
        'wrong_information',
        'scam_or_suspicious',
        'duplicate',
        'inappropriate_behavior',
        'spam',
        'impersonation',
        'other',
    ];

    $allowedSorts = [
        'newest',
        'oldest',
    ];

    if (! in_array($status, $allowedStatuses, true)) {
        $status = 'all';
    }

    if (! in_array($type, $allowedTypes, true)) {
        $type = 'all';
    }

    if (! in_array($reason, $allowedReasons, true)) {
        $reason = 'all';
    }

    if (! in_array($sort, $allowedSorts, true)) {
        $sort = 'newest';
    }

    $reportsQuery = Report::query()
        ->with([
            'user:id,name,email',

            'post:id,title,user_id',
            'post.user:id,name',

            'listing:id,book_id,seller_id,price,status,location',
            'listing.book:id,title',
            'listing.seller:id,name',

            'reportedUser:id,name,email',
        ]);

    if ($q !== '') {
        $reportsQuery->where(function ($query) use ($q) {
            $query
                ->whereHas('user', function ($userQuery) use ($q) {
                    $userQuery
                        ->where('name', 'like', "%{$q}%")
                        ->orWhere('email', 'like', "%{$q}%");
                })
                ->orWhereHas('reportedUser', function ($userQuery) use ($q) {
                    $userQuery
                        ->where('name', 'like', "%{$q}%")
                        ->orWhere('email', 'like', "%{$q}%");
                })
                ->orWhereHas('listing.book', function ($bookQuery) use ($q) {
                    $bookQuery->where('title', 'like', "%{$q}%");
                })
                ->orWhereHas('listing.seller', function ($sellerQuery) use ($q) {
                    $sellerQuery->where('name', 'like', "%{$q}%");
                })
                ->orWhereHas('post', function ($postQuery) use ($q) {
                    $postQuery->where('title', 'like', "%{$q}%");
                })
                ->orWhere('details', 'like', "%{$q}%");
        });
    }

    if ($status !== 'all') {
        $reportsQuery->where('status', $status);
    }

    if ($type === 'listing') {
        $reportsQuery->whereNotNull('listing_id');
    } elseif ($type === 'user') {
        $reportsQuery->whereNotNull('reported_user_id');
    } elseif ($type === 'post') {
        $reportsQuery->whereNotNull('post_id');
    }

    if ($reason !== 'all') {
        $reportsQuery->where('reason', $reason);
    }

    if ($sort === 'oldest') {
        $reportsQuery->oldest();
    } else {
        $reportsQuery->latest();
    }

    $reports = $reportsQuery
        ->paginate(20)
        ->withQueryString();

    $stats = [
        'pending' => Report::where(
            'status',
            Report::STATUS_PENDING
        )->count(),

        'resolved' => Report::where(
            'status',
            Report::STATUS_RESOLVED
        )->count(),

        'dismissed' => Report::where(
            'status',
            Report::STATUS_DISMISSED
        )->count(),

        'total' => Report::count(),
    ];

    return Inertia::render('Admin/Reports', [
        'reports' => $reports,

        'stats' => $stats,

        'filters' => [
            'q' => $q,
            'status' => $status,
            'type' => $type,
            'reason' => $reason,
            'sort' => $sort,
        ],

        'reasonOptions' => array_values(
            array_filter(
                $allowedReasons,
                fn ($value) => $value !== 'all'
            )
        ),
    ]);
}

    public function resolveReport(
        Report $report
    ): RedirectResponse {
        $report->update([
            'status' => Report::STATUS_RESOLVED,
        ]);

        return back()->with(
            'success',
            __('Report marked as resolved.')
        );
    }

    public function dismissReport(
        Report $report
    ): RedirectResponse {
        $report->update([
            'status' => Report::STATUS_DISMISSED,
        ]);

        return back()->with(
            'success',
            __('Report dismissed.')
        );
    }
}
