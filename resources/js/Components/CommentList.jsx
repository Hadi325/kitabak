import { Link, useForm } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

export default function CommentList({ comments, currentUser, post }) {
    const { t } = useTranslation('posts');
    const { delete: destroy, processing } = useForm();

    if (!comments?.length) {
        return <p className="text-sm text-gray-500">{t('comments.empty')}</p>;
    }

    return (
        <ul className="space-y-3">
            {comments.map((c) => {
                const canDelete =
                    currentUser &&
                    (currentUser.id === c.user_id ||
                        currentUser.id === post.user_id ||
                        currentUser.roles?.includes('admin'));

                return (
                    <li
                        key={c.id}
                        className="rounded border border-gray-200 bg-white p-3"
                    >
                        <div className="flex items-center justify-between">
                            <Link
                                href={route('users.show', c.user_id)}
                                className="text-sm font-medium text-gray-800 hover:underline"
                            >
                                {c.user?.name}
                            </Link>
                            <span className="text-xs text-gray-400">
                                {new Date(c.created_at).toLocaleString()}
                            </span>
                        </div>
                        <p className="mt-1 whitespace-pre-line text-sm text-gray-700">
                            {c.body}
                        </p>
                        {canDelete && (
                            <button
                                type="button"
                                disabled={processing}
                                onClick={() => {
                                    if (!confirm(t('comments.confirm_delete'))) return;
                                    destroy(route('comments.destroy', c.id), {
                                        preserveScroll: true,
                                    });
                                }}
                                className="mt-1 text-xs text-red-500 hover:underline"
                            >
                                {t('comments.delete')}
                            </button>
                        )}
                    </li>
                );
            })}
        </ul>
    );
}
