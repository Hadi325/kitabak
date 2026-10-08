import { ProfileSectionIcon, useProfileDesignCopy } from './ProfileDesign';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { useForm } from '@inertiajs/react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function UpdatePasswordForm({
    className = '',
    hasPassword = true,
}) {
    const { t } = useTranslation('common');
    const design = useProfileDesignCopy();

    const [visible, setVisible] = useState({});
    const passwordInput = useRef();
    const currentPasswordInput = useRef();

    const {
        data,
        setData,
        errors,
        put,
        reset,
        processing,
    } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });



    const updatePassword = (e) => {
        e.preventDefault();

        put(route('password.update'), {
            preserveScroll: true,

            onSuccess: () => reset(),

            onError: (errors) => {
                if (errors.password) {
                    reset(
                        'password',
                        'password_confirmation',
                    );

                    passwordInput.current?.focus();
                }

                if (hasPassword && errors.current_password) {
                    reset('current_password');

                    currentPasswordInput.current?.focus();
                }
            },
        });
    };

    return (
        <section className={className}>
            <header className="profile-section-heading">
                <ProfileSectionIcon kind="lock" />

                <h2 className="text-lg font-medium text-gray-900">
                    {t(
                        hasPassword
                            ? 'profile_forms.password_title'
                            : 'profile_forms.create_password_title',
                    )}
                </h2>

                <p className="mt-1 text-sm text-gray-600">
                    {t(
                        hasPassword
                            ? 'profile_forms.password_description'
                            : 'profile_forms.create_password_description',
                    )}
                </p>
            </header>

            <form
                onSubmit={updatePassword}
                className="profile-password-form"
            >
                {/* A Google-only account has no current password yet. */}
                {hasPassword && <div>
                    <InputLabel
                        htmlFor="current_password"
                        value={t(
                            'profile_forms.current_password',
                        )}
                    />

                    <div className="profile-password-control">
                        <TextInput
                            id="current_password"
                            ref={currentPasswordInput}
                            value={data.current_password}
                            onChange={(e) =>
                                setData(
                                    'current_password',
                                    e.target.value,
                                )
                            }
                            type={
                                visible.current_password
                                    ? 'text'
                                    : 'password'
                            }
                            className="block w-full profile-password-input"
                            autoComplete="current-password"
                        />

                        <button
                            type="button"
                            className="profile-password-eye"
                            aria-label={
                                visible.current_password
                                    ? design.hidePassword
                                    : design.showPassword
                            }
                            aria-pressed={
                                !!visible.current_password
                            }
                            onClick={() =>
                                setVisible((current) => ({
                                    ...current,
                                    current_password:
                                        !current.current_password,
                                }))
                            }
                        >
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.7"
                                aria-hidden="true"
                            >
                                <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
                                <circle
                                    cx="12"
                                    cy="12"
                                    r="3"
                                />

                                {visible.current_password && (
                                    <path d="m4 4 16 16" />
                                )}
                            </svg>
                        </button>
                    </div>

                   <InputError
    message={
        errors.current_password ===
        'The current password field is required.'
            ? t('profile_forms.current_password_required')
            : errors.current_password ===
              'The password is incorrect.'
                ? t('profile_forms.current_password_incorrect')
                : errors.current_password
    }
    className="mt-2"
/>
                </div>}

                {/* New password */}
                <div>
                    <InputLabel
                        htmlFor="password"
                        value={t(
                            'profile_forms.new_password',
                        )}
                    />

                    <div className="profile-password-control">
                        <TextInput
                            id="password"
                            ref={passwordInput}
                            value={data.password}
                            onChange={(e) =>
                                setData(
                                    'password',
                                    e.target.value,
                                )
                            }
                            type={
                                visible.password
                                    ? 'text'
                                    : 'password'
                            }
                            className="block w-full profile-password-input"
                            autoComplete="new-password"
                        />

                        <button
                            type="button"
                            className="profile-password-eye"
                            aria-label={
                                visible.password
                                    ? design.hidePassword
                                    : design.showPassword
                            }
                            aria-pressed={
                                !!visible.password
                            }
                            onClick={() =>
                                setVisible((current) => ({
                                    ...current,
                                    password:
                                        !current.password,
                                }))
                            }
                        >
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.7"
                                aria-hidden="true"
                            >
                                <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
                                <circle
                                    cx="12"
                                    cy="12"
                                    r="3"
                                />

                                {visible.password && (
                                    <path d="m4 4 16 16" />
                                )}
                            </svg>
                        </button>
                    </div>

                  <InputError
    message={
        errors.password ===
        'The password field is required.'
            ? t('profile_forms.password_required')
            : errors.password ===
              'The password field must be at least 8 characters.'
                ? t('profile_forms.password_min_8')
                : errors.password ===
                  'The password field confirmation does not match.'
                    ? t('profile_forms.password_confirmation_mismatch')
                    : errors.password
    }
    className="mt-2"
/>
                </div>

                {/* Confirm password */}
                <div>
                    <InputLabel
                        htmlFor="password_confirmation"
                        value={t(
                            'profile_forms.confirm_password',
                        )}
                    />

                    <div className="profile-password-control">
                        <TextInput
                            id="password_confirmation"
                            value={
                                data.password_confirmation
                            }
                            onChange={(e) =>
                                setData(
                                    'password_confirmation',
                                    e.target.value,
                                )
                            }
                            type={
                                visible.password_confirmation
                                    ? 'text'
                                    : 'password'
                            }
                            className="block w-full profile-password-input"
                            autoComplete="new-password"
                        />

                        <button
                            type="button"
                            className="profile-password-eye"
                            aria-label={
                                visible.password_confirmation
                                    ? design.hidePassword
                                    : design.showPassword
                            }
                            aria-pressed={
                                !!visible.password_confirmation
                            }
                            onClick={() =>
                                setVisible((current) => ({
                                    ...current,
                                    password_confirmation:
                                        !current.password_confirmation,
                                }))
                            }
                        >
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.7"
                                aria-hidden="true"
                            >
                                <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
                                <circle
                                    cx="12"
                                    cy="12"
                                    r="3"
                                />

                                {visible.password_confirmation && (
                                    <path d="m4 4 16 16" />
                                )}
                            </svg>
                        </button>
                    </div>

                    <InputError
                        message={
                            errors.password_confirmation ===
                            'The password confirmation field is required.'
                                ? t(
                                      'profile_forms.password_confirmation_required',
                                  )
                                : errors.password_confirmation
                        }
                        className="mt-2"
                    />
                </div>

                <div className="profile-form-actions profile-wide">
                    <PrimaryButton
                        type="submit"
                        disabled={processing}
                    >
                        {t(
                            hasPassword
                                ? 'profile_forms.save'
                                : 'profile_forms.create_password_button',
                        )}
                    </PrimaryButton>
                </div>
            </form>
        </section>
    );
}
