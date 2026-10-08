import { useTranslation } from 'react-i18next';

export default function DirectionalArrowIcon({
    direction = 'forward',
    variant = 'arrow',
    className = 'h-4 w-4',
    strokeWidth = 2,
}) {
    const { i18n } = useTranslation();
    const isRtl = i18n.dir() === 'rtl';
    const pointsLeft = direction === 'back' ? !isRtl : isRtl;

    return (
        <svg
            className={`${className} ${pointsLeft ? 'rotate-180' : ''}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
        >
            {variant === 'chevron' ? (
                <path d="m9 18 6-6-6-6" />
            ) : (
                <>
                    <path d="M5 12h14" />
                    <path d="m13 6 6 6-6 6" />
                </>
            )}
        </svg>
    );
}
