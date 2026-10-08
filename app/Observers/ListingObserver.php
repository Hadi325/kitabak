<?php

namespace App\Observers;

use App\Jobs\SendBookAvailabilityAlerts;
use App\Models\Listing;

class ListingObserver
{
    public function created(Listing $listing): void
    {
        $this->dispatchForAvailableListing($listing);
    }

    public function updated(Listing $listing): void
    {
        if ($listing->wasChanged('status')) {
            $this->dispatchForAvailableListing($listing);
        }
    }

    private function dispatchForAvailableListing(Listing $listing): void
    {
        if ($listing->status === 'available') {
            SendBookAvailabilityAlerts::dispatch($listing->id)->afterCommit();
        }
    }
}
