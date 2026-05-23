<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\Integrations\AnalyticsService;
use App\Services\Integrations\FirebaseUsageService;
use App\Services\Integrations\GeminiUsageService;
use App\Services\Integrations\RevenueCatService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class IntegrationsController extends Controller
{
    public function __construct(
        private readonly RevenueCatService $revenueCat,
        private readonly AnalyticsService $analytics,
        private readonly GeminiUsageService $gemini,
        private readonly FirebaseUsageService $firebaseUsage,
    ) {
    }

    public function index()
    {
        return Inertia::render('admin/integrations');
    }

    public function overview()
    {
        return response()->json([
            'success' => true,
            'data' => [
                'revenuecat' => $this->revenueCat->overview(),
                'analytics' => $this->analytics->overview(),
                'gemini' => $this->gemini->overview(),
                'firebase' => $this->firebaseUsage->overview(),
            ],
        ]);
    }

    public function revenueCatCustomer(Request $request)
    {
        $validated = $request->validate([
            'uid' => ['required', 'string', 'max:1500'],
        ]);

        return response()->json([
            'success' => true,
            'data' => $this->revenueCat->customer($validated['uid']),
        ]);
    }
}
