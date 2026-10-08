<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('favorite_books')) {
            return;
        }

        DB::table('favorite_books')
            ->orderBy('id')
            ->get()
            ->each(function (object $favorite): void {
                $listingId = DB::table('listings')
                    ->where('book_id', $favorite->book_id)
                    ->where('status', 'available')
                    ->orderBy('id')
                    ->value('id');

                if ($listingId === null) {
                    return;
                }

                DB::table('favorite_listings')->insertOrIgnore([
                    'user_id' => $favorite->user_id,
                    'listing_id' => $listingId,
                    'created_at' => $favorite->created_at,
                    'updated_at' => $favorite->updated_at,
                ]);
            });
    }

    public function down(): void
    {
        // The original book-level favorites remain untouched.
    }
};