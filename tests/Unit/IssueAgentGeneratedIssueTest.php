<?php

namespace Tests\Unit;

use App\Services\IssueAgent\GeneratedIssue;
use App\Services\IssueAgent\IssueReportData;
use PHPUnit\Framework\TestCase;

class IssueAgentGeneratedIssueTest extends TestCase
{
    public function test_markdown_embeds_public_image_attachments(): void
    {
        $issue = new GeneratedIssue(
            title: 'Checkout upload fails',
            type: 'bug',
            platform: 'web',
            module: 'checkout',
            priority: 'normal',
            summary: 'The checkout upload fails after selecting an image.',
            stepsToReproduce: ['Open checkout.', 'Upload an image.'],
            expectedBehavior: 'The image uploads.',
            actualBehavior: 'The upload fails.',
            additionalInformation: null,
            suggestedLabels: [],
            confidence: 0.9,
            raw: [],
        );

        $report = new IssueReportData(
            text: 'Upload image fails.',
            source: 'Slack Issue Agent',
            reporter: 'Khaldoun',
            attachments: [[
                'kind' => 'image',
                'title' => 'checkout-error.png',
                'public_url' => 'https://staging.kitabak.me/storage/issue-agent/attachments/checkout-error.png',
            ]],
            metadata: [],
        );

        $markdown = $issue->toMarkdown($report);

        $this->assertStringContainsString(
            '![checkout-error.png](https://staging.kitabak.me/storage/issue-agent/attachments/checkout-error.png)',
            $markdown,
        );
    }
}
