<?php

namespace App\Http\Controllers;

use App\Models\Listing;
use App\Support\PhoneNumber;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;

class ListingWhatsAppController extends Controller
{
    public function __invoke(Request $request, Listing $listing): RedirectResponse
    {
        $validated = $request->validate([
            'target' => ['nullable', 'in:app,web'],
            'locale' => ['nullable', 'in:en,ar,fr'],
        ]);

        App::setLocale(
            $validated['locale'] ?? config('app.locale'),
        );

        abort_unless($listing->status === 'available', 404);
        abort_if($listing->seller_id === $request->user()->id, 422, 'You cannot contact yourself about your own book.');

        $listing->loadMissing(['seller', 'book']);
        $phone = PhoneNumber::whatsapp($listing->seller?->phone);

        abort_if($phone === null, 404, 'The seller has not added a phone number.');

        $message = __('whatsapp.interest', [
            'name' => $listing->seller->name,
            'title' => $listing->book->title,
        ])."\n\n".__('whatsapp.view_book', [
            'url' => route('listings.show', $listing),
        ]);

        $baseUrl = ($validated['target'] ?? 'app') === 'web'
            ? 'https://web.whatsapp.com/send'
            : 'https://api.whatsapp.com/send';

        return redirect()->away($baseUrl.'?'.http_build_query([
            'phone' => $phone,
            'text' => $message,
        ], encoding_type: PHP_QUERY_RFC3986));
    }
}
