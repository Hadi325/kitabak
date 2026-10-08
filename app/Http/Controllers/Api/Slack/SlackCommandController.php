<?php

namespace App\Http\Controllers\Api\Slack;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class SlackCommandController extends Controller
{
    public function __invoke(): JsonResponse
    {
        return response()->json([
            'response_type' => 'ephemeral',
            'text' => 'Slash command support is wired for future Issue Agent expansion. Add the configured reaction to a message to create an issue.',
        ]);
    }
}
