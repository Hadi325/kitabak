<?php

namespace App\Http\Controllers;

use App\Models\Tag;
use Inertia\Inertia;
use Inertia\Response;

class TagController extends Controller
{
    public function index(): Response
    {
        $tags = Tag::withCount('posts')
            ->orderByDesc('posts_count')
            ->orderBy('name')
            ->get();

        return Inertia::render('Tags/Index', [
            'tags' => $tags,
        ]);
    }

    public function show(Tag $tag): Response
    {
        $posts = $tag->posts()
            ->with(['user:id,name', 'images' => fn ($q) => $q->orderBy('order')->limit(1)])
            ->withCount(['likes', 'comments'])
            ->where('is_published', true)
            ->latest()
            ->paginate(12);

        return Inertia::render('Tags/Show', [
            'tag'   => $tag,
            'posts' => $posts,
        ]);
    }
}
