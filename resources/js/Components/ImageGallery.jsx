import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * ImageGallery
 * - If a post has at least one "before" and one "after" image, shows a
 *   draggable before/after slider for the first matching pair.
 * - Always renders a thumbnail strip + a lightbox on click.
 */
export default function ImageGallery({ images = [] }) {
    const { t } = useTranslation('common');
    const [active, setActive] = useState(null);

    if (!images.length) return null;

    const before = images.find((i) => i.label === 'before');
    const after = images.find((i) => i.label === 'after');
    const showSlider = before && after && before.id !== after.id;

    return (
        <div className="space-y-3">
            {showSlider && <BeforeAfter before={before} after={after} />}

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                {images.map((img) => (
                    <button
                        type="button"
                        key={img.id}
                        onClick={() => setActive(img)}
                        className="group relative overflow-hidden rounded border border-gray-200 bg-gray-100"
                    >
                        <img
                            src={img.thumbnail_url || img.url}
                            alt={img.caption || ''}
                            loading="lazy"
                            className="aspect-square w-full object-cover transition group-hover:opacity-90"
                        />
                        {img.label && img.label !== 'other' && (
                            <span className="absolute left-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-white">
                                {img.label}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {active && <Lightbox image={active} onClose={() => setActive(null)} />}
        </div>
    );
}

function BeforeAfter({ before, after }) {
    const [pct, setPct] = useState(50);
    const ref = useRef(null);
    const dragging = useRef(false);

    const move = (clientX) => {
        const el = ref.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const x = Math.min(Math.max(clientX - rect.left, 0), rect.width);
        setPct((x / rect.width) * 100);
    };

    useEffect(() => {
        const onMove = (e) => dragging.current && move(e.clientX);
        const onTouch = (e) => dragging.current && move(e.touches[0].clientX);
        const onUp = () => (dragging.current = false);
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        window.addEventListener('touchmove', onTouch);
        window.addEventListener('touchend', onUp);
        return () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
            window.removeEventListener('touchmove', onTouch);
            window.removeEventListener('touchend', onUp);
        };
    }, []);

    return (
        <div
            ref={ref}
            className="relative aspect-[4/3] w-full select-none overflow-hidden rounded-lg bg-gray-200"
            onMouseDown={(e) => {
                dragging.current = true;
                move(e.clientX);
            }}
            onTouchStart={(e) => {
                dragging.current = true;
                move(e.touches[0].clientX);
            }}
        >
            <img
                src={after.url}
                alt="after"
                className="absolute inset-0 h-full w-full object-cover"
                draggable={false}
            />
            <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${pct}%` }}
            >
                <img
                    src={before.url}
                    alt="before"
                    className="absolute inset-0 h-full w-full object-cover"
                    style={{ width: `${100 / (pct / 100)}%`, maxWidth: 'none' }}
                    draggable={false}
                />
            </div>
            <div
                className="absolute top-0 h-full w-0.5 bg-white shadow"
                style={{ left: `${pct}%` }}
            >
                <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-white/80 p-1.5 text-xs font-bold text-gray-700">
                    ↔
                </div>
            </div>
            <span className="absolute left-2 top-2 rounded bg-black/60 px-2 py-0.5 text-xs uppercase text-white">
                Before
            </span>
            <span className="absolute right-2 top-2 rounded bg-black/60 px-2 py-0.5 text-xs uppercase text-white">
                After
            </span>
        </div>
    );
}

function Lightbox({ image, onClose }) {
    useEffect(() => {
        const onKey = (e) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={onClose}
        >
            <img
                src={image.url}
                alt={image.caption || ''}
                className="max-h-full max-w-full rounded shadow-xl"
                onClick={(e) => e.stopPropagation()}
            />
            <button
                onClick={onClose}
                className="absolute right-4 top-4 rounded-full bg-white/90 p-2 text-gray-800 hover:bg-white"
                aria-label={t('actions.close')}
            >
                ✕
            </button>
            {image.caption && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded bg-black/60 px-3 py-1 text-sm text-white">
                    {image.caption}
                </div>
            )}
        </div>
    );
}
