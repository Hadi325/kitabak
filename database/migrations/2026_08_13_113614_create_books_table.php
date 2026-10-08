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
        Schema::create('books', function (Blueprint $table) {
            $table->id();

            // Basic bibliographic fields
            $table->string('title');
            $table->string('subject')->nullable();

            // Grade level: Lebanon school system (1..11 plus terminal codes)
            $table->enum('grade', ['1','2','3','4','5','6','7','8','9','10','11','SE','SV','SG','LH'])->nullable();

            $table->string('publisher')->nullable();
            $table->string('author')->nullable();
            $table->string('language')->nullable();
            $table->year('edition_year')->nullable();
            $table->string('isbn')->nullable();

            // Optional cover image URL (uploaded files stored separately, this stores accessible URL/path)
            $table->string('cover_image_url')->nullable();

            // Who created this book entry (seller or contributor)
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('books');
    }
};
