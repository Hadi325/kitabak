<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('books', function (Blueprint $table): void {
            if (! Schema::hasColumn('books', 'book_type')) {
                $table->string('book_type', 20)->nullable()->after('subject');
            }

            if (! Schema::hasColumn('books', 'part')) {
                $table->string('part', 50)->nullable()->after('book_type');
            }
        });

        if (! Schema::hasIndex('books', ['book_type', 'part'])) {
            Schema::table('books', function (Blueprint $table): void {
                $table->index(['book_type', 'part']);
            });
        }
    }

    public function down(): void
    {
        Schema::table('books', function (Blueprint $table): void {
            if (Schema::hasIndex('books', ['book_type', 'part'])) {
                $table->dropIndex(['book_type', 'part']);
            }

            if (Schema::hasColumn('books', 'part')) {
                $table->dropColumn('part');
            }

            if (Schema::hasColumn('books', 'book_type')) {
                $table->dropColumn('book_type');
            }
        });
    }
};
