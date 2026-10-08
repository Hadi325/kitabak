<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class VerifySlackSignature
{
    public function handle(Request $request, Closure $next): Response
    {
        $secret = (string) config('issue-agent.slack.signing_secret');
        $timestamp = (string) $request->header('X-Slack-Request-Timestamp');
        $signature = (string) $request->header('X-Slack-Signature');

        if ($secret === '' || $timestamp === '' || $signature === '') {
            Log::warning('Slack validation failure: missing signature inputs');

            return response()->json(['message' => 'Invalid Slack signature.'], 401);
        }

        if (! ctype_digit($timestamp) || abs(time() - (int) $timestamp) > 300) {
            Log::warning('Slack validation failure: expired timestamp');

            return response()->json(['message' => 'Expired Slack request.'], 401);
        }

        $base = 'v0:'.$timestamp.':'.$request->getContent();
        $expected = 'v0='.hash_hmac('sha256', $base, $secret);

        if (! hash_equals($expected, $signature)) {
            Log::warning('Slack validation failure: invalid signature');

            return response()->json(['message' => 'Invalid Slack signature.'], 401);
        }

        return $next($request);
    }
}
