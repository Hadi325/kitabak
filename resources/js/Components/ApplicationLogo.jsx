export default function ApplicationLogo({
    className = '',
    imageClassName = '',
    alt = 'Kitabak logo',
    ...props
}) {
    return (
        <img
            {...props}
            src="/logo-clean.png?v=3"
            alt={alt}
            draggable="false"
            decoding="async"
            className={`
                block shrink-0 select-none rounded-[24%] object-contain
                ${className}
                ${imageClassName}
            `}
        />
    );
}
