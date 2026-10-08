import { ProfileSectionIcon } from './ProfileDesign';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Link, useForm, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
    phone,
    registrationMethod,
    className = '',
}) {
    const { t } = useTranslation('common');
    const user = usePage().props.auth.user;

    const localPhone = phone?.startsWith('+961') ? phone.slice(4) : (phone ?? '');
    const emailIsLocked = registrationMethod === 'email';
    const phoneIsLocked = registrationMethod === 'phone';
 const { data, setData, patch, errors, processing } =
    useForm({
        name: user.name,
        email: user.email ?? '',
        phone: localPhone,
    });

    const submit = (e) => {
        e.preventDefault();

        patch(route('profile.update'));
    };

    return (
        <section className={className}>
            <header className="profile-section-heading">
                <ProfileSectionIcon kind="user" />
                <h2 className="text-lg font-medium text-gray-900">
                    {t('profile_forms.information_title')}
                </h2>

                <p className="mt-1 text-sm text-gray-600">
                    {t('profile_forms.information_description')}
                </p>
            </header>

            <form onSubmit={submit} className="profile-info-form">
                <div className="profile-field profile-name-field">
                    <InputLabel htmlFor="name" value={t('profile_forms.name')} />

                    <TextInput
                        id="name"
                        className="mt-1 block w-full"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        required={!data.phone}
                        isFocused
                        autoComplete="name"
                    />

                    <InputError className="mt-2" message={errors.name} />
                </div>

                <div className="profile-field">
                    <InputLabel htmlFor="phone" value={t('profile_forms.phone', { defaultValue: 'Phone number' })} />

                    <div className="mt-1 flex overflow-hidden rounded-md shadow-sm">
                        <span className="inline-flex items-center gap-2 border border-e-0 border-gray-300 bg-gray-50 px-3 font-semibold text-gray-700 dark:border-gray-700 dark:bg-slate-800 dark:text-gray-200" dir="ltr">
                            <span aria-hidden="true">🇱🇧</span> +961
                        </span>
                        <TextInput
                            id="phone"
                            type="tel"
                            inputMode="tel"
                            className="block min-w-0 flex-1 rounded-s-none disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-500 disabled:opacity-100 dark:disabled:border-slate-700 dark:disabled:bg-slate-800 dark:disabled:text-slate-400"
                            value={data.phone}
                            onChange={(e) => setData('phone', e.target.value)}
                            required={!data.email}
                            readOnly={phoneIsLocked}
                            disabled={phoneIsLocked}
                            autoComplete="tel-national"
                            placeholder="70 123 456"
                        />
                    </div>

                    <p className={`mt-2 text-xs ${phoneIsLocked ? 'font-medium text-slate-500 dark:text-slate-400' : 'text-slate-500 dark:text-slate-400'}`}>
                        {t(phoneIsLocked ? 'profile_forms.phone_locked' : 'profile_forms.phone_change_verification')}
                    </p>

<InputError
    message={
        errors.phone === 'The phone has already been taken.'
            ? t('profile_forms.phone_taken')
            : errors.phone
    }
/>                </div>

                <div className="profile-field">
                    <InputLabel htmlFor="email" value={t('profile_forms.email')} />

                    <TextInput
                        id="email"
                        type="email"
                        className="mt-1 block w-full disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-500 disabled:opacity-100 dark:disabled:border-slate-700 dark:disabled:bg-slate-800 dark:disabled:text-slate-400"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        required={!data.phone}
                        readOnly={emailIsLocked}
                        disabled={emailIsLocked}
                        autoComplete="username"
                    />

                    <p className={`mt-2 text-xs ${emailIsLocked ? 'font-medium text-slate-500 dark:text-slate-400' : 'text-slate-500 dark:text-slate-400'}`}>
                        {t(emailIsLocked ? 'profile_forms.email_locked' : 'profile_forms.email_change_verification')}
                    </p>

                    <InputError className="mt-2" message={errors.email} />
                </div>

                {mustVerifyEmail && user.email && user.email_verified_at === null && (
                    <div className="profile-wide">
                        <p className="mt-2 text-sm text-gray-800">
                            {t('profile_forms.email_unverified')}{' '}
                            <Link
                                href={route('verification.send')}
                                method="post"
                                as="button"
                                className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                            >
                                {t('profile_forms.resend_verification')}
                            </Link>
                        </p>

                        {status === 'verification-link-sent' && (
                            <div className="mt-2 text-sm font-medium text-green-600">
                                {t('profile_forms.verification_sent')}
                            </div>
                        )}
                    </div>
                )}

               <div className="profile-form-actions profile-wide">
    <PrimaryButton type="submit" disabled={processing}>
        {t('profile_forms.save')}
    </PrimaryButton>
</div>
            </form>
        </section>
    );
}
