<?php

namespace Tests\Feature;

use App\Services\Firebase\FirebaseService;
use Mockery;
use Tests\TestCase;

class RevenueCatWebhookTest extends TestCase
{
    public function test_webhook_blocks_unauthorized_requests()
    {
        $response = $this->postJson('/api/revenuecat/webhook', [
            'event' => ['type' => 'TEST']
        ]);

        $response->assertStatus(403);
    }

    public function test_webhook_activates_premium_on_initial_purchase()
    {
        $userId = 'firebase-user-123';

        $secret = env('REVENUECAT_WEBHOOK_SECRET', 'default_secret_please_change');
        $this->mock(FirebaseService::class, function ($mock) use ($userId) {
            $mock->shouldReceive('getUser')
                ->once()
                ->with($userId)
                ->andReturn(['uid' => $userId, 'isPremium' => false]);

            $mock->shouldReceive('updateUser')
                ->once()
                ->with($userId, Mockery::on(fn (array $data) => $data === [
                    'is_premium' => true,
                    'premium_until' => '2025-01-01 00:00:00',
                ]))
                ->andReturn(['uid' => $userId, 'isPremium' => true]);
        });

        $response = $this->postJson('/api/revenuecat/webhook', [
            'event' => [
                'type' => 'INITIAL_PURCHASE',
                'app_user_id' => $userId,
                'expiration_at_ms' => 1735689600000,
            ]
        ], ['Authorization' => $secret]);

        $response->assertStatus(200);
    }

    public function test_webhook_deactivates_premium_on_expiration()
    {
        $userId = 'firebase-user-123';

        $secret = env('REVENUECAT_WEBHOOK_SECRET', 'default_secret_please_change');
        $this->mock(FirebaseService::class, function ($mock) use ($userId) {
            $mock->shouldReceive('getUser')
                ->once()
                ->with($userId)
                ->andReturn(['uid' => $userId, 'isPremium' => true]);

            $mock->shouldReceive('updateUser')
                ->once()
                ->with($userId, [
                    'is_premium' => false,
                    'premium_until' => null,
                ])
                ->andReturn(['uid' => $userId, 'isPremium' => false]);
        });

        $response = $this->postJson('/api/revenuecat/webhook', [
            'event' => [
                'type' => 'EXPIRATION',
                'app_user_id' => $userId
            ]
        ], ['Authorization' => $secret]);

        $response->assertStatus(200);
    }
}
