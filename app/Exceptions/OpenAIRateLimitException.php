<?php

namespace App\Exceptions;

use RuntimeException;

class OpenAIRateLimitException extends RuntimeException
{
    public function __construct(public readonly int $retryAfter)
    {
        parent::__construct('OpenAI rate limit reached.');
    }
}
