<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $driver = DB::getDriverName();

        if (in_array($driver, ['mysql', 'mariadb'], true)) {
            $this->modifyNullableMysql('subject');
            $this->modifyNullableMysql('publisher');
            $this->modifyNullableMysql('author');
            $this->modifyNullableMysql('language');
            $this->modifyNullableMysql('isbn');
            $this->modifyNullableMysql('cover_image_url');
            $this->modifyNullableMysql('created_by', 'bigint unsigned');

            return;
        }

        if ($driver === 'pgsql') {
            foreach (['subject', 'publisher', 'author', 'language', 'isbn', 'cover_image_url', 'created_by'] as $column) {
                if (Schema::hasColumn('books', $column)) {
                    DB::statement("ALTER TABLE books ALTER COLUMN {$column} DROP NOT NULL");
                }
            }

            return;
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $driver = DB::getDriverName();

        if (in_array($driver, ['mysql', 'mariadb'], true)) {
            $this->modifyNullableMysql('subject', 'varchar(255)', false);
            $this->modifyNullableMysql('publisher', 'varchar(255)', false);
            $this->modifyNullableMysql('author', 'varchar(255)', false);
            $this->modifyNullableMysql('language', 'varchar(255)', false);
            $this->modifyNullableMysql('isbn', 'varchar(255)', false);
            $this->modifyNullableMysql('cover_image_url', 'varchar(255)', false);
            $this->modifyNullableMysql('created_by', 'bigint unsigned', false);

            return;
        }

        if ($driver === 'pgsql') {
            foreach (['subject', 'publisher', 'author', 'language', 'isbn', 'cover_image_url', 'created_by'] as $column) {
                if (Schema::hasColumn('books', $column)) {
                    DB::statement("ALTER TABLE books ALTER COLUMN {$column} SET NOT NULL");
                }
            }
        }
    }

    private function modifyNullableMysql(string $column, string $type = 'varchar(255)', bool $nullable = true): void
    {
        if (! Schema::hasColumn('books', $column)) {
            return;
        }

        $nullKeyword = $nullable ? 'NULL' : 'NOT NULL';
        DB::statement("ALTER TABLE books MODIFY COLUMN {$column} {$type} {$nullKeyword}");
    }
};
