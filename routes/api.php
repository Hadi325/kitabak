<?php

use App\Http\Controllers\Api\IssueAgentController;
use App\Http\Controllers\Api\Slack\SlackCommandController;
use App\Http\Controllers\Api\Slack\SlackEventController;
use Illuminate\Support\Facades\Route;

Route::prefix('integrations/slack')
    ->middleware(['slack.signature', 'throttle:60,1'])
    ->group(function () {
        Route::post('/events', SlackEventController::class);
        Route::post('/commands', SlackCommandController::class);
        Route::post('/actions', SlackCommandController::class);
    });

Route::middleware(['auth:sanctum', 'throttle:30,1'])
    ->prefix('issue-agent')
    ->group(function () {
        Route::post('/issues', [IssueAgentController::class, 'store']);
    });
