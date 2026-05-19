<?php

use Illuminate\Support\Facades\Route;

Route::post('/revenuecat/webhook', [App\Http\Controllers\Api\RevenueCatController::class, 'handleWebhook']);

Route::fallback(function () {
    return response()->json([
        'success' => false,
        'message' => 'The legacy Laravel mobile API has been disabled. Mobile data is managed in Firebase.',
    ], 410);
});
