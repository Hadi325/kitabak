<?php

namespace App\Http\Controllers;

use App\Models\Listing;
use App\Models\Post;
use App\Models\Report;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ReportController extends Controller
{
    /**
     * Existing community post report.
     */
    public function store(Request $request, Post $post): RedirectResponse
    {
        $data = $request->validate([
            'reason' => ['required', 'string', 'min:5', 'max:1000'],
        ]);

        if ($post->user_id === $request->user()->id) {
            return back()->with('error', __('You cannot report your own post.'));
        }

        $existing = Report::where('user_id', $request->user()->id)
            ->where('post_id', $post->id)
            ->where('status', Report::STATUS_PENDING)
            ->exists();

        if ($existing) {
            return back()->with('error', __('You have already reported this post.'));
        }

        Report::create([
            'user_id' => $request->user()->id,
            'post_id' => $post->id,
            'reason' => $data['reason'],
            'status' => Report::STATUS_PENDING,
        ]);

        return back()->with(
            'success',
            __('Thanks — the report has been sent to the moderators.')
        );
    }

    /**
     * Report a book listing.
     */
    public function storeListing(Request $request, Listing $listing): RedirectResponse
    {
        $data = $request->validate([
            'reason' => [
                'required',
                'string',
                Rule::in([
                    'fake_or_misleading',
                    'inappropriate_content',
                    'wrong_information',
                    'scam_or_suspicious',
                    'duplicate',
                    'other',
                ]),
            ],
            'details' => ['nullable', 'string', 'max:1000'],
        ]);

        if ($listing->seller_id === $request->user()->id) {
            return back()->with('error', __('You cannot report your own listing.'));
        }

        $existing = Report::where('user_id', $request->user()->id)
            ->where('listing_id', $listing->id)
            ->where('status', Report::STATUS_PENDING)
            ->exists();

        if ($existing) {
            return back()->with(
                'error',
                __('You have already reported this listing.')
            );
        }

        Report::create([
            'user_id' => $request->user()->id,
            'listing_id' => $listing->id,
            'reason' => $data['reason'],
            'details' => $data['details'] ?? null,
            'status' => Report::STATUS_PENDING,
        ]);

        return back()->with(
            'success',
            __('Report submitted. Thank you. We will review your report.')
        );
    }

    /**
     * Report a user/seller.
     */
    public function storeUser(Request $request, User $user): RedirectResponse
    {
        $data = $request->validate([
            'reason' => [
                'required',
                'string',
                Rule::in([
                    'scam_or_suspicious',
                    'inappropriate_behavior',
                    'spam',
                    'impersonation',
                    'other',
                ]),
            ],
            'details' => ['nullable', 'string', 'max:1000'],
        ]);

        if ($user->id === $request->user()->id) {
            return back()->with('error', __('You cannot report yourself.'));
        }

        $existing = Report::where('user_id', $request->user()->id)
            ->where('reported_user_id', $user->id)
            ->where('status', Report::STATUS_PENDING)
            ->exists();

        if ($existing) {
            return back()->with(
                'error',
                __('You have already reported this user.')
            );
        }

        Report::create([
            'user_id' => $request->user()->id,
            'reported_user_id' => $user->id,
            'reason' => $data['reason'],
            'details' => $data['details'] ?? null,
            'status' => Report::STATUS_PENDING,
        ]);

        return back()->with(
            'success',
            __('Report submitted. Thank you. We will review your report.')
        );
    }
}