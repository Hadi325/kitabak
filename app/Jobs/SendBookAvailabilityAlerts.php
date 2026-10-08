<?php

namespace App\Jobs;

use App\Models\BookAlertSubscription;
use App\Models\Listing;
use App\Notifications\BookAvailableNotification;
use App\Services\BookAlertMatcher;
use App\Services\TwilioWhatsAppService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use RuntimeException;
use Throwable;

class SendBookAvailabilityAlerts implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 4;

    public array $backoff = [60, 300, 900];

    public function __construct(public readonly int $listingId) {}

    public function handle(
        BookAlertMatcher $matcher,
        TwilioWhatsAppService $whatsApp,
    ): void {
        $listing = Listing::query()
            ->with(['book', 'seller'])
            ->find($this->listingId);

        if (! $listing || $listing->status !== 'available') {
            return;
        }

        $matchingSubscriptions = BookAlertSubscription::query()
            ->active()
            ->where('user_id', '!=', $listing->seller_id)
            ->with('user')
            ->get()
            ->filter(fn (BookAlertSubscription $subscription) => $matcher->matches(
                $subscription,
                $listing->book,
            ))
            ->groupBy('user_id');

        foreach ($matchingSubscriptions as $subscriptions) {
            $ids = $subscriptions->pluck('id');
            $subscription = $subscriptions->first();
            $user = $subscription?->user;

            if (! $user) {
                continue;
            }

            $claimed = BookAlertSubscription::query()
                ->active()
                ->whereIn('id', $ids)
                ->update(['is_active' => false]);

            if ($claimed === 0) {
                continue;
            }

            try {
                if ($user->registeredWithPhone()) {
                    if (blank($user->phone) || $user->phone_verified_at === null) {
                        throw new RuntimeException('The alert recipient has no verified phone number.');
                    }

                    $whatsApp->sendBookAvailable(
                        $user->phone,
                        $user->name,
                        $listing->book->title,
                        $listing->seller->name,
                        route('listings.show', $listing),
                        $subscription->locale,
                    );
                } else {
                    if (blank($user->email) || $user->email_verified_at === null) {
                        throw new RuntimeException('The alert recipient has no verified email address.');
                    }

                    $user->notify(new BookAvailableNotification(
                        $listing,
                        $subscription->locale,
                    ));
                }

                BookAlertSubscription::query()
                    ->whereIn('id', $ids)
                    ->update([
                        'is_active' => false,
                        'notified_at' => now(),
                        'matched_listing_id' => $listing->id,
                    ]);
            } catch (Throwable $exception) {
                BookAlertSubscription::query()
                    ->whereIn('id', $ids)
                    ->whereNull('notified_at')
                    ->update(['is_active' => true]);

                throw $exception;
            }
        }
    }
}
