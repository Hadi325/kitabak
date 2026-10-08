import EmptyState from '@/Components/EmptyState';
import FlashMessages from '@/Components/FlashMessages';
import PostCard from '@/Components/PostCard';
import BrowseLayout from '@/Layouts/BrowseLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function Index({ posts, filters }) {
    const { t } = useTranslation('posts');
    const { auth } = usePage().props;
    const [q, setQ] = useState(filters?.q || '');

    const submitSearch = (e) => {
        e.preventDefault();
        router.get(route('posts.index'), { q: q || undefined, tag: filters?.tag || undefined }, {
            preserveState: true,
            replace: true,
        });
    };

    return (
        <BrowseLayout
            header={
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div><p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">{t('feed.eyebrow')}</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">{t('feed.title')}</h1></div>
                    {auth?.user && (
                        <Link
                            href={route('posts.create')}
                            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-indigo-700"
                        >
                            {t('feed.new_post')}
                        </Link>
                    )}
                </div>
            }
        >
            <Head title={t('feed.title')} />
            <FlashMessages />

            <div className="page-shell">
                <div className="mb-8 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
                    <form onSubmit={submitSearch} className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row">
                        <input
                            type="search"
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder={t('feed.search_placeholder')}
                            className="min-h-11 w-full rounded-xl border-slate-300 bg-slate-50 px-4 text-sm focus:border-indigo-500 focus:bg-white focus:ring-indigo-500 sm:max-w-md"
                        />
                        <button
                            type="submit"
                            className="min-h-11 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
                        >
                            {t('feed.search')}
                        </button>
                    </form>
                    {filters?.tag && (
                        <Link
                            href={route('posts.index')}
                            className="self-start rounded-full bg-indigo-100 px-3 py-1.5 text-xs font-semibold text-indigo-700"
                        >
                            #{filters.tag} ✕
                        </Link>
                    )}
                    <Link
                        href={route('tags.index')}
                        className="whitespace-nowrap text-sm font-semibold text-slate-500 hover:text-indigo-700"
                    >
                        {t('feed.browse_tags')}
                    </Link>
                </div>

                {posts.data.length === 0 ? (
                    <EmptyState
                        title={t('feed.empty_title')}
                        message={t('feed.empty_message')}
                        action={
                            auth?.user ? (
                                <Link
                                    href={route('posts.create')}
                                    className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                                >
                                    {t('feed.new_post')}
                                </Link>
                            ) : null
                        }
                    />
                ) : (
                    <>
                        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {posts.data.map((p) => (
                                <PostCard key={p.id} post={p} />
                            ))}
                        </div>

                        {posts.links?.length > 3 && (
                            <nav className="mt-10 flex flex-wrap justify-center gap-1.5">
                                {posts.links.map((link, i) => (
                                    <Link
                                        key={i}
                                        href={link.url || '#'}
                                        preserveScroll
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        className={`rounded-lg px-3.5 py-2 text-sm font-medium transition ${
                                            link.active
                                                ? 'bg-indigo-600 text-white shadow-sm'
                                                : link.url
                                                ? 'border border-slate-200 bg-white text-slate-700 hover:border-indigo-200 hover:text-indigo-700'
                                                : 'text-gray-300'
                                        }`}
                                    />
                                ))}
                            </nav>
                        )}
                    </>
                )}
            </div>
        </BrowseLayout>
    );
}
