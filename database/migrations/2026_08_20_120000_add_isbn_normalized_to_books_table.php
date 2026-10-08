<?php

use App\Services\IsbnService;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('books', function (Blueprint $table): void {
            $table->string('isbn_normalized', 13)->nullable()->after('isbn');
        });

        $isbnService = app(IsbnService::class);

        DB::table('books')
            ->select(['id', 'isbn'])
            ->whereNotNull('isbn')
            ->orderBy('id')
            ->chunkById(200, function ($books) use ($isbnService): void {
                foreach ($books as $book) {
                    DB::table('books')
                        ->where('id', $book->id)
                        ->update(['isbn_normalized' => $isbnService->normalize($book->isbn)]);
                }
            });

        // Existing databases may already contain duplicate catalog records, so
        // this is indexed for fast lookup but intentionally not unique.
        Schema::table('books', function (Blueprint $table): void {
            $table->index('isbn_normalized');
        });
    }

    public function down(): void
    {
        Schema::table('books', function (Blueprint $table): void {
            $table->dropIndex(['isbn_normalized']);
            $table->dropColumn('isbn_normalized');
        });
    }
};
