import { Link } from '@inertiajs/react';

export default function ResponsiveNavLink({
    active = false,
    className = '',
    children,
    ...props
}) {
    return (
        <Link
            {...props}
            className={`flex w-full items-center rounded-xl px-4 py-3 ${
                active
                    ? 'bg-indigo-50 font-semibold text-indigo-700 ring-1 ring-indigo-100'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
            } text-base font-medium transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${className}`}
        >
            {children}
        </Link>
    );
}
