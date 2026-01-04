<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class RevenueCatController extends Controller
{
    public function handleWebhook(Request $request)
    {
        // 1. Security Check
        $authHeader = $request->header('Authorization');
        $secret = env('REVENUECAT_WEBHOOK_SECRET');

        if ($authHeader !== $secret) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $event = $request->input('event');
        if (!$event) {
            return response()->json(['message' => 'Invalid payload'], 400);
        }

        $userId = $event['app_user_id'] ?? null;
        $type = $event['type'] ?? null;

        if (!$userId) {
             Log::warning('RevenueCat Webhook: No app_user_id found in event', $event);
             return response()->json(['message' => 'UserId missing'], 200); // Return 200 to acknowledge receipt
        }

        $user = User::find($userId);

        if (!$user) {
             Log::warning("RevenueCat Webhook: User not found with ID: $userId");
             return response()->json(['message' => 'User not found'], 200);
        }

        // 2. Handle Event Type
        try {
            switch ($type) {
                case 'INITIAL_PURCHASE':
                case 'RENEWAL':
                case 'NON_RENEWING_PURCHASE':
                    $expiryDate = isset($event['expiration_at_ms']) 
                        ? date('Y-m-d H:i:s', $event['expiration_at_ms'] / 1000) 
                        : null;
                    
                    $user->update([
                        'is_premium' => true,
                        'premium_until' => $expiryDate
                    ]);
                    Log::info("RevenueCat: User $userId premium activated/renewed until $expiryDate");
                    break;

                case 'EXPIRATION':
                case 'CANCELLATION':
                    // Note: CANCELLATION might theoretically mean auto-renew turned off, 
                    // but sometimes we might want to keep premium until actual expiry. 
                    // However, usually EXPIRATION is the definitive event for loss of access.
                    // If CANCELLATION means "refunded" or "revoked" immediately, then setting false is correct.
                    // For now keeping simple: if expired, remove premium.
                    if ($type === 'EXPIRATION') {
                        $user->update([
                            'is_premium' => false,
                            'premium_until' => null // or keep history
                        ]);
                        Log::info("RevenueCat: User $userId premium expired");
                    }
                    break;
                
                case 'TEST':
                    Log::info("RevenueCat: Test event received for User $userId");
                    break;

                default:
                    Log::info("RevenueCat: Unhandled event type $type for User $userId");
                    break;
            }
        } catch (\Exception $e) {
            Log::error("RevenueCat Webhook Error: " . $e->getMessage());
            return response()->json(['message' => 'Server Error'], 500);
        }

        return response()->json(['message' => 'OK']);
    }
}
