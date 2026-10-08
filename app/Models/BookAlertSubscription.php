<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BookAlertSubscription extends Model
{
    protected $fillable = [
        'title',
        'title_normalized',
        'subject',
        'subject_normalized',
        'book_type',
        'part',
        'part_normalized',
        'grade',
        'grade_normalized',
        'isbn_normalized',
        'fingerprint',
        'locale',
        'is_active',
        'notified_at',
        'matched_listing_id',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'notified_at' => 'datetime',
        ];
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query
            ->where('is_active', true)
            ->whereNull('notified_at');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function matchedListing(): BelongsTo
    {
        return $this->belongsTo(Listing::class, 'matched_listing_id');
    }
}
