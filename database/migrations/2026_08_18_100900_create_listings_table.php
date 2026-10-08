<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('listings', function (Blueprint $table) {
            $table->id();

            // Reference to a canonical book entry
            $table->foreignId('book_id')->constrained('books')->cascadeOnDelete();

            // Seller (user) who created the listing
            $table->foreignId('seller_id')->constrained('users')->cascadeOnDelete();

            // Photo of the listing (single primary photo)
            $table->string('photo_url')->nullable();

            // Price for this seller's copy
            $table->decimal('price', 10, 2)->default(0.00);

            // Status (available, sold, reserved, etc.)
            $table->string('status')->default('available');

            // Location text (city, region)
            $table->string('location')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('listings');
    }
};
