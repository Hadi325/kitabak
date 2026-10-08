<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('registration_method', 10)
                ->default('email')
                ->after('role');
        });

        DB::table('users')
            ->select([
                'id',
                'email',
                'email_verified_at',
                'firebase_uid',
                'phone',
                'phone_verified_at',
            ])
            ->chunkById(200, function ($users): void {
                foreach ($users as $user) {
                    $registeredByPhone = $user->firebase_uid === null
                        && filled($user->phone)
                        && (
                            blank($user->email)
                            || (
                                filled($user->phone_verified_at)
                                && (
                                    blank($user->email_verified_at)
                                    || $user->phone_verified_at < $user->email_verified_at
                                )
                            )
                        );

                    DB::table('users')
                        ->where('id', $user->id)
                        ->update([
                            'registration_method' => $registeredByPhone ? 'phone' : 'email',
                        ]);
                }
            });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('registration_method');
        });
    }
};
