<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;
use App\Models\User;

class RevenueCatWebhookTest extends TestCase
{
    use RefreshDatabase; // Resets DB for each test

    public function test_webhook_blocks_unauthorized_requests()
    {
        $response = $this->postJson('/api/revenuecat/webhook', [
            'event' => ['type' => 'TEST']
        ]);

        $response->assertStatus(403);
    }

    public function test_webhook_activates_premium_on_initial_purchase()
    {
        $user = User::factory()->create([
            'is_premium' => false
        ]);

        $secret = env('REVENUECAT_WEBHOOK_SECRET', 'default_secret_please_change');

        $response = $this->postJson('/api/revenuecat/webhook', [
            'event' => [
                'type' => 'INITIAL_PURCHASE',
                'app_user_id' => $user->id,
                'expiration_at_ms' => 1735689600000 // Future date
            ]
        ], ['Authorization' => $secret]);

        $response->assertStatus(200);

        $user->refresh();
        $this->assertTrue((bool)$user->is_premium);
        $this->assertNotNull($user->premium_until);
    }

    public function test_webhook_deactivates_premium_on_expiration()
    {
        $user = User::factory()->create([
            'is_premium' => true
        ]);

        $secret = env('REVENUECAT_WEBHOOK_SECRET', 'default_secret_please_change');

        $response = $this->postJson('/api/revenuecat/webhook', [
            'event' => [
                'type' => 'EXPIRATION',
                'app_user_id' => $user->id
            ]
        ], ['Authorization' => $secret]);

        $response->assertStatus(200);

        $user->refresh();
        $this->assertFalse((bool)$user->is_premium);
    }
}
