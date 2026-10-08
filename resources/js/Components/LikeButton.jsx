import { Link, useForm } from '@inertiajs/react';

export default function LikeButton({ post, liked, canLike }) {
    const { post: submit, processing } = useForm();

    if (!canLike) {
        return (
            <Link
                href={route('login')}
                className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
            >
                ♡ {post.likes_count}
            </Link>
        );
    }

    return (
        <button
            type="button"
            disabled={processing}
            onClick={() =>
                submit(route('posts.like', post.id), { preserveScroll: true })
            }
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm transition ${
                liked
                    ? 'border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
        >
            <span>{liked ? '♥' : '♡'}</span>
            <span>{post.likes_count}</span>
        </button>
    );
}
