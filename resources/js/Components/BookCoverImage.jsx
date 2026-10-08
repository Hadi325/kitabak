import { useEffect, useState } from 'react';

export function resolveBookImageUrl(value) {
    if (!value) return null;

    const url = String(value).trim().replace(/\\/g, '/');
    if (!url) return null;
    if (/^(?:https?:)?\/\//i.test(url) || url.startsWith('data:') || url.startsWith('blob:')) return url;
    if (url.startsWith('/storage/')) return url;
    if (url.startsWith('storage/')) return `/${url}`;
    if (url.startsWith('/')) return url;

    return `/storage/${url}`;
}

export default function BookCoverImage({ src, alt = '', className = '', fallback = null, ...props }) {
    const resolved = resolveBookImageUrl(src);
    const [attempt, setAttempt] = useState(0);
    const fallbackUrl = resolved?.startsWith('http') ? resolved.split('?')[0] : resolved;
    const candidate = attempt === 0 ? resolved : fallbackUrl;

    useEffect(() => setAttempt(0), [resolved]);

    if (!candidate || attempt > 1) return fallback;

    return (
        <img
            src={candidate}
            alt={alt}
            className={className}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={() => setAttempt((current) => (
                current === 0 && fallbackUrl !== resolved ? 1 : 2
            ))}
            {...props}
        />
    );
}
