<?php

namespace App\Http\Controllers;

use App\Models\Book;
use App\Services\BookIdentifierService;
use App\Services\IsbnService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Throwable;

class BookWebController extends Controller
{
    public function store(Request $request)
    {
        return $this->storeUserListing($request);
    }

    private function storeUserListing(Request $request)
    {
        $validated = $request->validate([
            'catalog_mode' => ['required', 'in:existing,new'],
            'book_id' => ['nullable', 'required_if:catalog_mode,existing', 'integer', 'exists:books,id'],
            'title' => ['nullable', 'required_if:catalog_mode,new', 'string', 'max:255'],
            'subject' => ['nullable', 'string', 'max:255'],
            'book_type' => ['nullable', Rule::in(Book::BOOK_TYPES)],
            'part' => ['nullable', 'string', 'max:50'],
            'grade' => ['nullable', 'string', 'max:10'],
            'publisher' => ['nullable', 'string', 'max:255'],
            'author' => ['nullable', 'string', 'max:255'],
            'language' => ['nullable', 'string', 'max:50'],
            'book_category' => ['nullable', Rule::in(Book::BOOK_CATEGORIES)],
            'edition_year' => ['nullable', 'integer', 'min:1800', 'max:'.(date('Y') + 1)],
            'edition_number' => ['nullable', 'integer', 'min:1', 'max:999'],
            'isbn' => ['nullable', 'string', 'max:64'],
            'barcode' => ['nullable', 'string', 'max:255'],
            'barcode_format' => ['nullable', 'string', 'max:32'],
            'cover_image' => ['nullable', 'required_if:catalog_mode,new', 'image', 'max:5120'],
           'price' => ['required', 'numeric', 'min:0'],
'location' => ['nullable', 'string', 'max:255'],
'condition' => [
    'required',
    Rule::in(['like_new', 'good', 'fair', 'very_old']),
],
'notes' => ['nullable', 'string', 'max:1000'],
'listing_photos' => ['required', 'array', 'min:1', 'max:8'],
            'listing_photos.*' => ['image', 'max:5120'],
            'listing_photo' => ['nullable', 'image', 'max:5120'],
        ]);

        $storedPaths = [];

        try {
            DB::transaction(function () use ($request, $validated, &$storedPaths): void {
                if ($validated['catalog_mode'] === 'existing') {
                    $book = Book::query()->lockForUpdate()->findOrFail($validated['book_id']);
                    $this->enrichCatalogBook($book, $validated);
                } else {
                    $book = $this->findOrCreateCatalogBook($request, $validated, $storedPaths);
                }

                $files = $request->file('listing_photos', []);

                if ($request->hasFile('listing_photo')) {
                    array_unshift($files, $request->file('listing_photo'));
                }

               $listing = $book->listings()->create([
    'seller_id' => $request->user()->id,
    'photo_url' => $book->cover_image_url,
    'price' => (float) $validated['price'],
    'status' => 'available',
    'location' => $validated['location'] ?? null,
    'condition' => $validated['condition'],
    'notes' => filled($validated['notes'] ?? null)
        ? trim($validated['notes'])
        : null,
]);

                foreach (array_slice($files, 0, 8) as $order => $file) {
                    $path = $file->store('listing_photos');
                    $storedPaths[] = $path;
                    $url = Storage::url($path);

                    $listing->images()->create([
                        'image_path' => $url,
                        'display_order' => $order,
                    ]);

                    if ($order === 0) {
                        $listing->update(['photo_url' => $url]);
                    }
                }
            });
        } catch (Throwable $exception) {
            Storage::delete($storedPaths);
            throw $exception;
        }

        return redirect()
            ->route('my-books')
            ->with([
                'success' => 'flash.book_listed',
                'flash_id' => (string) Str::uuid(),
            ]);
    }

    private function findOrCreateCatalogBook(Request $request, array $validated, array &$storedPaths): Book
    {
        $isbn = app(IsbnService::class)->normalize($validated['isbn'] ?? null);
        $barcodeNormalized = app(BookIdentifierService::class)
            ->normalizeCustom($validated['barcode'] ?? null);
        $hasExternalBarcode = $barcodeNormalized !== null;

        $book = Book::query()
            ->where(function ($query) use ($isbn, $barcodeNormalized): void {
                if ($isbn !== null) {
                    $query->where('isbn_normalized', $isbn);
                }

                if ($barcodeNormalized !== null) {
                    $isbn === null
                        ? $query->where('barcode_normalized', $barcodeNormalized)
                        : $query->orWhere('barcode_normalized', $barcodeNormalized);
                }

                if ($isbn === null && $barcodeNormalized === null) {
                    $query->whereRaw('1 = 0');
                }
            })
            ->oldest('id')
            ->lockForUpdate()
            ->first();

        if ($book !== null) {
            $this->enrichCatalogBook($book, $validated);

            return $book;
        }

        $coverPath = $request->file('cover_image')->store('book_covers');
        $storedPaths[] = $coverPath;

        return Book::create([
            'title' => $validated['title'],
            'subject' => $validated['subject'] ?? null,
            'book_type' => $validated['book_type'] ?? null,
            'book_category' => $validated['book_category'] ?? 'school',
            'part' => filled($validated['part'] ?? null) ? trim($validated['part']) : null,
            'grade' => $validated['grade'] ?? null,
            'publisher' => $validated['publisher'] ?? null,
            'author' => $validated['author'] ?? null,
            'language' => $validated['language'] ?? null,
            'edition_year' => $validated['edition_year'] ?? null,
            'edition_number' => $validated['edition_number'] ?? null,
            'isbn' => $isbn,
            'barcode' => $hasExternalBarcode
                ? $validated['barcode']
                : $this->makeInternalBarcode(),
            'barcode_format' => $hasExternalBarcode
                ? (filled($validated['barcode_format'] ?? null)
                    ? $validated['barcode_format']
                    : 'UNKNOWN')
                : 'INTERNAL',
            'cover_image_url' => Storage::url($coverPath),
            'created_by' => $request->user()->id,
        ]);
    }

    private function makeInternalBarcode(): string
    {
        return 'KIT-'.now()->format('Ymd').'-'.strtoupper(Str::random(10));
    }

    private function enrichCatalogBook(Book $book, array $validated): void
    {
        $updates = [];

        if (filled($validated['title'] ?? null)) {
            $updates['title'] = trim($validated['title']);
        }

        if (array_key_exists('edition_year', $validated)) {
            $updates['edition_year'] = $validated['edition_year'];
        }

        foreach ([
            'subject',
            'book_category',
            'book_type',
            'part',
            'grade',
            'publisher',
            'author',
            'language',
        ] as $field) {
            if (! blank($book->{$field}) || ! filled($validated[$field] ?? null)) {
                continue;
            }

            $value = $validated[$field];
            $updates[$field] = is_string($value) ? trim($value) : $value;
        }

        $isbn = app(IsbnService::class)->normalize($validated['isbn'] ?? null);

        if (
            $isbn !== null &&
            $book->isbn_normalized === null &&
            ! Book::query()
                ->where('id', '!=', $book->id)
                ->where('isbn_normalized', $isbn)
                ->exists()
        ) {
            $updates['isbn'] = $isbn;
        }

        $barcode = trim((string) ($validated['barcode'] ?? ''));
        $barcodeNormalized = app(BookIdentifierService::class)->normalizeCustom($barcode);
        $barcodeFormat = strtoupper(trim((string) ($validated['barcode_format'] ?? '')));
        $isExternalBarcode = $barcodeNormalized !== null &&
            $barcodeFormat !== 'INTERNAL' &&
            ! Str::startsWith($barcodeNormalized, 'KIT-');
        $canAttachBarcode = $book->barcode_normalized === null ||
            strtoupper((string) $book->barcode_format) === 'INTERNAL';

        if (
            $isExternalBarcode &&
            $canAttachBarcode &&
            ! Book::query()
                ->where('id', '!=', $book->id)
                ->where('barcode_normalized', $barcodeNormalized)
                ->exists()
        ) {
            $updates['barcode'] = $barcode;
            $updates['barcode_format'] = $barcodeFormat ?: 'UNKNOWN';
        }

        if ($updates !== []) {
            $book->update($updates);
        }
    }

    public function update(Request $request, Book $book)
    {
        $user = $request->user();

        abort_unless(
            $book->created_by === $user->id || $user->hasRole('admin'),
            403,
            'You are not allowed to update this book.'
        );

        $request->validate([
            'title' => 'required|string|max:255',
            'subject' => 'nullable|string|max:255',
            'book_category' => ['nullable', Rule::in(Book::BOOK_CATEGORIES)],
            'book_type' => ['nullable', Rule::in(Book::BOOK_TYPES)],
            'part' => 'nullable|string|max:50',
            'grade' => 'nullable|string|max:10',
            'publisher' => 'nullable|string|max:255',
            'author' => 'nullable|string|max:255',
            'language' => 'nullable|string|max:50',
            'edition_year' => 'nullable|integer|min:1800|max:'.(date('Y') + 1),
            'edition_number' => 'nullable|integer|min:1|max:999',
            'isbn' => 'nullable|string|max:64',
            'cover_image' => 'nullable|image|max:5120',
            'remove_cover' => 'nullable|boolean',
        ]);

        $book->update([
            'title' => $request->title,
            'subject' => $request->subject,
            'book_category' => $request->book_category ?? $book->book_category ?? 'school',
            'book_type' => $request->book_type,
            'part' => filled($request->part) ? trim($request->part) : null,
            'grade' => $request->grade,
            'publisher' => $request->publisher,
            'author' => $request->author,
            'language' => $request->language,
            'edition_year' => $request->edition_year,
            'edition_number' => $request->edition_number,
            'isbn' => $request->isbn,
        ]);

        if ($request->boolean('remove_cover')) {
            $book->cover_image_url = null;
        }

        if ($request->hasFile('cover_image')) {
            $path = $request
                ->file('cover_image')
                ->store('book_covers');

            $book->cover_image_url =
                Storage::url($path);
        }

        $book->save();

        return redirect()
            ->route('books')
            ->with([
                'success' => 'Book updated successfully!',
                'flash_id' => (string) Str::uuid(),
            ]);
    }
}
