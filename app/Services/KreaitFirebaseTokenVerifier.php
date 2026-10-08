<?php

namespace App\Services;

use App\Contracts\FirebaseTokenVerifier;
use Kreait\Firebase\Contract\Auth;
use Kreait\Firebase\Factory;
use RuntimeException;

class KreaitFirebaseTokenVerifier implements FirebaseTokenVerifier
{
    private ?Auth $auth = null;

    public function verify(string $idToken): array
    {
        $claims = $this->auth()->verifyIdToken($idToken)->claims();
        $firebase = $claims->get('firebase', []);

        return [
            'uid' => (string) $claims->get('sub'),
            'email' => $claims->get('email'),
            'email_verified' => (bool) $claims->get('email_verified', false),
            'name' => $claims->get('name'),
            'sign_in_provider' => is_array($firebase)
                ? ($firebase['sign_in_provider'] ?? null)
                : null,
        ];
    }

    private function auth(): Auth
    {
        if ($this->auth) {
            return $this->auth;
        }

        $credentials = config('services.firebase.credentials');

        if (! is_string($credentials) || trim($credentials) === '') {
            throw new RuntimeException('FIREBASE_CREDENTIALS is not configured.');
        }

        $credentials = trim($credentials);

        if (! str_starts_with($credentials, '{') && ! $this->isAbsolutePath($credentials)) {
            $credentials = base_path($credentials);
        }

        $factory = (new Factory)->withServiceAccount($credentials);

        if ($projectId = config('services.firebase.project_id')) {
            $factory = $factory->withProjectId($projectId);
        }

        return $this->auth = $factory->createAuth();
    }

    private function isAbsolutePath(string $path): bool
    {
        return preg_match('/^(?:[A-Za-z]:[\\\\\/]|[\\\\\/]{1,2})/', $path) === 1;
    }
}
