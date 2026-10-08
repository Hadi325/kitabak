<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('issue_agent_requests', function (Blueprint $table) {
            $table->id();
            $table->string('slack_event_id', 128)->nullable()->unique();
            $table->string('slack_team_id', 32)->nullable();
            $table->string('slack_channel_id', 32)->nullable();
            $table->string('slack_message_ts', 32)->nullable();
            $table->string('slack_thread_ts', 32)->nullable();
            $table->string('slack_user_id', 32)->nullable();
            $table->string('trigger_type', 64)->default('manual');
            $table->string('source', 32)->default('manual');
            $table->string('status', 32)->default('pending')->index();
            $table->unsignedInteger('github_issue_number')->nullable();
            $table->string('github_issue_url')->nullable();
            $table->string('ai_model')->nullable();
            $table->json('ai_result')->nullable();
            $table->json('payload')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();

            $table->unique([
                'slack_team_id',
                'slack_channel_id',
                'slack_message_ts',
                'trigger_type',
            ], 'issue_agent_slack_trigger_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('issue_agent_requests');
    }
};
