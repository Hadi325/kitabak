<?php

namespace App\Http\Requests;

use App\Models\Book;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;


class AnalyzeBookPhotosRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
       return [
    'front' => ['required', 'image', 'mimes:jpeg,jpg,png,webp', 'max:3072'],
    'back' => ['required', 'image', 'mimes:jpeg,jpg,png,webp', 'max:3072'],
    'book_category' => ['required', Rule::in(Book::BOOK_CATEGORIES)],
];
    }
}
