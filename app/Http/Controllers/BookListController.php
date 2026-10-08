<?php

namespace App\Http\Controllers;

use App\Exceptions\OpenAIRateLimitException;
use App\Http\Requests\AnalyzeBookListRequest;
use App\Services\BookListAnalyzer;
use App\Services\OpenAISchoolListAnalyzer;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class BookListController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('BookLists/Create');
    }

    public function analyze(AnalyzeBookListRequest $request, OpenAISchoolListAnalyzer $ai, BookListAnalyzer $analyzer): JsonResponse
    {
        $validated = $request->validated();

        try {
            $extracted = $ai->analyze($validated['text'] ?? null, $request->file('images', []));
        } catch (OpenAIRateLimitException $exception) {
            return response()->json([
                'message' => "The OpenAI rate limit was reached. Wait {$exception->retryAfter} seconds, then try again.",
                'retry_after' => $exception->retryAfter,
            ], 429);
        } catch (RuntimeException $exception) {
            return response()->json(['message' => $exception->getMessage()], 503);
        }

        return response()->json([
            ...$analyzer->analyzeExtractedItems($extracted['items']),
            'extracted_text' => $extracted['extracted_text'],
        ]);
    }
}
