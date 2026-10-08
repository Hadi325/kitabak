<?php

namespace App\Exceptions;

use RuntimeException;

class OtpSendRateLimitException extends RuntimeException
{
    public function __construct(private readonly int $retryAfter)
    {
        parent::__construct('Too many verification codes requested.');
    }

    public function retryAfter(): int
    {
        return $this->retryAfter;
    }
}
