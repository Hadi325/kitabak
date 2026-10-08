import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import GuestLayout from '@/Layouts/GuestLayout';
import { usePage } from '@inertiajs/react';

/**
 * Picks the right top-level layout based on auth state, so a page works for
 * both guests and logged-in users.
 */
export default function BrowseLayout({ header, children }) {
    const { auth } = usePage().props;
    const Layout = auth?.user ? AuthenticatedLayout : GuestLayout;
    return <Layout header={header} wide={!auth?.user}>{children}</Layout>;
}
