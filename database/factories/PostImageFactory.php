<?php

namespace Database\Factories;

use App\Models\Post;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\PostImage>
 */
class PostImageFactory extends Factory
{
    public function definition(): array
    {
        return [
            'post_id'        => Post::factory(),
            'path'           => 'posts/placeholder.jpg',
            'thumbnail_path' => null,
            'original_name'  => 'placeholder.jpg',
            'mime_type'      => 'image/jpeg',
            'size'           => $this->faker->numberBetween(50_000, 2_000_000),
            'caption'        => $this->faker->optional()->sentence(),
            'label'          => $this->faker->randomElement(['before', 'after', 'other']),
            'order'          => 0,
        ];
    }
}
