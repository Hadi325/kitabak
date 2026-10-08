<?php

use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'role')) {
                $table->string('role')->default('user')->after('password');
            }
        });

        foreach (['admin', 'user'] as $roleName) {
            DB::table('roles')->updateOrInsert(
                ['name' => $roleName, 'guard_name' => 'web'],
                ['name' => $roleName, 'guard_name' => 'web']
            );
        }

        $userRoleId = DB::table('roles')->where('name', 'user')->value('id');
        $adminRoleId = DB::table('roles')->where('name', 'admin')->value('id');

        DB::table('model_has_roles')
            ->where('model_type', User::class)
            ->whereNotIn('model_id', function ($query) {
                $query->select('id')->from('users');
            })
            ->delete();

        foreach (DB::table('users')->select('id', 'email')->get() as $user) {
           $targetRoleId = $userRoleId;

            DB::table('model_has_roles')
                ->where('model_type', User::class)
                ->where('model_id', $user->id)
                ->delete();

            DB::table('model_has_roles')->insert([
                'role_id' => $targetRoleId,
                'model_type' => User::class,
                'model_id' => $user->id,
            ]);
        }

        DB::table('users')
            ->where(function ($query) {
                $query->whereNull('role')->orWhere('role', '');
            })
            ->update(['role' => 'user']);


    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('users', 'role')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('role');
            });
        }
    }
};
