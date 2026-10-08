<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\IssueAgent\ProcessSlackIssueJob;
use App\Models\IssueAgentRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class IssueAgentController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'text' => ['required', 'string', 'max:20000'],
            'source' => ['nullable', 'string', 'max:80'],
            'reporter' => ['nullable', 'string', 'max:120'],
        ]);

        $issueRequest = IssueAgentRequest::query()->create([
            'source' => 'manual',
            'trigger_type' => 'internal_api',
            'status' => IssueAgentRequest::STATUS_PENDING,
            'payload' => $data,
        ]);

        ProcessSlackIssueJob::dispatch($issueRequest->id);

        return response()->json([
            'id' => $issueRequest->id,
            'status' => $issueRequest->status,
        ], 202);
    }
}
