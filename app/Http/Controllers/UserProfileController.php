<?php

namespace App\Http\Controllers;

use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

class UserProfileController extends Controller
{
    public function show(User $user): Response
    {
        $posts = $user->posts()
            ->with(['images' => fn ($q) => $q->orderBy('order')->limit(1), 'tags:id,name,slug'])
            ->withCount(['likes', 'comments'])
            ->where('is_published', true)
            ->latest()
            ->paginate(12);

        return Inertia::render('Profile/UserShow', [
            'profileUser' => $user->only(['id', 'name', 'created_at']),
            'posts'       => $posts,
        ]);
    }
}
