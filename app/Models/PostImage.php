<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class PostImage extends Model
{
    use HasFactory;

    protected $fillable = [
        'post_id',
        'path',
        'thumbnail_path',
        'original_name',
        'mime_type',
        'size',
        'caption',
        'label',
        'order',
    ];

    protected $appends = ['url', 'thumbnail_url'];

    protected static function booted(): void
    {
        // Always clean up disk files when a PostImage is deleted,
        // regardless of which code path deletes it.
        static::deleting(function (PostImage $image) {
            $disk = Storage::disk('public');
            if ($image->path) {
                $disk->delete($image->path);
            }
            if ($image->thumbnail_path) {
                $disk->delete($image->thumbnail_path);
            }
        });
    }

    public function post(): BelongsTo
    {
        return $this->belongsTo(Post::class);
    }

    public function getUrlAttribute(): ?string
    {
        return $this->path ? Storage::disk('public')->url($this->path) : null;
    }

    public function getThumbnailUrlAttribute(): ?string
    {
        return $this->thumbnail_path
            ? Storage::disk('public')->url($this->thumbnail_path)
            : $this->getUrlAttribute();
    }
}
