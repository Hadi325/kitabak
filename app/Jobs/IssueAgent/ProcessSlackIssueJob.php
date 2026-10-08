<?php

namespace App\Jobs\IssueAgent;

use App\Models\IssueAgentRequest;
use App\Services\IssueAgent\IssueGeneratorService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class ProcessSlackIssueJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $tries = 2;

    public function __construct(public readonly int $requestId)
    {
    }

    public function handle(IssueGeneratorService $generator): void
    {
        $request = IssueAgentRequest::query()->findOrFail($this->requestId);

        $generator->process($request);
    }
}
