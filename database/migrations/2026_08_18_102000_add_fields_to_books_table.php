<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('books', function (Blueprint $table) {
            // Add columns only if they don't exist to be safe on existing DBs
            if (! Schema::hasColumn('books', 'publisher')) {
                $table->string('publisher')->nullable()->after('grade');
            }

            if (! Schema::hasColumn('books', 'author')) {
                $table->string('author')->nullable()->after('publisher');
            }

            if (! Schema::hasColumn('books', 'language')) {
                $table->string('language')->nullable()->after('author');
            }

            if (! Schema::hasColumn('books', 'edition_year')) {
                $table->year('edition_year')->nullable()->after('language');
            }

            if (! Schema::hasColumn('books', 'isbn')) {
                $table->string('isbn')->nullable()->after('edition_year');
            }

            if (! Schema::hasColumn('books', 'cover_image_url')) {
                $table->string('cover_image_url')->nullable()->after('isbn');
            }

            if (! Schema::hasColumn('books', 'created_by')) {
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete()->after('cover_image_url');
            }
        });

        // If a legacy user_id column exists, copy its values into created_by for continuity
        if (Schema::hasTable('books') && Schema::hasColumn('books', 'user_id') && Schema::hasColumn('books', 'created_by')) {
            DB::table('books')->whereNotNull('user_id')->whereNull('created_by')->update(['created_by' => DB::raw('user_id')]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('books', function (Blueprint $table) {
            if (Schema::hasColumn('books', 'created_by')) {
                $table->dropForeign(['created_by']);
                $table->dropColumn('created_by');
            }

            if (Schema::hasColumn('books', 'cover_image_url')) {
                $table->dropColumn('cover_image_url');
            }

            if (Schema::hasColumn('books', 'isbn')) {
                $table->dropColumn('isbn');
            }

            if (Schema::hasColumn('books', 'edition_year')) {
                $table->dropColumn('edition_year');
            }

            if (Schema::hasColumn('books', 'language')) {
                $table->dropColumn('language');
            }

            if (Schema::hasColumn('books', 'author')) {
                $table->dropColumn('author');
            }

            if (Schema::hasColumn('books', 'publisher')) {
                $table->dropColumn('publisher');
            }
        });
    }
};
