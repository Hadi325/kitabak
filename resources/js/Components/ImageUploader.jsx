import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useImageCropper } from '@/Components/ImageCropDialog';

const LABELS = ['before', 'after', 'other'];
const MAX = 10;

/**
 * Drag-and-drop multi-image picker with previews, per-image label/caption,
 * and reorder up/down buttons. Reports the parent via onChange:
 *   onChange({ images: File[], labels: string[], captions: string[] })
 */
export default function ImageUploader({ value, onChange, disabled = false }) {
    const { t } = useTranslation('posts');
    const { cropImage, cropDialog } = useImageCropper();
    const inputRef = useRef(null);
    const [items, setItems] = useState(() =>
        (value?.images || []).map((file, i) => ({
            file,
            preview: URL.createObjectURL(file),
            label: value.labels?.[i] || 'other',
            caption: value.captions?.[i] || '',
        })),
    );
    const [dragOver, setDragOver] = useState(false);

    // Revoke object URLs on unmount
    useEffect(() => {
        return () => items.forEach((it) => URL.revokeObjectURL(it.preview));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const sync = (next) => {
        setItems(next);
        onChange({
            images: next.map((i) => i.file),
            labels: next.map((i) => i.label),
            captions: next.map((i) => i.caption),
        });
    };

    const addFiles = async (filesList) => {
        const incoming = Array.from(filesList).filter((f) => f.type.startsWith('image/'));
        const room = MAX - items.length;
        const selected = incoming.slice(0, Math.max(0, room));
        const accepted = [];

        for (const file of selected) {
            const cropped = await cropImage(file);
            if (cropped) accepted.push(cropped);
        }
        const next = [
            ...items,
            ...accepted.map((file) => ({
                file,
                preview: URL.createObjectURL(file),
                label: 'other',
                caption: '',
            })),
        ];
        sync(next);
    };

    const removeAt = (i) => {
        URL.revokeObjectURL(items[i].preview);
        sync(items.filter((_, idx) => idx !== i));
    };

    const move = (from, to) => {
        if (to < 0 || to >= items.length) return;
        const next = [...items];
        const [m] = next.splice(from, 1);
        next.splice(to, 0, m);
        sync(next);
    };

    const update = (i, patch) => {
        const next = items.map((it, idx) => (idx === i ? { ...it, ...patch } : it));
        sync(next);
    };

    return (
        <div>
            {cropDialog}
            <div
                onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    if (!disabled) addFiles(e.dataTransfer.files);
                }}
                onClick={() => !disabled && inputRef.current?.click()}
                className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition ${
                    dragOver ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 bg-gray-50'
                } ${disabled ? 'pointer-events-none opacity-60' : 'hover:bg-gray-100'}`}
            >
                <p className="text-sm text-gray-600">
                    {t('uploader.drop_prefix')} <span className="font-medium text-indigo-600">{t('uploader.browse')}</span>
                </p>
                <p className="mt-1 text-xs text-gray-400">
                    {t('uploader.format_hint', { count: MAX })}
                </p>
                <input
                    ref={inputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                        addFiles(e.target.files);
                        e.target.value = '';
                    }}
                />
            </div>

            {items.length > 0 && (
                <ul className="mt-4 space-y-2">
                    {items.map((it, i) => (
                        <li
                            key={i}
                            className="flex items-start gap-3 rounded border border-gray-200 bg-white p-2"
                        >
                            <img
                                src={it.preview}
                                alt=""
                                className="h-20 w-20 flex-shrink-0 rounded object-cover"
                            />
                            <div className="flex-1 space-y-1">
                                <div className="truncate text-xs text-gray-500">{it.file.name}</div>
                                <input
                                    type="text"
                                    placeholder={t('uploader.caption_placeholder')}
                                    value={it.caption}
                                    onChange={(e) => update(i, { caption: e.target.value })}
                                    className="w-full rounded border-gray-300 text-sm"
                                />
                                <select
                                    value={it.label}
                                    onChange={(e) => update(i, { label: e.target.value })}
                                    className="rounded border-gray-300 text-xs"
                                >
                                    {LABELS.map((l) => (
                                        <option key={l} value={l}>
                                            {t(`uploader.${l}`)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex flex-col gap-1">
                                <button
                                    type="button"
                                    onClick={() => move(i, i - 1)}
                                    disabled={i === 0}
                                    className="rounded bg-gray-100 px-2 text-sm hover:bg-gray-200 disabled:opacity-40"
                                >
                                    ↑
                                </button>
                                <button
                                    type="button"
                                    onClick={() => move(i, i + 1)}
                                    disabled={i === items.length - 1}
                                    className="rounded bg-gray-100 px-2 text-sm hover:bg-gray-200 disabled:opacity-40"
                                >
                                    ↓
                                </button>
                                <button
                                    type="button"
                                    onClick={() => removeAt(i)}
                                    className="rounded bg-red-50 px-2 text-sm text-red-600 hover:bg-red-100"
                                >
                                    ✕
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
