<?php

namespace App\Http\Controllers;

use App\Exceptions\OpenAIRateLimitException;
use App\Http\Requests\AnalyzeBookPhotosRequest;
use App\Models\Book;
use App\Services\OpenAIBookPhotoAnalyzer;
use Illuminate\Http\JsonResponse;
use RuntimeException;

class BookPhotoAnalysisController extends Controller
{
    public function __invoke(AnalyzeBookPhotosRequest $request, OpenAIBookPhotoAnalyzer $analyzer): JsonResponse
    {
        try {
            $result = $analyzer->analyze(
                $request->file('front'),
                $request->file('back'),
                $request->validated('book_category'),
            );
        } catch (OpenAIRateLimitException $exception) {
            return response()->json([
                'message' => "The OpenAI rate limit was reached. Wait {$exception->retryAfter} seconds, then try again.",
                'retry_after' => $exception->retryAfter,
            ], 429);
        } catch (RuntimeException $exception) {
            return response()->json(['message' => $exception->getMessage()], 503);
        }

      $matches = collect();
$bookCategory = $request->validated('book_category');

if (filled($result['title'] ?? null)) {
            $title = trim($result['title']);
            $matches = Book::query()
->select([
    'id',
    'title',
    'subject',
    'book_category',
    'book_type',
    'part',
    'grade',
    'author',
    'publisher',
    'language',
    'edition_year',
    'edition_number',
    'isbn',
    'barcode',
    'barcode_format',
    'cover_image_url',
])
->where('book_category', $bookCategory)                ->where(function ($query) use ($result, $title): void {
                    $query->where('title', 'like', '%'.$title.'%');

                    if (filled($result['author'] ?? null)) {
                        $query->orWhere(function ($query) use ($result, $title): void {
                            $query->where('author', 'like', '%'.trim($result['author']).'%')
                                ->where('title', 'like', '%'.mb_substr($title, 0, 40).'%');
                        });
                    }
                })
                ->when(
                    filled($result['book_type'] ?? null),
                    fn ($query) => $query->where(function ($query) use ($result): void {
                        $query->whereNull('book_type')
                            ->orWhere('book_type', $result['book_type']);
                    }),
                )
                ->when(
                    filled($result['part'] ?? null),
                    fn ($query) => $query->where(function ($query) use ($result): void {
                        $query->whereNull('part')
                            ->orWhere('part', $result['part']);
                    }),
                )
                ->when(
                    filled($result['book_type'] ?? null),
                    fn ($query) => $query->orderByRaw('CASE WHEN book_type = ? THEN 0 ELSE 1 END', [$result['book_type']]),
                )
                ->when(
                    filled($result['part'] ?? null),
                    fn ($query) => $query->orderByRaw('CASE WHEN part = ? THEN 0 ELSE 1 END', [$result['part']]),
                )
                ->limit(3)
                ->get();
        }

        return response()->json(['data' => [...$result, 'matches' => $matches]]);
    }
}
