<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        return [
            ...parent::share($request),

            'auth' => [
                'user' => $user
                    ? array_merge($user->toArray(), [
                        'roles' => $user->getRoleNames(),

                        'has_phone' => filled(
                            $user->phone
                        ),

                        'profile_photo_url' =>
                            $user->profile_photo_path
                                ? Storage::url(
                                    $user->profile_photo_path
                                )
                                : null,
                    ])
                    : null,
            ],

          'flash' => [
    'success' => fn () =>
        $request->session()->get('success'),

    'error' => fn () =>
        $request->session()->get('error'),

    'id' => fn () =>
        $request->session()->get('flash_id'),
],
        ];
    }
}