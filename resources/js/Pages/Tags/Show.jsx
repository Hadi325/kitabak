import EmptyState from '@/Components/EmptyState';
import DirectionalArrowIcon from '@/Components/DirectionalArrowIcon';
import PostCard from '@/Components/PostCard';
import BrowseLayout from '@/Layouts/BrowseLayout';
import { Head, Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

export default function TagShow({ tag, posts }) {
    const { t } = useTranslation('posts');
    return (
        <BrowseLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">#{tag.name}</h2>
                    <Link
                        href={route('tags.index')}
                        className="text-sm text-gray-500 hover:underline"
                    >
                        <span className="inline-flex items-center gap-2">
                            <DirectionalArrowIcon direction="back" />
                            {t('tags.all')}
                        </span>
                    </Link>
                </div>
            }
        >
            <Head title={`#${tag.name}`} />
            <div className="mx-auto max-w-6xl px-4 py-6">
                {posts.data.length === 0 ? (
                    <EmptyState title={t('feed.empty_title')} message={t('feed.empty_message')} />
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {posts.data.map((p) => (
                            <PostCard key={p.id} post={p} />
                        ))}
                    </div>
                )}
            </div>
        </BrowseLayout>
    );
}
