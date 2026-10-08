<?php

namespace App\Http\Controllers;

use App\Models\Listing;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;

class ListingShareController extends Controller
{
    public function __invoke(Listing $listing): Response
    {
        abort_unless($listing->status === 'available', 404);

        $listing->load([
            'book.images',
            'images',
        ]);

        $book = $listing->book;

        $imagePath =
            $book->images->first()?->image_path
            ?? $book->cover_image_url
            ?? $listing->images->first()?->image_path
            ?? $listing->photo_url;

        $imageUrl = null;

        if ($imagePath) {
            $imageUrl = str_starts_with($imagePath, 'http')
                ? $imagePath
                : Storage::url($imagePath);

            if (! str_starts_with($imageUrl, 'http')) {
                $imageUrl = url($imageUrl);
            }
        }

        $listingUrl = route('listings.show', $listing);

        $shareUrl = route('listings.share', $listing);

        return response()
            ->view('listing-share', [
                'listing' => $listing,
                'book' => $book,
                'imageUrl' => $imageUrl,
                'listingUrl' => $listingUrl,
                'shareUrl' => $shareUrl,
            ]);
    }
}