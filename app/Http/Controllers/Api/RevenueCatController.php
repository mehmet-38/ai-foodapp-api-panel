<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Firebase\FirebaseService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Kreait\Firebase\Exception\Auth\UserNotFound;

class RevenueCatController extends Controller
{
    public function __construct(private readonly FirebaseService $firebase)
    {
    }

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
             $this->safeLog('warning', 'RevenueCat Webhook: No app_user_id found in event', $event);
             return response()->json(['message' => 'UserId missing'], 200); // Return 200 to acknowledge receipt
        }

        try {
            $user = $this->firebase->getUser($userId);
        } catch (UserNotFound) {
            $user = null;
        }

        if (! $user) {
             $this->safeLog('warning', "RevenueCat Webhook: User not found with ID: $userId");
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
                    
                    $this->firebase->updateUser($userId, [
                        'is_premium' => true,
                        'premium_until' => $expiryDate
                    ]);
                    $this->safeLog('info', "RevenueCat: User $userId premium activated/renewed until $expiryDate");
                    break;

                case 'EXPIRATION':
                case 'CANCELLATION':
                    // Note: CANCELLATION might theoretically mean auto-renew turned off, 
                    // but sometimes we might want to keep premium until actual expiry. 
                    // However, usually EXPIRATION is the definitive event for loss of access.
                    // If CANCELLATION means "refunded" or "revoked" immediately, then setting false is correct.
                    // For now keeping simple: if expired, remove premium.
                    if ($type === 'EXPIRATION') {
                        $this->firebase->updateUser($userId, [
                            'is_premium' => false,
                            'premium_until' => null // or keep history
                        ]);
                        $this->safeLog('info', "RevenueCat: User $userId premium expired");
                    }
                    break;
                
                case 'TEST':
                    $this->safeLog('info', "RevenueCat: Test event received for User $userId");
                    break;

                default:
                    $this->safeLog('info', "RevenueCat: Unhandled event type $type for User $userId");
                    break;
            }
        } catch (\Exception $e) {
            $this->safeLog('error', "RevenueCat Webhook Error: " . $e->getMessage());
            return response()->json(['message' => 'Server Error'], 500);
        }

        return response()->json(['message' => 'OK']);
    }

    private function safeLog(string $level, string $message, array $context = []): void
    {
        try {
            Log::{$level}($message, $context);
        } catch (\Throwable) {
            // Logging must not break webhook acknowledgement.
        }
    }
}
