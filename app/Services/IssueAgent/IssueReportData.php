<?php

namespace App\Services\IssueAgent;

class IssueReportData
{
    public function __construct(
        public readonly string $text,
        public readonly string $source,
        public readonly ?string $reporter = null,
        public readonly array $attachments = [],
        public readonly array $metadata = [],
    ) {
    }
}
