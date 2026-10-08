<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Jobs\IssueAgent\ProcessSlackIssueJob;
use App\Models\IssueAgentRequest;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class IssueAgentController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/IssueAgent', [
            'requests' => IssueAgentRequest::query()
                ->latest()
                ->paginate(20)
                ->withQueryString(),
        ]);
    }

    public function retry(IssueAgentRequest $issueAgentRequest): RedirectResponse
    {
        if ($issueAgentRequest->status !== IssueAgentRequest::STATUS_FAILED) {
            return back()->with('error', 'Only failed Issue Agent requests can be retried.');
        }

        if ($issueAgentRequest->github_issue_url) {
            return back()->with('error', 'This request already has a GitHub issue.');
        }

        $issueAgentRequest->forceFill([
            'status' => IssueAgentRequest::STATUS_PENDING,
            'error_message' => null,
            'processed_at' => null,
        ])->save();

        ProcessSlackIssueJob::dispatch($issueAgentRequest->id);

        return back()->with('success', 'Issue Agent request queued for retry.');
    }
}
