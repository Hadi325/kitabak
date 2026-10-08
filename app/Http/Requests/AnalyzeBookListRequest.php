<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AnalyzeBookListRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'text' => ['nullable', 'required_without:images', 'string', 'min:3', 'max:100000'],
            'images' => ['nullable', 'required_without:text', 'array', 'min:1', 'max:10'],
            'images.*' => ['image', 'mimes:jpeg,jpg,png,webp', 'max:3072'],
            'file_name' => ['nullable', 'string', 'max:255'],
            'detected_grade' => ['nullable', 'string', 'max:30'],
        ];
    }
}
