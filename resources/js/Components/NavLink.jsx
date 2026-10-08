import { Link } from '@inertiajs/react';

export default function NavLink({
    active = false,
    className = '',
    children,
    ...props
}) {
    return (
        <Link
            {...props}
            className={
                'relative inline-flex min-h-10 items-center rounded-xl px-4 py-2.5 text-sm font-semibold transition duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ' +
                (active
                    ? 'bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-100 dark:bg-indigo-500/15 dark:text-indigo-300 dark:ring-indigo-500/20'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white') + ' ' + className
            }
        >
            {children}
        </Link>
    );
}
