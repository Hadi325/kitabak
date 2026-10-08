<?php

namespace App\Http\Controllers;

use App\Models\BookAlertSubscription;
use App\Services\BookAlertMatcher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BookAlertSubscriptionController extends Controller
{
    public function store(Request $request, BookAlertMatcher $matcher): JsonResponse
    {
        $validated = $request->validate([
            'locale' => ['nullable', 'in:en,ar,fr'],
            'items' => ['required', 'array', 'min:1', 'max:80'],
            'items.*.title' => ['required', 'string', 'max:255'],
            'items.*.subject' => ['nullable', 'string', 'max:100'],
            'items.*.book_type' => ['nullable', 'in:textbook,workbook'],
            'items.*.part' => ['nullable', 'string', 'max:50'],
            'items.*.grade' => ['nullable', 'string', 'max:30'],
            'items.*.isbn' => ['nullable', 'string', 'max:32'],
        ]);

        $subscriptions = collect($validated['items'])
            ->map(function (array $item) use ($request, $validated, $matcher) {
                $attributes = $matcher->attributes(
                    $item,
                    $validated['locale'] ?? 'en',
                );

                return $request->user()
                    ->bookAlertSubscriptions()
                    ->updateOrCreate(
                        ['fingerprint' => $attributes['fingerprint']],
                        $attributes,
                    );
            })
            ->unique('id')
            ->values()
            ->map(fn (BookAlertSubscription $subscription) => [
                'id' => $subscription->id,
                'title' => $subscription->title,
                'subject' => $subscription->subject,
                'book_type' => $subscription->book_type,
                'part' => $subscription->part,
                'grade' => $subscription->grade,
                'isbn' => $subscription->isbn_normalized,
            ]);

        return response()->json([
            'message' => 'Book availability alert enabled.',
            'subscriptions' => $subscriptions,
        ]);
    }
}
