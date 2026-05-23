<?php

use App\Models\User;

test('legal pages are public', function () {
    $this->withoutVite();

    $this->get('/privacy-policy')->assertOk();
    $this->get('/terms-of-service')->assertOk();
});

test('admin integrations page requires authentication', function () {
    $this->get('/admin/integrations')->assertRedirect(route('login'));
});

test('authenticated users can visit admin integrations page', function () {
    $this->actingAs(User::factory()->create());
    $this->withoutVite();

    $this->get('/admin/integrations')->assertOk();
});

test('integrations overview reports unconfigured services when env is missing', function () {
    config([
        'services.revenuecat.secret_key' => null,
        'services.revenuecat.project_id' => null,
        'services.ga4.property_id' => null,
        'services.firebase.credentials' => null,
        'services.firebase.credentials_json' => null,
        'services.firebase.credentials_base64' => null,
    ]);

    $this->actingAs(User::factory()->create());

    $this->getJson('/admin/api/integrations/overview')
        ->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.revenuecat.configured', false)
        ->assertJsonPath('data.analytics.configured', false)
        ->assertJsonPath('data.gemini.configured', false);
});

test('revenuecat customer endpoint validates uid', function () {
    $this->actingAs(User::factory()->create());

    $this->getJson('/admin/api/integrations/revenuecat/customer')
        ->assertStatus(422)
        ->assertJsonValidationErrors('uid');
});
