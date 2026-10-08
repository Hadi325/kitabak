<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'phone' => null,
            'registration_method' => User::REGISTRATION_EMAIL,
            'password' => static::$password ??= Hash::make('password'),
            'password_set_at' => now(),
            'remember_token' => Str::random(10),
        ];
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }

    public function withPhone(?string $phone = null): static
    {
        return $this->state(fn (array $attributes) => [
            'phone' => $phone ?? '+961'.fake()->unique()->numerify('########'),
            'phone_verified_at' => now(),
        ]);
    }

    public function phoneRegistered(?string $phone = null): static
    {
        return $this->state(fn (array $attributes) => [
            'email' => null,
            'email_verified_at' => null,
            'phone' => $phone ?? '+961'.fake()->unique()->numerify('########'),
            'phone_verified_at' => now(),
            'registration_method' => User::REGISTRATION_PHONE,
        ]);
    }
}
