export default function InputLabel({
    value,
    className = '',
    children,
    ...props
}) {
    return (
        <label
            {...props}
            className={
                `block text-sm font-semibold text-slate-700 dark:text-slate-300 ` +
                className
            }
        >
            {value ? value : children}
        </label>
    );
}
