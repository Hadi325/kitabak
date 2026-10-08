<?php

namespace App\Http\Controllers;

use App\Models\Listing;
use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

class SellerBooksController extends Controller
{
    public function __invoke(User $seller): Response
    {
        $listings = Listing::query()
            ->where('seller_id', $seller->id)
            ->where('status', 'available')
            ->with([
                'book.images',
                'images',
            ])
            ->latest()
            ->get();

        return Inertia::render('SellerBooks', [
            'seller' => $seller->only([
    'id',
    'name',
    'profile_photo_path',
]),
            'listings' => $listings,
        ]);
    }
}
