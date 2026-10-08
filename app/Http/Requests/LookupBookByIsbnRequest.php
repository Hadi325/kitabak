<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class LookupBookByIsbnRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<int, string>> */
    public function rules(): array
    {
        return [
            'identifier' => ['required_without:isbn', 'string', 'max:255'],
            'isbn' => ['required_without:identifier', 'string', 'max:255'],
            'barcode_format' => ['nullable', 'string', 'max:32'],
        ];
    }

    protected function prepareForValidation(): void
    {
        if (is_string($this->input('isbn'))) {
            $this->merge(['isbn' => trim($this->input('isbn'))]);
        }

        if (! $this->filled('identifier') && $this->filled('isbn')) {
            $this->merge(['identifier' => $this->input('isbn')]);
        }
    }
}
