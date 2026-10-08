<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class IssueAgentRequest extends Model
{
    public const STATUS_PENDING = 'pending';
    public const STATUS_PROCESSING = 'processing';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_FAILED = 'failed';
    public const STATUS_DUPLICATE_CANDIDATE = 'duplicate_candidate';
    public const STATUS_NEEDS_CLARIFICATION = 'needs_clarification';

    protected $fillable = [
        'slack_event_id',
        'slack_team_id',
        'slack_channel_id',
        'slack_message_ts',
        'slack_thread_ts',
        'slack_user_id',
        'trigger_type',
        'source',
        'status',
        'github_owner',
        'github_repository',
        'github_issue_number',
        'github_issue_url',
        'ai_model',
        'ai_result',
        'payload',
        'error_message',
        'processed_at',
    ];

    protected $casts = [
        'ai_result' => 'array',
        'payload' => 'array',
        'processed_at' => 'datetime',
    ];

    public function markFailed(string $message): void
    {
        $this->forceFill([
            'status' => self::STATUS_FAILED,
            'error_message' => mb_substr($message, 0, 2000),
            'processed_at' => now(),
        ])->save();
    }
}
