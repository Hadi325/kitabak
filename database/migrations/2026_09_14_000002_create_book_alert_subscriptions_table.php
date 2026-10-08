<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('book_alert_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->string('title_normalized');
            $table->string('subject', 100)->nullable();
            $table->string('subject_normalized', 100)->nullable();
            $table->string('book_type', 20)->nullable();
            $table->string('part', 50)->nullable();
            $table->string('part_normalized', 50)->nullable();
            $table->string('grade', 30)->nullable();
            $table->string('grade_normalized', 30)->nullable();
            $table->string('isbn_normalized', 20)->nullable();
            $table->char('fingerprint', 64);
            $table->string('locale', 5)->default('en');
            $table->boolean('is_active')->default(true);
            $table->timestamp('notified_at')->nullable();
            $table->foreignId('matched_listing_id')
                ->nullable()
                ->constrained('listings')
                ->nullOnDelete();
            $table->timestamps();

            $table->unique(['user_id', 'fingerprint']);
            $table->index(['is_active', 'notified_at']);
            $table->index('title_normalized');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('book_alert_subscriptions');
    }
};
