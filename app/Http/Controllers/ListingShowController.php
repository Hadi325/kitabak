<?php

namespace App\Http\Controllers;

use App\Models\Listing;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ListingShowController extends Controller
{
    public function __invoke(Request $request, Listing $listing): Response
    {
        abort_unless($listing->status === 'available', 404);

        $listing->load([
            'book.images',
            'images',
            'seller:id,name,phone',
        ]);

        $listing->setAttribute('is_owner', $listing->seller_id === $request->user()->id);
        $listing->setAttribute('can_contact_seller', filled($listing->seller?->phone));
        $listing->seller?->makeHidden('phone');

     return Inertia::render('ListingDetails', [
    'listing' => $listing,
    'is_admin' => $request->user()->hasRole('admin'),
]);
    }
}
