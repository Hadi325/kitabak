<?php

namespace App\Contracts;

interface FirebaseTokenVerifier
{
    /**
     * @return array{
     *     uid: string,
     *     email: string|null,
     *     email_verified: bool,
     *     name: string|null,
     *     sign_in_provider: string|null
     * }
     */
    public function verify(string $idToken): array;
}
