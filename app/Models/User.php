<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable implements MustVerifyEmail
{
    use HasFactory, HasRoles, Notifiable;

    public const REGISTRATION_EMAIL = 'email';

    public const REGISTRATION_PHONE = 'phone';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'firebase_uid',
        'phone',
        'password',
        'password_set_at',
        'profile_photo_path',
        'role',
        'phone_verified_at',
        'registration_method',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'phone',
        'remember_token',
    ];

 protected $appends = [
    'profile_photo_url',
];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'phone_verified_at' => 'datetime',
        'password_set_at' => 'datetime',
        'password' => 'hashed',
        'last_seen_at' => 'datetime',
    ];

    public function getProfilePhotoUrlAttribute(): ?string
{
    if (! $this->profile_photo_path) {
        return null;
    }

    return Storage::disk('public')->url(
        $this->profile_photo_path
    );
}

    public function hasPassword(): bool
    {
        return $this->password_set_at !== null;
    }

    public function isAdmin(): bool
    {
        return $this->hasRole('admin');
    }

    public function isUser(): bool
    {
        return $this->hasRole('user');
    }

    public function registeredWithEmail(): bool
    {
        return $this->registration_method !== self::REGISTRATION_PHONE;
    }

    public function registeredWithPhone(): bool
    {
        return $this->registration_method === self::REGISTRATION_PHONE;
    }

    public function hasVerifiedEmail(): bool
    {
        return $this->email === null || parent::hasVerifiedEmail();
    }

    public function posts(): HasMany
    {
        return $this->hasMany(Post::class);
    }

    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }

    public function likes(): HasMany
    {
        return $this->hasMany(Like::class);
    }

    public function favoriteBooks(): BelongsToMany
    {
        return $this->belongsToMany(Book::class, 'favorite_books')->withTimestamps();
    }

    public function favoriteListings(): BelongsToMany
    {
        return $this->belongsToMany(Listing::class, 'favorite_listings')->withTimestamps();
    }

    public function bookAlertSubscriptions(): HasMany
    {
        return $this->hasMany(BookAlertSubscription::class);
    }

    public function verificationCodes(): HasMany
    {
        return $this->hasMany(VerificationCode::class);
    }

    public function reports(): HasMany
    {
        return $this->hasMany(Report::class);
    }

    public function reportsReceived(): HasMany
{
    return $this->hasMany(Report::class, 'reported_user_id');
}
}
