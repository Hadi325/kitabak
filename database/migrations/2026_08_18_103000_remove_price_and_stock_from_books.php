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
        Schema::table('books', function (Blueprint $table) {
            if (Schema::hasColumn('books', 'price')) {
                $table->dropColumn('price');
            }

            if (Schema::hasColumn('books', 'stock_quantity')) {
                $table->dropColumn('stock_quantity');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('books', function (Blueprint $table) {
            if (! Schema::hasColumn('books', 'price')) {
                $table->decimal('price', 8, 2)->default(0.00)->after('grade');
            }

            if (! Schema::hasColumn('books', 'stock_quantity')) {
                $table->integer('stock_quantity')->default(0)->after('price');
            }
        });
    }
};
