<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('listing_images', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('listing_id')->constrained()->cascadeOnDelete();
            $table->string('image_path');
            $table->unsignedSmallInteger('display_order')->default(0);
            $table->timestamps();
            $table->index(['listing_id', 'display_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('listing_images');
    }
};
