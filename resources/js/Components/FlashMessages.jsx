import { usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

const MESSAGE_KEYS = {
    'Your book has been listed successfully!':
        'flash.book_listed',

    'Book updated successfully!':
        'flash.book_updated',

    'Your listing was updated successfully.':
        'flash.listing_updated',

    'Your listing was deleted successfully.':
        'flash.listing_deleted',

    'The book was marked as sold.':
        'flash.book_marked_sold',

    'Add to favorites':
        'flash.favorite_added',

    'Removed from favorites':
        'flash.favorite_removed',
};

const FLASH_STORAGE_KEY = 'kitabak_last_flash_id';

export default function FlashMessages() {
    const { flash } = usePage().props;
    const { t, i18n } = useTranslation('common');

    const [visible, setVisible] = useState(null);
    const timerRef = useRef(null);

    useEffect(() => {
        const message =
            flash?.success || flash?.error;

        if (!message) {
            setVisible(null);
            return;
        }

        /*
         * Inertia can restore old page props when the user
         * navigates with the browser Back/Forward buttons.
         *
         * Every profile update receives a unique flash ID.
         * If this ID has already been displayed in this tab,
         * do not display the same toast again.
         */
        if (flash?.id) {
            const lastFlashId =
                window.sessionStorage.getItem(
                    FLASH_STORAGE_KEY,
                );

            if (lastFlashId === flash.id) {
                setVisible(null);
                return;
            }

            window.sessionStorage.setItem(
                FLASH_STORAGE_KEY,
                flash.id,
            );
        }

        const translationKey =
            MESSAGE_KEYS[message] || message;

        setVisible({
            type: flash?.success
                ? 'success'
                : 'error',

            text: t(translationKey, {
                defaultValue: message,
            }),
        });

        if (timerRef.current) {
            window.clearTimeout(timerRef.current);
        }

        timerRef.current =
            window.setTimeout(() => {
                setVisible(null);
            }, 4000);

        return () => {
            if (timerRef.current) {
                window.clearTimeout(
                    timerRef.current,
                );
            }
        };
    }, [
        flash?.id,
        flash?.success,
        flash?.error,
    ]);

    if (!visible) {
        return null;
    }

    return (
        <div className="fixed inset-x-4 top-20 z-50 sm:inset-x-auto sm:end-6 sm:max-w-sm">
            <div
                role="status"
                dir={i18n.dir()}
                className={`flex items-center rounded-xl border px-4 py-3 text-sm font-medium shadow-xl backdrop-blur ${
                    visible.type === 'success'
                        ? 'border-emerald-400/30 bg-emerald-600 text-white'
                        : 'border-rose-400/30 bg-rose-600 text-white'
                }`}
            >
                {visible.text}
            </div>
        </div>
    );
}