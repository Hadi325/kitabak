<?php

namespace App\Http\Controllers;

use App\Models\Book;
use App\Support\PhoneNumber;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;

class BookWhatsAppController extends Controller
{
    public function __invoke(Request $request, Book $book): RedirectResponse
    {
        $validated = $request->validate([
            'locale' => ['nullable', 'in:en,ar,fr'],
        ]);

        App::setLocale(
            $validated['locale'] ?? config('app.locale'),
        );

        $listing = $book->listings()
            ->where('status', 'available')
            ->orderBy('price')
            ->with('seller')
            ->first();

        abort_if($listing === null, 404, 'This book has no available seller.');
        abort_if($listing->seller_id === $request->user()->id, 422, 'You cannot contact yourself about your own book.');

        $phone = PhoneNumber::whatsapp($listing->seller?->phone);

        abort_if($phone === null, 404, 'The seller has not added a phone number.');

        $message = __('whatsapp.interest', [
            'name' => $listing->seller->name,
            'title' => $book->title,
        ])."\n\n".__('whatsapp.view_book', [
            'url' => route('listings.show', $listing),
        ]);

        return redirect()->away('https://wa.me/'.$phone.'?text='.rawurlencode($message));
    }
}
