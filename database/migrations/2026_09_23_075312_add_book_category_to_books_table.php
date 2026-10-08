<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('books', 'book_category')) {
            Schema::table('books', function (Blueprint $table): void {
                $table->string('book_category', 20)
                    ->nullable()
                    ->after('id');

                $table->index('book_category');
            });
        }

        // Kitabak's existing catalog contains school books.
        DB::table('books')
            ->whereNull('book_category')
            ->update([
                'book_category' => 'school',
            ]);
    }

    public function down(): void
    {
        if (Schema::hasColumn('books', 'book_category')) {
            Schema::table('books', function (Blueprint $table): void {
                $table->dropIndex(['book_category']);
                $table->dropColumn('book_category');
            });
        }
    }
};
