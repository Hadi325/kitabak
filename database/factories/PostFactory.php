<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Post>
 */
class PostFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id'      => User::factory(),
            'title'        => $this->faker->sentence(4),
            'description'  => $this->faker->paragraphs(2, true),
            'location'     => $this->faker->city(),
            'event_date'   => $this->faker->dateTimeBetween('-3 years', 'now'),
            'is_published' => true,
        ];
    }
}
