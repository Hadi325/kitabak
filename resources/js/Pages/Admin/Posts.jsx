import AdminTabs from '@/Components/AdminTabs';
import FlashMessages from '@/Components/FlashMessages';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function Posts({ posts, filters }) {
    const { t } = useTranslation('admin');
    const [q, setQ] = useState(filters?.q || '');
    const { delete: destroy, processing } = useForm();

    const submitSearch = (e) => {
        e.preventDefault();
        router.get(route('admin.posts'), { q: q || undefined }, { preserveState: true, replace: true });
    };

    const onDelete = (post) => {
        if (!confirm(t('posts.confirm_delete', { title: post.title }))) return;
        destroy(route('posts.destroy', post.id), { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout header={<div><p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">{t('dashboard.eyebrow')}</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">{t('posts.title')}</h1></div>}>
            <Head title={t('posts.title')} />
            <FlashMessages />

            <div className="page-shell">
                <AdminTabs active="posts" />

                <form onSubmit={submitSearch} className="mb-6 flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row">
                    <input
                        type="search"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder={t('posts.search_placeholder')}
                        className="field-control min-h-11 sm:max-w-sm"
                    />
                    <button className="min-h-11 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500">
                        {t('common.search')}
                    </button>
                </form>

                <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                            <tr>
                                <th className="px-4 py-2"></th>
                                <th className="px-4 py-2">{t('posts.col_title')}</th>
                                <th className="px-4 py-2">{t('posts.col_author')}</th>
                                <th className="px-4 py-2">{t('posts.col_status')}</th>
                                <th className="px-4 py-2">💬</th>
                                <th className="px-4 py-2">❤</th>
                                <th className="px-4 py-2">⚠</th>
                                <th className="px-4 py-2">{t('posts.col_date')}</th>
                                <th className="px-4 py-2 text-end">{t('common.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {posts.data.map((p) => {
                                const cover = p.images?.[0];
                                return (
                                    <tr key={p.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-2">
                                            {cover ? (
                                                <img
                                                    src={cover.thumbnail_url || cover.url}
                                                    alt=""
                                                    className="h-10 w-10 rounded object-cover"
                                                />
                                            ) : (
                                                <div className="h-10 w-10 rounded bg-gray-100" />
                                            )}
                                        </td>
                                        <td className="px-4 py-2">
                                            <Link href={route('posts.show', p.id)} className="font-medium text-gray-800 hover:underline">
                                                {p.title}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-2 text-gray-600">
                                            <Link href={route('users.show', p.user.id)} className="hover:underline">
                                                {p.user?.name}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-2">
                                            {p.is_published ? (
                                                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">{t('posts.published')}</span>
                                            ) : (
                                                <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-600">{t('posts.draft')}</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-2">{p.comments_count}</td>
                                        <td className="px-4 py-2">{p.likes_count}</td>
                                        <td className={`px-4 py-2 ${p.reports_count > 0 ? 'font-semibold text-red-600' : ''}`}>
                                            {p.reports_count}
                                        </td>
                                        <td className="px-4 py-2 text-gray-500">
                                            {new Date(p.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-2 text-end">
                                            <div className="flex justify-end gap-1">
                                                <Link
                                                    href={route('posts.edit', p.id)}
                                                    className="rounded border border-gray-300 px-2 py-1 text-xs hover:bg-gray-50"
                                                >
                                                    {t('common.edit')}
                                                </Link>
                                                <button
                                                    onClick={() => onDelete(p)}
                                                    disabled={processing}
                                                    className="rounded border border-red-300 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                                                >
                                                    {t('common.delete')}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {posts.data.length === 0 && (
                                <tr>
                                    <td colSpan={9} className="px-4 py-8 text-center text-gray-400">
                                        {t('common.empty')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {posts.links?.length > 3 && (
                    <nav className="mt-4 flex flex-wrap justify-center gap-1">
                        {posts.links.map((link, i) => (
                            <Link
                                key={i}
                                href={link.url || '#'}
                                preserveScroll
                                dangerouslySetInnerHTML={{ __html: link.label }}
                                className={`rounded px-3 py-1 text-sm ${
                                    link.active
                                        ? 'bg-indigo-600 text-white'
                                        : link.url
                                        ? 'bg-white text-gray-700 hover:bg-gray-100'
                                        : 'text-gray-300'
                                }`}
                            />
                        ))}
                    </nav>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
