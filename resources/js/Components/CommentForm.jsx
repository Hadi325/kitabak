import { useForm } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

export default function CommentForm({ post }) {
    const { t } = useTranslation('posts');
    const { data, setData, post: submit, processing, errors, reset } = useForm({
        body: '',
    });

    const onSubmit = (e) => {
        e.preventDefault();
        submit(route('comments.store', post.id), {
            preserveScroll: true,
            onSuccess: () => reset('body'),
        });
    };

    return (
        <form onSubmit={onSubmit} className="space-y-2">
            <textarea
                value={data.body}
                onChange={(e) => setData('body', e.target.value)}
                rows={3}
                placeholder={t('comments.placeholder')}
                className="w-full rounded border-gray-300"
            />
            {errors.body && <p className="text-xs text-red-600">{errors.body}</p>}
            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={processing || !data.body.trim()}
                    className="rounded bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                    {t('comments.submit')}
                </button>
            </div>
        </form>
    );
}
