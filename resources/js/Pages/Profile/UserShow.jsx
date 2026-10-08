import EmptyState from '@/Components/EmptyState';
import PostCard from '@/Components/PostCard';
import BrowseLayout from '@/Layouts/BrowseLayout';
import { Head } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

export default function UserShow({ profileUser, posts }) {
    const { t } = useTranslation('posts');
    return (
        <BrowseLayout
            header={
                <div>
                    <h2 className="text-xl font-semibold">{profileUser.name}</h2>
                    <p className="text-xs text-gray-500">
                        {t('profile.member_since', {
                            date: new Date(profileUser.created_at).toLocaleDateString(),
                        })}
                    </p>
                </div>
            }
        >
            <Head title={profileUser.name} />
            <div className="mx-auto max-w-6xl px-4 py-6">
                {posts.data.length === 0 ? (
                    <EmptyState
                        title={t('profile.empty_title')}
                        message={t('profile.empty_message')}
                    />
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
