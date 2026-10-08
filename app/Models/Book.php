<?php

namespace App\Models;

use App\Services\BookIdentifierService;
use App\Services\IsbnService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Book extends Model
{
    public const BOOK_TYPES = ['textbook', 'workbook'];

    public const BOOK_CATEGORIES = [
        'school',
        'university',
        'novel',
    ];

    protected static function booted(): void
    {
        static::saving(function (Book $book): void {
            $book->isbn_normalized = app(IsbnService::class)->normalize($book->isbn);
            $book->barcode_normalized = app(BookIdentifierService::class)->normalizeCustom($book->barcode);
        });
    }

    protected $fillable = [
        'title',
        'subject',
        'book_type',
        'part',
        'grade',
        'publisher',
        'author',
        'language',
        'edition_year',
        'edition_number',
        'book_category',
        'isbn',
        'barcode',
        'barcode_format',
        'cover_image_url',
        'created_by',
    ];

    public function images()
    {
        return $this->hasMany(BookImage::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function listings(): HasMany
    {
        return $this->hasMany(Listing::class);
    }

    public function favoritedBy(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'favorite_books')->withTimestamps();
    }
}
