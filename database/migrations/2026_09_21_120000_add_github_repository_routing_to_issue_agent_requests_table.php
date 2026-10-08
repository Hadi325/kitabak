<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('issue_agent_requests', function (Blueprint $table) {
            $table->string('github_owner')->nullable()->after('status');
            $table->string('github_repository')->nullable()->after('github_owner');
        });
    }

    public function down(): void
    {
        Schema::table('issue_agent_requests', function (Blueprint $table) {
            $table->dropColumn(['github_owner', 'github_repository']);
        });
    }
};
