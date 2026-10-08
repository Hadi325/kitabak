<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePostRequest;
use App\Http\Requests\UpdatePostRequest;
use App\Models\Post;
use App\Models\Tag;
use App\Services\PostImageService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PostController extends Controller
{
    public function __construct(private readonly PostImageService $images)
    {
    }

    public function index(Request $request): Response
    {
        $query = Post::query()
            ->with(['user:id,name', 'tags:id,name,slug', 'images' => fn ($q) => $q->orderBy('order')->limit(1)])
            ->withCount(['likes', 'comments'])
            ->where('is_published', true)
            ->latest();

        if ($tag = $request->string('tag')->toString()) {
            $query->whereHas('tags', fn ($q) => $q->where('slug', $tag));
        }

        if ($search = $request->string('q')->toString()) {
            $like = '%' . $search . '%';
            $query->where(fn ($q) => $q
                ->where('title', 'like', $like)
                ->orWhere('description', 'like', $like)
                ->orWhere('location', 'like', $like));
        }

        return Inertia::render('Posts/Index', [
            'posts'   => $query->paginate(12)->withQueryString(),
            'filters' => [
                'tag' => $request->string('tag')->toString() ?: null,
                'q'   => $request->string('q')->toString() ?: null,
            ],
        ]);
    }

    public function show(Request $request, Post $post): Response
    {
        $this->authorize('view', $post);

        $post->load([
            'user:id,name',
            'tags:id,name,slug',
            'images',
            'comments.user:id,name',
        ])->loadCount(['likes', 'comments']);

        return Inertia::render('Posts/Show', [
            'post'   => $post,
            'liked'  => $post->isLikedBy($request->user()),
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', Post::class);

        return Inertia::render('Posts/Create');
    }

    public function store(StorePostRequest $request): RedirectResponse
    {
        $data = $request->validated();

        $post = DB::transaction(function () use ($request, $data) {
            $post = Post::create([
                'user_id'      => $request->user()->id,
                'title'        => $data['title'],
                'description'  => $data['description'] ?? null,
                'location'     => $data['location'] ?? null,
                'event_date'   => $data['event_date'] ?? null,
                'is_published' => $data['is_published'] ?? true,
            ]);

            $this->syncTags($post, $data['tags'] ?? []);
            $this->saveUploadedImages($post, $request, 0);

            return $post;
        });

        return redirect()
            ->route('posts.show', $post)
            ->with('success', __('Post created.'));
    }

    public function edit(Post $post): Response
    {
        $this->authorize('update', $post);

        $post->load(['tags:id,name,slug', 'images']);

        return Inertia::render('Posts/Edit', [
            'post' => $post,
        ]);
    }

    public function update(UpdatePostRequest $request, Post $post): RedirectResponse
    {
        $data = $request->validated();

        DB::transaction(function () use ($request, $post, $data) {
            $post->update([
                'title'        => $data['title'],
                'description'  => $data['description'] ?? null,
                'location'     => $data['location'] ?? null,
                'event_date'   => $data['event_date'] ?? null,
                'is_published' => $data['is_published'] ?? $post->is_published,
            ]);

            $this->syncTags($post, $data['tags'] ?? []);

            // Delete selected existing images
            $deleteIds = $data['delete_image_ids'] ?? [];
            if (! empty($deleteIds)) {
                foreach ($post->images()->whereIn('id', $deleteIds)->get() as $img) {
                    $this->images->delete($img);
                }
            }

            $startOrder = (int) ($post->images()->max('order') ?? -1) + 1;
            $this->saveUploadedImages($post, $request, $startOrder);
        });

        return redirect()
            ->route('posts.show', $post)
            ->with('success', __('Post updated.'));
    }

    public function destroy(Post $post): RedirectResponse
    {
        $this->authorize('delete', $post);

        $post->delete();

        return redirect()
            ->route('posts.index')
            ->with('success', __('Post deleted.'));
    }

    private function syncTags(Post $post, array $names): void
    {
        $ids = collect($names)
            ->filter(fn ($n) => trim((string) $n) !== '')
            ->unique()
            ->map(fn ($n) => Tag::findOrCreateFromName($n)->id)
            ->all();

        $post->tags()->sync($ids);
    }

    private function saveUploadedImages(Post $post, $request, int $startOrder): void
    {
        $files    = $request->file('images') ?? [];
        $labels   = $request->input('labels') ?? [];
        $captions = $request->input('captions') ?? [];

        if (empty($files)) {
            return;
        }

        // Enforce per-post limit (existing + new)
        $existingCount = $post->images()->count();
        if ($existingCount + count($files) > PostImageService::MAX_PER_POST) {
            abort(422, 'Too many images for this post.');
        }

        foreach ($files as $i => $file) {
            $this->images->store(
                $post,
                $file,
                $labels[$i] ?? 'other',
                $captions[$i] ?? null,
                $startOrder + $i,
            );
        }
    }
}
