<?php

namespace App\Http\Controllers;

use App\Models\Listing;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Storage;
use App\Models\Book;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class ListingController extends Controller
{
    /**
 * Display the listing edit page.
 *
 * The listing owner can always edit listing-specific
 * information. If they also created the catalog book,
 * they may edit its catalog information.
 */
/**
 * Display the listing edit page.
 */
public function edit(
    Request $request,
    Listing $listing
): Response {
    $this->authorizeOwner($request, $listing);

    $listing->load([
        'book',
        'images',
    ]);

    $book = $listing->book;

$canEditBook =
    $book !== null &&
    (int) $book->created_by ===
        (int) $request->user()->id;

    return Inertia::render('EditListing', [
        'listing' => $listing,
        'canEditBook' => $canEditBook,
    ]);
}

/**
 * Update the seller's listing.
 */
public function update(
    Request $request,
    Listing $listing
): RedirectResponse {
    $this->authorizeOwner($request, $listing);

    $listing->load('book');

    $book = $listing->book;

   $canEditBook =
    $book !== null &&
    (int) $book->created_by ===
        (int) $request->user()->id;
    $rules = [
        'price' => [
            'required',
            'numeric',
            'min:0',
        ],

        'location' => [
            'nullable',
            'string',
            'max:255',
        ],

        'condition' => [
    'required',
    Rule::in(['like_new', 'good', 'fair', 'very_old']),
],

'notes' => [
    'nullable',
    'string',
    'max:1000',
],

        'new_photos' => [
            'nullable',
            'array',
            'max:8',
        ],

        'new_photos.*' => [
            'image',
            'mimes:jpeg,jpg,png,webp',
            'max:5120',
        ],

        'remove_image_ids' => [
            'nullable',
            'array',
        ],

        'remove_image_ids.*' => [
            'integer',
        ],
    ];

   /*
 * Only the creator of this catalog book may change
 * its shared catalog information here.
 */
    if ($canEditBook) {
        $rules = array_merge($rules, [
            'title' => [
                'required',
                'string',
                'max:255',
            ],

            'author' => [
                'nullable',
                'string',
                'max:255',
            ],

            'subject' => [
                'nullable',
                'string',
                'max:255',
            ],

            'book_category' => [
    'nullable',
    'in:' . implode(
        ',',
        Book::BOOK_CATEGORIES
    ),
],

            'book_type' => [
                'nullable',
                'in:' . implode(
                    ',',
                    Book::BOOK_TYPES
                ),
            ],

            'part' => [
                'nullable',
                'string',
                'max:50',
            ],

            'grade' => [
                'nullable',
                'string',
                'max:10',
            ],

            'publisher' => [
                'nullable',
                'string',
                'max:255',
            ],

            'language' => [
                'nullable',
                'string',
                'max:255',
            ],

            'edition_year' => [
                'nullable',
                'integer',
                'min:1800',
                'max:' . (now()->year + 1),
            ],

            'edition_number' => [
    'nullable',
    'integer',
    'min:1',
    'max:999',
],

            'isbn' => [
                'nullable',
                'string',
                'max:64',
            ],
        ]);
    }

    $validated = $request->validate($rules);

    $removeIds = collect(
        $validated['remove_image_ids'] ?? []
    )
        ->map(fn ($id) => (int) $id)
        ->unique()
        ->values();

    $imagesToRemove = $listing
        ->images()
        ->whereIn('id', $removeIds)
        ->get();

    $currentImageCount = $listing
        ->images()
        ->count();

    $remainingImageCount =
        $currentImageCount -
        $imagesToRemove->count();

    $newFiles = $request->file(
        'new_photos',
        []
    );

    if (!is_array($newFiles)) {
        $newFiles = [];
    }

    $finalImageCount =
        $remainingImageCount +
        count($newFiles);

    if ($finalImageCount > 8) {
        return back()
            ->withErrors([
                'new_photos' =>
                    'A listing can have a maximum of 8 photos.',
            ])
            ->withInput();
    }

    if ($finalImageCount < 1) {
        return back()
            ->withErrors([
                'new_photos' =>
                    'At least one condition photo is required.',
            ])
            ->withInput();
    }

    $newStoredPaths = [];

    try {
        DB::transaction(function () use (
            $listing,
            $book,
            $canEditBook,
            $validated,
            $imagesToRemove,
            $newFiles,
            &$newStoredPaths
        ): void {
           /*
 * Update the shared Book record only when
 * this user created the catalog book.
 */
            if ($canEditBook && $book) {
                $book->update([
                    'title' =>
                        $validated['title'],

                    'author' =>
                        $validated['author']
                            ?? null,

                    'subject' =>
                        $validated['subject']
                            ?? null,

                            'book_category' =>
    $validated['book_category']
        ?? $book->book_category
        ?? 'school',

                    'book_type' =>
                        $validated['book_type']
                            ?? null,

                    'part' =>
                        filled(
                            $validated['part']
                                ?? null
                        )
                            ? trim(
                                $validated['part']
                            )
                            : null,

                    'grade' =>
                        $validated['grade']
                            ?? null,

                    'publisher' =>
                        $validated['publisher']
                            ?? null,

                    'language' =>
                        $validated['language']
                            ?? null,

                   'edition_year' =>
    $validated['edition_year']
        ?? null,

'edition_number' =>
    $validated['edition_number']
        ?? null,

'isbn' =>
                        $validated['isbn']
                            ?? null,
                ]);
            }

            /*
             * Listing-specific information.
             */
          $listing->update([
    'price' =>
        $validated['price'],

    'location' =>
        $validated['location']
            ?? null,

    'condition' =>
        $validated['condition'],

    'notes' =>
        filled($validated['notes'] ?? null)
            ? trim($validated['notes'])
            : null,
]);

            foreach ($imagesToRemove as $image) {
                $this->deleteStoredImage(
                    $image->image_path
                );

                $image->delete();
            }

            $maximumOrder = $listing
                ->images()
                ->max('display_order');

            $nextOrder =
                $maximumOrder === null
                    ? 0
                    : ((int) $maximumOrder + 1);

            foreach ($newFiles as $file) {
                $storedPath = $file->store(
                    'listing_photos'
                );

                $newStoredPaths[] =
                    $storedPath;

                $listing
                    ->images()
                    ->create([
                        'image_path' =>
                            Storage::url(
                                $storedPath
                            ),

                        'display_order' =>
                            $nextOrder++,
                    ]);
            }

            $listing
                ->images()
                ->orderBy('display_order')
                ->orderBy('id')
                ->get()
                ->values()
                ->each(function (
                    $image,
                    int $index
                ): void {
                    if (
                        (int)
                            $image->display_order !==
                        $index
                    ) {
                        $image->update([
                            'display_order' =>
                                $index,
                        ]);
                    }
                });

            $firstImage = $listing
                ->images()
                ->orderBy('display_order')
                ->orderBy('id')
                ->first();

            $listing->update([
                'photo_url' =>
                    $firstImage?->image_path,
            ]);
        });
    } catch (Throwable $exception) {
        foreach ($newStoredPaths as $path) {
            Storage::delete($path);
        }

        throw $exception;
    }

   return redirect()
    ->route('my-books')
    ->with([
        'success' => 'flash.listing_updated',
        'flash_id' => (string) Str::uuid(),
    ]);
}

    /**
     * Delete a listing.
     *
     * The listing owner can delete their own listing.
     * An administrator can also delete any listing.
     *
     * This deletes only the sale listing and its
     * condition photos. It does not delete the shared
     * catalog book.
     */
    public function destroy(
        Request $request,
        Listing $listing
    ): RedirectResponse {
        $this->authorizeOwnerOrAdmin(
            $request,
            $listing
        );

        $listing->load('images');

        DB::transaction(function () use (
            $listing
        ): void {
            foreach ($listing->images as $image) {
                $this->deleteStoredImage(
                    $image->image_path
                );
            }

            $listing->images()->delete();

            $listing->delete();
        });

/*
 * If an administrator deletes a listing while
 * reviewing a report, return them to Reports.
 */
if (
    $request->user()->hasRole('admin') &&
    $request->boolean('from_reports')
) {
    return redirect()
        ->route('admin.reports')
        ->with([
            'success' => 'Listing deleted successfully.',
            'flash_id' => (string) Str::uuid(),
        ]);
}

/*
 * If an administrator deletes a listing from
 * the Admin "Books for sale" page, return them
 * to that page.
 *
 * An admin deleting their own listing from
 * My Books should remain on My Books.
 */
if (
    $request->user()->hasRole('admin') &&
    $request->boolean('from_admin')
) {
    return redirect()
        ->route('admin.listings')
        ->with([
            'success' => 'Listing deleted successfully.',
            'flash_id' => (string) Str::uuid(),
        ]);
}

        /*
         * Regular sellers return to My Books.
         */
       return redirect()
    ->route('my-books')
    ->with([
        'success' => 'flash.listing_deleted',
        'flash_id' => (string) Str::uuid(),
    ]);
    }

    /**
     * Allow only the listing owner to edit or update it.
     */
    private function authorizeOwner(
        Request $request,
        Listing $listing
    ): void {
        abort_unless(
            (int) $listing->seller_id ===
                (int) $request->user()->id,
            403,
            'You are not allowed to manage this listing.'
        );
    }

    /**
     * Allow the listing owner or an administrator
     * to delete the listing.
     */
    private function authorizeOwnerOrAdmin(
        Request $request,
        Listing $listing
    ): void {
        $user = $request->user();

        abort_unless(
            (
                (int) $listing->seller_id ===
                (int) $user->id
            ) ||
            $user->hasRole('admin'),
            403,
            'You are not allowed to delete this listing.'
        );
    }

    /**
     * Delete a stored listing image.
     *
     * This supports values saved as either:
     * listing_photos/example.jpg
     *
     * or:
     * /storage/listing_photos/example.jpg
     */
    private function deleteStoredImage(
        ?string $imageValue
    ): void {
        if (blank($imageValue)) {
            return;
        }

        $path = parse_url(
            $imageValue,
            PHP_URL_PATH
        );

        if (!is_string($path) || $path === '') {
            return;
        }

        $path = ltrim($path, '/');

        if (str_starts_with($path, 'storage/')) {
            $path = substr(
                $path,
                strlen('storage/')
            );
        }

        if ($path !== '') {
            Storage::delete($path);
        }
    }
}