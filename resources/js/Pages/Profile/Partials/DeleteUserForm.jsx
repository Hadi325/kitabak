import { ProfileSectionIcon, useProfileDesignCopy } from './ProfileDesign';
import DangerButton from '@/Components/DangerButton';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { useForm } from '@inertiajs/react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function DeleteUserForm({ className = '' }) {
    const { t } = useTranslation('common');
    const design = useProfileDesignCopy();
    const [confirmingUserDeletion, setConfirmingUserDeletion] = useState(false);
    const passwordInput = useRef();

    const {
        data,
        setData,
        delete: destroy,
        processing,
        reset,
        errors,
        clearErrors,
    } = useForm({
        password: '',
    });

    const confirmUserDeletion = () => {
        setConfirmingUserDeletion(true);
    };

    const deleteUser = (e) => {
        e.preventDefault();

        destroy(route('profile.destroy'), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onError: () => passwordInput.current.focus(),
            onFinish: () => reset(),
        });
    };

    const closeModal = () => {
        setConfirmingUserDeletion(false);

        clearErrors();
        reset();
    };

    return (
        <section className={`space-y-6 ${className}`}>
            <header className="profile-section-heading">
                <ProfileSectionIcon kind="trash" />
                <h2 className="text-lg font-medium text-gray-900">
                    {t('profile_forms.delete_title')}
                </h2>

                <p className="mt-1 text-sm text-gray-600">
                    {design.deleteIntro}
                </p>
            </header>

                <div className="profile-delete-warning -translate-y-2 sm:translate-y-0">
                    <ProfileSectionIcon kind="alert" />
                <div>
                    <strong>{design.permanent}</strong>
                    <p>{t('profile_forms.delete_description')}</p>
                </div>
            </div>
           <DangerButton
    type="button"
    onClick={confirmUserDeletion}
    className="w-full justify-center  sm:w-auto"
>
    {t('profile_forms.delete')}
</DangerButton>

            <Modal show={confirmingUserDeletion} onClose={closeModal}>
                <form onSubmit={deleteUser} className="p-6">
                    <h2 className="text-lg font-medium text-gray-900">
                        {t('profile_forms.delete_confirm_title')}
                    </h2>

                    <p className="mt-1 text-sm text-gray-600">
                        {t('profile_forms.delete_confirm_description')}
                    </p>

                    <div className="mt-6">
                        <InputLabel
                            htmlFor="delete_account_password"
                            value={t('profile_forms.password')}
                            className="sr-only"
                        />

                        <TextInput
                            id="delete_account_password"
                            type="password"
                            name="password"
                            ref={passwordInput}
                            value={data.password}
                            onChange={(e) =>
                                setData('password', e.target.value)
                            }
                            className="mt-1 block w-3/4"
                            isFocused
                            placeholder={t('profile_forms.password')}
                        />

                        <InputError
                            message={errors.password}
                            className="mt-2"
                        />
                    </div>

                    <div className="mt-6 flex justify-end">
                        <SecondaryButton type="button" onClick={closeModal}>
                            {t('profile_forms.cancel')}
                        </SecondaryButton>

                        <DangerButton type="submit" className="ms-3" disabled={processing}>
                            {t('profile_forms.delete')}
                        </DangerButton>
                    </div>
                </form>
            </Modal>
        </section>
    );
}
