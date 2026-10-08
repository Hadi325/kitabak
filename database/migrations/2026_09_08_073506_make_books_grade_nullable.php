<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $driver = DB::connection()->getDriverName();

        if ($driver === 'pgsql') {
            DB::statement(
                'ALTER TABLE books ALTER COLUMN grade DROP NOT NULL'
            );

            return;
        }

        if ($driver === 'mysql') {
            DB::statement(
                "ALTER TABLE books MODIFY COLUMN grade ENUM(
                    '1','2','3','4','5','6','7','8','9','10','11',
                    'SE','SV','SG','LH'
                ) NULL"
            );
        }
    }

    public function down(): void
    {
        $driver = DB::connection()->getDriverName();

        if ($driver === 'pgsql') {
            DB::statement(
                'ALTER TABLE books ALTER COLUMN grade SET NOT NULL'
            );

            return;
        }

        if ($driver === 'mysql') {
            DB::statement(
                "ALTER TABLE books MODIFY COLUMN grade ENUM(
                    '1','2','3','4','5','6','7','8','9','10','11',
                    'SE','SV','SG','LH'
                ) NOT NULL"
            );
        }
    }
};