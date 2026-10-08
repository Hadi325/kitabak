import React from 'react';
import { useTranslation } from 'react-i18next';
import BookCoverImage from '@/Components/BookCoverImage';

export default function BookImagesModal({ isOpen, closeModal, images, bookTitle }) {
    const { t } = useTranslation('common');
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/85 p-3 backdrop-blur-sm sm:p-6">
            <div className="relative max-h-[calc(100dvh-1.5rem)] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-2xl dark:bg-slate-900 sm:max-h-[calc(100dvh-3rem)] sm:p-6">

                {/* Modal Header & Close Button */}
                <div className="mb-4 flex items-center justify-between gap-4">
                    <h3 className="min-w-0 text-lg font-bold text-slate-900 dark:text-white sm:text-xl">{t('card.images_for', { title: bookTitle })}</h3>
                    <button
                        onClick={closeModal}
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-2xl font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-white"
                    >
                        &times;
                    </button>
                </div>

                {/* Image Grid */}
                {images && images.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {images.map((img, index) => (
                            <div key={img.id ?? index} className="flex min-h-48 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-100 p-2 shadow-sm dark:border-slate-700 dark:bg-slate-950">
                                {/* We use the Laravel storage URL to access the image */}
                                <BookCoverImage
                                    src={img.image_path}
                                    alt={`${bookTitle} - Image ${index + 1}`}
                                    className="block h-auto max-h-[70dvh] w-auto max-w-full object-contain"
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="py-8 text-center text-slate-500 dark:text-slate-400">{t('card.no_images')}</p>
                )}

                {/* Close Button at bottom */}
                <div className="mt-6 flex justify-end">
                    <button
                        onClick={closeModal}
                        className="rounded-xl bg-slate-200 px-5 py-2.5 font-semibold text-slate-800 shadow hover:bg-slate-300 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
