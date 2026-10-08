import Modal from '@/Components/Modal';
import { useForm } from '@inertiajs/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function ReportButton({ post }) {
    const { t } = useTranslation('posts');
    const [open, setOpen] = useState(false);
    const { data, setData, post: submit, processing, errors, reset } = useForm({
        reason: '',
    });

    const close = () => {
        setOpen(false);
        reset();
    };

    const onSubmit = (e) => {
        e.preventDefault();
        submit(route('posts.reports.store', post.id), {
            preserveScroll: true,
            onSuccess: () => close(),
        });
    };

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="text-xs text-gray-500 hover:text-red-600 hover:underline"
            >
                ⚠ {t('report.button')}
            </button>

            <Modal show={open} onClose={close} maxWidth="md">
                <form onSubmit={onSubmit} className="p-6">
                    <h3 className="text-lg font-semibold">{t('report.title')}</h3>
                    <p className="mt-1 text-sm text-gray-500">{t('report.description')}</p>

                    <textarea
                        rows={4}
                        value={data.reason}
                        onChange={(e) => setData('reason', e.target.value)}
                        className="mt-3 w-full rounded border-gray-300 text-sm"
                        placeholder={t('report.placeholder')}
                        autoFocus
                    />
                    {errors.reason && (
                        <p className="mt-1 text-xs text-red-600">{errors.reason}</p>
                    )}

                    <div className="mt-4 flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={close}
                            className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
                        >
                            {t('report.cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                        >
                            {t('report.submit')}
                        </button>
                    </div>
                </form>
            </Modal>
        </>
    );
}
