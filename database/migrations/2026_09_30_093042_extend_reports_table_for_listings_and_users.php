<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reports', function (Blueprint $table) {
            // Existing reports were only for posts.
            // Make post_id optional so reports can also target listings or users.
            $table->foreignId('post_id')
                ->nullable()
                ->change();

            // Report a specific book listing.
            $table->foreignId('listing_id')
                ->nullable()
                ->after('post_id')
                ->constrained('listings')
                ->cascadeOnDelete();

            // Report a specific seller/user.
            $table->foreignId('reported_user_id')
                ->nullable()
                ->after('listing_id')
                ->constrained('users')
                ->cascadeOnDelete();

            // Optional explanation supplied by the reporter.
            $table->text('details')
                ->nullable()
                ->after('reason');
        });
    }

    public function down(): void
    {
        Schema::table('reports', function (Blueprint $table) {
            $table->dropForeign(['listing_id']);
            $table->dropForeign(['reported_user_id']);

            $table->dropColumn([
                'listing_id',
                'reported_user_id',
                'details',
            ]);

            $table->foreignId('post_id')
                ->nullable(false)
                ->change();
        });
    }
};