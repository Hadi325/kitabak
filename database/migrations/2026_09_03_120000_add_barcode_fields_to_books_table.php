<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('books', function (Blueprint $table): void {
            $table->string('barcode')->nullable()->after('isbn_normalized');
            $table->string('barcode_normalized')->nullable()->after('barcode');
            $table->string('barcode_format', 32)->nullable()->after('barcode_normalized');
            $table->index('barcode_normalized');
        });
    }

    public function down(): void
    {
        Schema::table('books', function (Blueprint $table): void {
            $table->dropIndex(['barcode_normalized']);
            $table->dropColumn(['barcode', 'barcode_normalized', 'barcode_format']);
        });
    }
};
