<?php

namespace App\Http\Requests;

use App\Models\User;
use App\Support\PhoneNumber;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProfileUpdateRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'nullable',
                'required_without:phone',
                'string',
                'lowercase',
                'email',
                'max:255',
                Rule::unique(User::class)->ignore($this->user()->id),
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if ($this->user()->registeredWithEmail() && $value !== $this->user()->email) {
                        $fail(__('profile.email_locked'));
                    }
                },
            ],
            'phone' => [
                'nullable',
                'required_without:email',
                'string',
                'max:20',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if (filled($value) && PhoneNumber::normalize((string) $value) === null) {
                        $fail('Enter a valid phone number including the country code.');
                    }
                },
                Rule::unique(User::class)->ignore($this->user()->id),
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if ($this->user()->registeredWithPhone() && $value !== $this->user()->phone) {
                        $fail(__('profile.phone_locked'));
                    }
                },
            ],
        ];
    }

    protected function prepareForValidation(): void
    {
        $rawPhone = trim((string) $this->phone);

        $this->merge([
            'email' => filled($this->email) ? strtolower(trim((string) $this->email)) : null,
            // Preserve non-empty invalid input so the validation closure can
            // report it instead of silently clearing the saved phone number.
            'phone' => $rawPhone === '' ? null : (PhoneNumber::normalize($rawPhone) ?? $rawPhone),
        ]);
    }
}
