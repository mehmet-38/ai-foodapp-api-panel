<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PremiumPackage;
use Illuminate\Http\Request;

class PremiumController extends Controller
{
    /**
     * Get list of active premium packages
     * GET /api/premium/packages
     */
    public function index()
    {
        $packages = PremiumPackage::where('is_active', true)
            ->select(['id', 'name', 'price_monthly', 'price_yearly', 'trial_days', 'description'])
            ->get();

        return response()->json([
            'success' => true,
            'data' => $packages
        ]);
    }
}
