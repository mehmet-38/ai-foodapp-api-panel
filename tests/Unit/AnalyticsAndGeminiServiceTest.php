<?php

use App\Services\Integrations\AnalyticsService;
use App\Services\Integrations\CloudMonitoringService;
use App\Services\Integrations\FirebaseUsageService;
use App\Services\Integrations\GeminiUsageService;
use App\Services\Integrations\GoogleAccessTokenService;
use Illuminate\Support\Facades\Http;

uses(Tests\TestCase::class);

test('analytics service normalizes ga4 report data', function () {
    config(['services.ga4.property_id' => '123456']);

    $google = Mockery::mock(GoogleAccessTokenService::class);
    $google->shouldReceive('isConfigured')->andReturnTrue();
    $google->shouldReceive('token')->twice()->andReturn('google-token');

    Http::fake([
        'analyticsdata.googleapis.com/v1beta/properties/123456:runReport' => Http::sequence()
            ->push([
                'rows' => [[
                    'metricValues' => [
                        ['value' => '12'],
                        ['value' => '345'],
                        ['value' => '67'],
                        ['value' => '8'],
                    ],
                ]],
            ])
            ->push([
                'rows' => [[
                    'dimensionValues' => [['value' => 'screen_view']],
                    'metricValues' => [['value' => '30']],
                ]],
            ]),
    ]);

    $result = (new AnalyticsService($google))->overview();

    expect($result['status'])->toBe('ok')
        ->and($result['summary']['active_users'])->toBe(12)
        ->and($result['top_events'][0]['name'])->toBe('screen_view');
});

test('analytics service reports permission errors without throwing', function () {
    config(['services.ga4.property_id' => '123456']);

    $google = Mockery::mock(GoogleAccessTokenService::class);
    $google->shouldReceive('isConfigured')->andReturnTrue();
    $google->shouldReceive('token')->once()->andReturn('google-token');

    Http::fake([
        'analyticsdata.googleapis.com/*' => Http::response(['error' => ['message' => 'Permission denied']], 403),
    ]);

    $result = (new AnalyticsService($google))->overview();

    expect($result['status'])->toBe('error')
        ->and($result['message'])->toContain('GA4 verisine erisim reddedildi');
});

test('gemini service reports token usage and estimated cost', function () {
    config([
        'services.gemini.project_id' => 'food-project',
        'services.gemini.input_token_price_per_1m' => 0.10,
        'services.gemini.output_token_price_per_1m' => 0.40,
    ]);

    $monitoring = Mockery::mock(CloudMonitoringService::class);
    $monitoring->shouldReceive('isConfigured')->andReturnTrue();
    $monitoring->shouldReceive('sum')->andReturnUsing(function (string $projectId, string $metricType) {
        return match ($metricType) {
            'generativelanguage.googleapis.com/generate_content_usage_input_token_count' => 1000000,
            'generativelanguage.googleapis.com/generate_content_usage_output_token_count' => 500000,
            'generativelanguage.googleapis.com/generate_content_usage_request_count' => 25,
            default => 0,
        };
    });
    $monitoring->shouldReceive('daily')->andReturn([]);
    $monitoring->shouldReceive('descriptors')->andReturn([
        ['type' => 'generativelanguage.googleapis.com/generate_content_usage_input_token_count'],
    ]);

    $result = (new GeminiUsageService($monitoring))->overview();

    expect($result['status'])->toBe('ok')
        ->and($result['summary']['input_tokens'])->toBe(1000000.0)
        ->and($result['summary']['output_tokens'])->toBe(500000.0)
        ->and($result['summary']['estimated_cost'])->toBe(0.3);
});

test('gemini service reports unavailable metrics without throwing', function () {
    config(['services.gemini.project_id' => 'food-project']);

    $monitoring = Mockery::mock(CloudMonitoringService::class);
    $monitoring->shouldReceive('isConfigured')->andReturnTrue();
    $monitoring->shouldReceive('sum')->andThrow(new RuntimeException('Unavailable'));

    $result = (new GeminiUsageService($monitoring))->overview();

    expect($result['status'])->toBe('error')
        ->and($result['metrics'])->toBe([]);
});

test('firebase usage service reports firestore and storage usage', function () {
    config(['services.firebase.project_id' => 'food-project']);

    $monitoring = Mockery::mock(CloudMonitoringService::class);
    $monitoring->shouldReceive('isConfigured')->andReturnTrue();
    $monitoring->shouldReceive('sum')->andReturnUsing(function (string $projectId, string $metricType) {
        return match ($metricType) {
            'firestore.googleapis.com/document/read_ops_count' => 120,
            'firestore.googleapis.com/document/write_ops_count' => 30,
            'firestore.googleapis.com/document/delete_ops_count' => 4,
            'storage.googleapis.com/network/sent_bytes_count' => 2048,
            'storage.googleapis.com/api/request_count' => 9,
            default => 0,
        };
    });
    $monitoring->shouldReceive('latest')->andReturnUsing(function (string $projectId, string $metricType) {
        return match ($metricType) {
            'firestore.googleapis.com/storage/data_and_index_storage_bytes' => 4096,
            'storage.googleapis.com/storage/total_bytes' => 8192,
            default => 0,
        };
    });
    $monitoring->shouldReceive('daily')->andReturn([]);

    $result = (new FirebaseUsageService($monitoring))->overview();

    expect($result['status'])->toBe('ok')
        ->and($result['summary']['firestore_reads'])->toBe(120.0)
        ->and($result['summary']['storage_total_bytes'])->toBe(8192.0);
});
