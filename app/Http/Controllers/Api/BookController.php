<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Book;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class BookController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'subject' => 'nullable|string|max:255',
            'book_category' => [
                'nullable',
                Rule::in(Book::BOOK_CATEGORIES),
            ],
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
        ]);

        // Use web guard to get the browser-logged-in user id
        $userId = auth()->guard('web')->id();

        $book = Book::create([
            'title' => $request->title,
            'subject' => $request->subject,
            'book_category' => $request->book_category ?? 'school',
            'book_type' => $request->book_type,
            'part' => filled($request->part) ? trim($request->part) : null,
            'grade' => $request->grade,
            'publisher' => $request->publisher,
            'author' => $request->author,
            'language' => $request->language,
            'edition_year' => $request->edition_year,
            'edition_number' => $request->edition_number,
            'isbn' => $request->isbn,
            'created_by' => $userId ?? null,
        ]);

        if ($request->hasFile('cover_image')) {
            $path = $request->file('cover_image')->store('book_covers', 'public');
            $book->cover_image_url = $path;
            $book->save();
        }

        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $image) {
                $path = $image->store('book_images', 'public');
                $book->images()->create([
                    'image_path' => $path,
                ]);
            }
        }

        return redirect()->back()->with('success', 'Book added successfully!');
    }

    public function update(Request $request, Book $book)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'subject' => 'nullable|string|max:255',
            'book_category' => [
                'nullable',
                Rule::in(Book::BOOK_CATEGORIES),
            ],
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
        ]);

        $book->update([
            'title' => $request->title,
            'subject' => $request->subject,
            'book_category' => $request->book_category
        ?? $book->book_category
        ?? 'school',
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

        if ($request->hasFile('cover_image')) {
            $path = $request->file('cover_image')->store('book_covers', 'public');
            $book->cover_image_url = $path;
            $book->save();
        }

        return redirect()->back()->with('success', 'Book updated successfully!');
    }
}
