<?php

namespace App\Providers;

use App\Contracts\FirebaseTokenVerifier;
use App\Models\Listing;
use App\Observers\ListingObserver;
use App\Services\KreaitFirebaseTokenVerifier;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(
            FirebaseTokenVerifier::class,
            KreaitFirebaseTokenVerifier::class,
        );
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Listing::observe(ListingObserver::class);

        Vite::prefetch(concurrency: 3);
    }
}
