import CommentForm from '@/Components/CommentForm';
import CommentList from '@/Components/CommentList';
import FlashMessages from '@/Components/FlashMessages';
import ImageGallery from '@/Components/ImageGallery';
import LikeButton from '@/Components/LikeButton';
import ReportButton from '@/Components/ReportButton';
import BrowseLayout from '@/Layouts/BrowseLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

export default function Show({ post, liked }) {
    const { t } = useTranslation('posts');
    const { auth } = usePage().props;
    const user = auth?.user;
    const isAuthor = user?.id === post.user_id;
    const isAdmin = user?.roles?.includes('admin');
    const canEdit = isAuthor || isAdmin;

    const { delete: destroy, processing } = useForm();

    const onDelete = () => {
        if (!confirm(t('show.confirm_delete'))) return;
        destroy(route('posts.destroy', post.id));
    };

    return (
        <BrowseLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-xl font-semibold">{post.title}</h2>
                    <div className="flex gap-2">
                        {canEdit && (
                            <Link
                                href={route('posts.edit', post.id)}
                                className="rounded border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
                            >
                                {t('show.edit')}
                            </Link>
                        )}
                        {canEdit && (
                            <button
                                onClick={onDelete}
                                disabled={processing}
                                className="rounded border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                            >
                                {t('show.delete')}
                            </button>
                        )}
                    </div>
                </div>
            }
        >
            <Head title={post.title} />
            <FlashMessages />

            <article className="mx-auto max-w-3xl space-y-6 px-4 py-6">
                <div className="text-sm text-gray-500">
                    {t('show.by')}{' '}
                    <Link
                        href={route('users.show', post.user.id)}
                        className="font-medium text-gray-700 hover:underline"
                    >
                        {post.user?.name}
                    </Link>
                    {post.event_date && (
                        <> · {new Date(post.event_date).toLocaleDateString()}</>
                    )}
                    {post.location && <> · {post.location}</>}
                    <> · {t('show.posted_on', { date: new Date(post.created_at).toLocaleDateString() })}</>
                </div>

                <ImageGallery images={post.images} />

                {post.description && (
                    <p className="whitespace-pre-line text-gray-800">
                        {post.description}
                    </p>
                )}

                {post.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {post.tags.map((tag) => (
                            <Link
                                key={tag.id}
                                href={route('tags.show', tag.slug)}
                                className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700 hover:bg-gray-200"
                            >
                                #{tag.name}
                            </Link>
                        ))}
                    </div>
                )}

                <div className="flex items-center gap-3 border-y border-gray-200 py-3">
                    <LikeButton post={post} liked={liked} canLike={!!user} />
                    <span className="text-sm text-gray-500">
                        💬 {post.comments_count} {t('show.comments_count')}
                    </span>
                    {user && !isAuthor && (
                        <span className="ms-auto">
                            <ReportButton post={post} />
                        </span>
                    )}
                </div>

                <section className="space-y-4">
                    <h3 className="text-lg font-semibold">{t('show.comments')}</h3>
                    {user ? (
                        <CommentForm post={post} />
                    ) : (
                        <p className="text-sm text-gray-500">
                            <Link href={route('login')} className="text-indigo-600 hover:underline">
                                {t('show.login_to_comment')}
                            </Link>
                        </p>
                    )}
                    <CommentList comments={post.comments} currentUser={user} post={post} />
                </section>
            </article>
        </BrowseLayout>
    );
}
