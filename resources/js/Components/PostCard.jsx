import { Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

export default function PostCard({ post }) {
    const { t } = useTranslation('common');
    const cover = post.images?.[0];
    return (
        <Link
            href={route('posts.show', post.id)}
            className="group block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-slate-200/70"
        >
            <div className="aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-indigo-50 to-slate-100">
                {cover ? (
                    <img
                        src={cover.thumbnail_url || cover.url}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                ) : (
                    <div className="flex h-full items-center justify-center text-sm text-gray-400">
                        {t('card.no_image')}
                    </div>
                )}
            </div>
            <div className="p-4">
                <h3 className="line-clamp-1 text-lg font-bold text-slate-900 transition group-hover:text-indigo-700">{post.title}</h3>
                <div className="mt-1.5 line-clamp-1 text-xs font-medium text-slate-500">
                    {post.user?.name}
                    {post.event_date && (
                        <> · {new Date(post.event_date).toLocaleDateString()}</>
                    )}
                    {post.location && <> · {post.location}</>}
                </div>
                <div className="mt-4 flex items-center gap-4 border-t border-slate-100 pt-3 text-xs font-semibold text-slate-400">
                    <span>♥ {post.likes_count ?? 0}</span>
                    <span>💬 {post.comments_count ?? 0}</span>
                </div>
            </div>
        </Link>
    );
}
