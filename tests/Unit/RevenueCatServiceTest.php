<?php

use App\Services\Integrations\RevenueCatService;
use Illuminate\Support\Facades\Http;

uses(Tests\TestCase::class);

test('revenuecat overview normalizes successful response', function () {
    config([
        'services.revenuecat.secret_key' => 'sk_test',
        'services.revenuecat.project_id' => 'proj_test',
        'services.revenuecat.environment' => 'production',
    ]);

    Http::fake([
        'api.revenuecat.com/v2/projects/proj_test/metrics/overview*' => Http::response([
            'revenue' => 42.5,
            'active_subscribers' => 7,
            'mrr' => 19.99,
            'trials' => 2,
        ]),
    ]);

    $result = app(RevenueCatService::class)->overview();

    expect($result['status'])->toBe('ok')
        ->and($result['summary']['revenue'])->toBe(42.5)
        ->and($result['summary']['active_subscribers'])->toBe(7);
});

test('revenuecat overview reports authorization errors', function () {
    config([
        'services.revenuecat.secret_key' => 'sk_bad',
        'services.revenuecat.project_id' => 'proj_test',
    ]);

    Http::fake([
        'api.revenuecat.com/*' => Http::response(['message' => 'Unauthorized'], 401),
    ]);

    $result = app(RevenueCatService::class)->overview();

    expect($result['status'])->toBe('error')
        ->and($result['message'])->toContain('HTTP 401');
});

test('revenuecat customer handles not found response', function () {
    config([
        'services.revenuecat.secret_key' => 'sk_test',
        'services.revenuecat.project_id' => 'proj_test',
    ]);

    Http::fake([
        'api.revenuecat.com/v2/projects/proj_test/customers/missing-user' => Http::response([], 404),
    ]);

    $result = app(RevenueCatService::class)->customer('missing-user');

    expect($result['status'])->toBe('not_found')
        ->and($result['customer'])->toBeNull();
});
