<?php

namespace App\Services\IssueAgent;

class GeneratedIssue
{
    public function __construct(
        public readonly string $title,
        public readonly string $type,
        public readonly ?string $platform,
        public readonly ?string $module,
        public readonly string $priority,
        public readonly string $summary,
        public readonly array $stepsToReproduce,
        public readonly ?string $expectedBehavior,
        public readonly ?string $actualBehavior,
        public readonly ?string $additionalInformation,
        public readonly array $suggestedLabels,
        public readonly float $confidence,
        public readonly array $raw,
        public readonly bool $actionable = true,
        public readonly ?string $rejectionReason = null,
        public readonly ?string $clarifyingQuestion = null,
    ) {
    }

    public function labels(): array
    {
        return array_values(array_unique(array_filter(array_merge(
            config('issue-agent.github.labels', []),
            $this->suggestedLabels,
            [$this->type],
        ))));
    }

    public function toMarkdown(IssueReportData $report): string
    {
        $steps = count($this->stepsToReproduce) > 0
            ? collect($this->stepsToReproduce)->values()->map(fn ($step, $index) => ($index + 1).'. '.$step)->implode("\n")
            : 'Not provided.';

        $attachments = collect($report->attachments)
            ->map(function (array $attachment): string {
                $title = (string) ($attachment['title'] ?? $attachment['name'] ?? 'Slack attachment');

                if (($attachment['kind'] ?? null) === 'image' && is_string($attachment['public_url'] ?? null)) {
                    return "![{$title}]({$attachment['public_url']})";
                }

                if (is_string($attachment['url'] ?? null)) {
                    return "- [{$title}]({$attachment['url']})";
                }

                return "- {$title}";
            })
            ->implode("\n");

        return trim(implode("\n\n", array_filter([
            "## Summary\n\n{$this->summary}",
            "## Steps to reproduce\n\n{$steps}",
            "## Expected behavior\n\n".($this->expectedBehavior ?: 'Not provided.'),
            "## Actual behavior\n\n".($this->actualBehavior ?: 'Not provided.'),
            "## Environment\n\nPlatform: ".($this->platform ?: 'Unknown')."\nModule: ".($this->module ?: 'Unknown')."\nPriority: {$this->priority}",
            $this->additionalInformation ? "## Additional information\n\n{$this->additionalInformation}" : null,
            $attachments !== '' ? "## Attachments\n\n{$attachments}" : null,
            "## Source\n\nReported through {$report->source}.\nReporter: ".($report->reporter ?: 'Unknown'),
            isset($report->metadata['original_text']) ? "## Original report\n\n".$report->metadata['original_text'] : null,
        ])))."\n";
    }
}
