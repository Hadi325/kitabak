import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';

export default function PhotoViewer({
    isOpen,
    images = [],
    title = '',
    onClose,
}) {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        if (isOpen) {
            setIndex(0);
        }
    }, [isOpen, images]);

    useEffect(() => {
        if (!isOpen) return undefined;

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                onClose();
            } else if (event.key === 'ArrowLeft' && images.length > 1) {
                setIndex((current) =>
                    (current - 1 + images.length) % images.length,
                );
            } else if (event.key === 'ArrowRight' && images.length > 1) {
                setIndex((current) =>
                    (current + 1) % images.length,
                );
            }
        };

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [images.length, isOpen, onClose]);

    if (!isOpen || images.length === 0) return null;

    const showPrevious = () => {
        setIndex((current) =>
            (current - 1 + images.length) % images.length,
        );
    };

    const showNext = () => {
        setIndex((current) =>
            (current + 1) % images.length,
        );
    };

    return createPortal(
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                    onClose();
                }
            }}
            role="dialog"
            aria-modal="true"
            aria-label={title}
        >
            <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="absolute right-4 top-4 z-30 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            >
                <svg
                    className="h-6 w-6"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.25"
                    strokeLinecap="round"
                    aria-hidden="true"
                >
                    <path d="M6 6l12 12M18 6 6 18" />
                </svg>
            </button>

            {images.length > 1 && (
                <button
                    type="button"
                    onClick={showPrevious}
                    aria-label="Previous photo"
                    className="absolute left-3 top-1/2 z-30 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-black/50 text-white transition hover:bg-black/70 sm:left-6 sm:h-14 sm:w-14"
                >
                    <svg
                        className="h-6 w-6"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                    >
                        <path d="m15 18-6-6 6-6" />
                    </svg>
                </button>
            )}

            <img
                src={images[index]}
                alt={title}
                className="max-h-[90dvh] max-w-[90vw] select-none object-contain sm:max-h-[92dvh] sm:max-w-[88vw]"
                draggable="false"
            />

            {images.length > 1 && (
                <button
                    type="button"
                    onClick={showNext}
                    aria-label="Next photo"
                    className="absolute right-3 top-1/2 z-30 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-black/50 text-white transition hover:bg-black/70 sm:right-6 sm:h-14 sm:w-14"
                >
                    <svg
                        className="h-6 w-6"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                    >
                        <path d="m9 18 6-6-6-6" />
                    </svg>
                </button>
            )}

            {images.length > 1 && (
                <div className="absolute bottom-[calc(1.25rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-4 py-2 text-sm font-bold text-white">
                    {index + 1} / {images.length}
                </div>
            )}
        </div>,
        document.body,
    );
}
