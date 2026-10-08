import FlashMessages from '@/Components/FlashMessages';
import ImageUploader from '@/Components/ImageUploader';
import TagInput from '@/Components/TagInput';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function Edit({ post }) {
    const { t } = useTranslation('posts');
    const [removed, setRemoved] = useState([]);

    const { data, setData, post: submit, processing, errors, progress } = useForm({
        _method: 'put',
        title: post.title || '',
        description: post.description || '',
        location: post.location || '',
        event_date: post.event_date ? post.event_date.substring(0, 10) : '',
        is_published: !!post.is_published,
        tags: post.tags?.map((t) => t.name) || [],
        images: [],
        labels: [],
        captions: [],
        delete_image_ids: [],
    });

    const toggleRemove = (id) => {
        const next = removed.includes(id)
            ? removed.filter((x) => x !== id)
            : [...removed, id];
        setRemoved(next);
        setData('delete_image_ids', next);
    };

    const onSubmit = (e) => {
        e.preventDefault();
        submit(route('posts.update', post.id), { forceFormData: true });
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold">
                    {t('edit.title', { title: post.title })}
                </h2>
            }
        >
            <Head title={t('edit.title', { title: post.title })} />
            <FlashMessages />

            <form
                onSubmit={onSubmit}
                className="mx-auto max-w-2xl space-y-5 px-4 py-6"
            >
                <Field label={t('form.title')} error={errors.title} required>
                    <input
                        type="text"
                        value={data.title}
                        onChange={(e) => setData('title', e.target.value)}
                        className="w-full rounded border-gray-300"
                    />
                </Field>

                <Field label={t('form.description')} error={errors.description}>
                    <textarea
                        rows={5}
                        value={data.description}
                        onChange={(e) => setData('description', e.target.value)}
                        className="w-full rounded border-gray-300"
                    />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                    <Field label={t('form.location')} error={errors.location}>
                        <input
                            type="text"
                            value={data.location}
                            onChange={(e) => setData('location', e.target.value)}
                            className="w-full rounded border-gray-300"
                        />
                    </Field>
                    <Field label={t('form.event_date')} error={errors.event_date}>
                        <input
                            type="date"
                            value={data.event_date}
                            onChange={(e) => setData('event_date', e.target.value)}
                            className="w-full rounded border-gray-300"
                        />
                    </Field>
                </div>

                <Field label={t('form.tags')} error={errors.tags}>
                    <TagInput value={data.tags} onChange={(v) => setData('tags', v)} />
                </Field>

                {post.images?.length > 0 && (
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            {t('edit.existing_images')}
                        </label>
                        <ul className="grid grid-cols-3 gap-2">
                            {post.images.map((img) => {
                                const marked = removed.includes(img.id);
                                return (
                                    <li
                                        key={img.id}
                                        className={`relative overflow-hidden rounded border ${
                                            marked ? 'opacity-40 ring-2 ring-red-400' : 'border-gray-200'
                                        }`}
                                    >
                                        <img
                                            src={img.thumbnail_url || img.url}
                                            alt=""
                                            className="aspect-square w-full object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => toggleRemove(img.id)}
                                            className="absolute bottom-1 right-1 rounded bg-white/90 px-2 py-0.5 text-xs text-red-600 shadow hover:bg-white"
                                        >
                                            {marked ? t('edit.keep') : t('edit.remove')}
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}

                <Field label={t('edit.add_more_images')}>
                    <ImageUploader
                        value={{ images: data.images, labels: data.labels, captions: data.captions }}
                        onChange={({ images, labels, captions }) => {
                            setData((prev) => ({ ...prev, images, labels, captions }));
                        }}
                        disabled={processing}
                    />
                    {progress && (
                        <progress value={progress.percentage} max="100" className="mt-2 w-full" />
                    )}
                </Field>

                <label className="inline-flex items-center gap-2 text-sm">
                    <input
                        type="checkbox"
                        checked={data.is_published}
                        onChange={(e) => setData('is_published', e.target.checked)}
                        className="rounded border-gray-300"
                    />
                    {t('form.publish_now')}
                </label>

                <div className="flex justify-end gap-2 pt-2">
                    <Link
                        href={route('posts.show', post.id)}
                        className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
                    >
                        {t('form.cancel')}
                    </Link>
                    <button
                        type="submit"
                        disabled={processing}
                        className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {t('form.save')}
                    </button>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}

function Field({ label, error, required, children }) {
    return (
        <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
                {label}
                {required && <span className="text-red-500"> *</span>}
            </label>
            {children}
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
    );
}
