import FlashMessages from '@/Components/FlashMessages';
import ImageUploader from '@/Components/ImageUploader';
import TagInput from '@/Components/TagInput';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

export default function Create() {
    const { t } = useTranslation('posts');
    const { data, setData, post, processing, errors, progress } = useForm({
        title: '',
        description: '',
        location: '',
        event_date: '',
        is_published: true,
        tags: [],
        images: [],
        labels: [],
        captions: [],
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('posts.store'), { forceFormData: true });
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold">{t('create.title')}</h2>}
        >
            <Head title={t('create.title')} />
            <FlashMessages />

            <form
                onSubmit={submit}
                className="mx-auto max-w-2xl space-y-5 px-4 py-6"
            >
                <Field label={t('form.title')} error={errors.title} required>
                    <input
                        type="text"
                        value={data.title}
                        onChange={(e) => setData('title', e.target.value)}
                        className="w-full rounded border-gray-300"
                        autoFocus
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

                <Field label={t('form.images')} error={errors['images'] || errors['images.0']}>
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
                        href={route('posts.index')}
                        className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
                    >
                        {t('form.cancel')}
                    </Link>
                    <button
                        type="submit"
                        disabled={processing}
                        className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {t('form.create')}
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
