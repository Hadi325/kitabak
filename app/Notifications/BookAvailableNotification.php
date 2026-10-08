<?php

namespace App\Notifications;

use App\Models\Listing;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class BookAvailableNotification extends Notification
{
    use Queueable;

    public function __construct(
        public readonly Listing $listing,
        public readonly string $alertLocale = 'en',
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $copy = $this->copy();
        $bookTitle = $this->listing->book->title;
        $sellerName = $this->listing->seller->name;

        return (new MailMessage)
            ->subject(str_replace(':title', $bookTitle, $copy['subject']))
            ->greeting(str_replace(':name', $notifiable->name, $copy['greeting']))
            ->line(str_replace(':title', $bookTitle, $copy['available']))
            ->line(str_replace(':seller', $sellerName, $copy['seller']))
            ->action($copy['action'], route('listings.show', $this->listing))
            ->line($copy['closing']);
    }

    private function copy(): array
    {
        return match ($this->alertLocale) {
            'ar' => [
                'subject' => 'الكتاب :title متوفر الآن على كتابك',
                'greeting' => 'مرحباً :name،',
                'available' => 'الكتاب الذي طلبت التنبيه عنه «:title» أصبح متوفراً الآن.',
                'seller' => 'تم عرضه للبيع بواسطة :seller.',
                'action' => 'عرض الكتاب',
                'closing' => 'يمكنك فتح الإعلان والتواصل مع البائع عبر واتساب.',
            ],
            'fr' => [
                'subject' => 'Le livre :title est maintenant disponible sur Kitabak',
                'greeting' => 'Bonjour :name,',
                'available' => 'Le livre « :title » que vous recherchiez est maintenant disponible.',
                'seller' => 'Il a été mis en vente par :seller.',
                'action' => 'Voir le livre',
                'closing' => 'Ouvrez l’annonce pour consulter le livre et contacter le vendeur sur WhatsApp.',
            ],
            default => [
                'subject' => ':title is now available on Kitabak',
                'greeting' => 'Hello :name,',
                'available' => 'The book “:title” you requested is now available.',
                'seller' => 'It was listed for sale by :seller.',
                'action' => 'View the book',
                'closing' => 'Open the listing to view the book and contact the seller on WhatsApp.',
            ],
        };
    }
}
