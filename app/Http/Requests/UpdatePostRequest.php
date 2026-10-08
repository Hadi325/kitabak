<?php

namespace App\Http\Requests;

use App\Services\PostImageService;
use Illuminate\Foundation\Http\FormRequest;

class UpdatePostRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('update', $this->route('post')) ?? false;
    }

    public function rules(): array
    {
        $maxKb = (int) (PostImageService::MAX_BYTES / 1024);

        return [
            'title'         => ['required', 'string', 'max:255'],
            'description'   => ['nullable', 'string', 'max:5000'],
            'location'      => ['nullable', 'string', 'max:255'],
            'event_date'    => ['nullable', 'date'],
            'is_published'  => ['nullable', 'boolean'],

            'tags'          => ['nullable', 'array', 'max:15'],
            'tags.*'        => ['string', 'max:40'],

            // New images to append
            'images'        => ['nullable', 'array', 'max:' . PostImageService::MAX_PER_POST],
            'images.*'      => ['file', 'image', 'mimes:jpg,jpeg,png,webp,heic,heif', 'max:' . $maxKb],
            'labels'        => ['nullable', 'array'],
            'labels.*'      => ['nullable', 'string', 'in:before,after,other'],
            'captions'      => ['nullable', 'array'],
            'captions.*'    => ['nullable', 'string', 'max:255'],

            // IDs of existing images to delete
            'delete_image_ids'   => ['nullable', 'array'],
            'delete_image_ids.*' => ['integer'],
        ];
    }
}
