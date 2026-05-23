<?php

namespace App\Services\Integrations;

use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use Throwable;

class AnalyticsService
{
    public function __construct(private readonly GoogleAccessTokenService $google)
    {
    }

    public function overview(): array
    {
        if ($this->propertyId() === '' || ! $this->google->isConfigured()) {
            return [
                'configured' => false,
                'status' => 'unconfigured',
                'message' => 'GA4_PROPERTY_ID veya Firebase service account credentials tanimli degil.',
                'summary' => [],
                'top_events' => [],
            ];
        }

        try {
            $summary = $this->runReport([
                'dateRanges' => [['startDate' => '30daysAgo', 'endDate' => 'today']],
                'metrics' => [
                    ['name' => 'activeUsers'],
                    ['name' => 'eventCount'],
                    ['name' => 'screenPageViews'],
                    ['name' => 'newUsers'],
                ],
            ]);

            $topEvents = $this->runReport([
                'dateRanges' => [['startDate' => '7daysAgo', 'endDate' => 'today']],
                'dimensions' => [['name' => 'eventName']],
                'metrics' => [['name' => 'eventCount']],
                'orderBys' => [['metric' => ['metricName' => 'eventCount'], 'desc' => true]],
                'limit' => 8,
            ]);

            return [
                'configured' => true,
                'status' => 'ok',
                'summary' => $this->summary($summary),
                'top_events' => $this->rows($topEvents),
                'updated_at' => now()->toIso8601String(),
            ];
        } catch (RequestException $e) {
            return [
                'configured' => true,
                'status' => 'error',
                'message' => $this->friendlyError($e),
                'summary' => [],
                'top_events' => [],
            ];
        } catch (Throwable $e) {
            return [
                'configured' => true,
                'status' => 'error',
                'message' => $e->getMessage(),
                'summary' => [],
                'top_events' => [],
            ];
        }
    }

    private function runReport(array $body): array
    {
        return Http::withToken($this->google->token(['https://www.googleapis.com/auth/analytics.readonly']))
            ->withOptions(['proxy' => ''])
            ->acceptJson()
            ->asJson()
            ->timeout(20)
            ->post("https://analyticsdata.googleapis.com/v1beta/properties/{$this->propertyId()}:runReport", $body)
            ->throw()
            ->json() ?? [];
    }

    private function summary(array $payload): array
    {
        $values = data_get($payload, 'rows.0.metricValues', []);

        return [
            'active_users' => (int) data_get($values, '0.value', 0),
            'event_count' => (int) data_get($values, '1.value', 0),
            'screen_page_views' => (int) data_get($values, '2.value', 0),
            'new_users' => (int) data_get($values, '3.value', 0),
        ];
    }

    private function rows(array $payload): array
    {
        return collect($payload['rows'] ?? [])
            ->map(fn (array $row) => [
                'name' => data_get($row, 'dimensionValues.0.value', '-'),
                'count' => (int) data_get($row, 'metricValues.0.value', 0),
            ])
            ->values()
            ->all();
    }

    private function propertyId(): string
    {
        return (string) config('services.ga4.property_id', '');
    }

    private function friendlyError(RequestException $e): string
    {
        $status = $e->response->status();
        $payload = $e->response->json();
        $message = (string) (data_get($payload, 'error.message') ?: $e->getMessage());

        if ($status === 403 && str_contains($message, 'Google Analytics Data API has not been used')) {
            return 'Google Analytics Data API bu Google Cloud projesinde henuz aktif degil. Google Cloud Console > APIs & Services > Library ekranindan "Google Analytics Data API" servisini etkinlestirin, birkac dakika bekleyip tekrar deneyin.';
        }

        if ($status === 403) {
            return 'GA4 verisine erisim reddedildi. Firebase service account e-postasini Google Analytics property uzerinde Viewer/Analyst yetkisiyle ekleyin ve GA4_PROPERTY_ID degerinin dogru property oldugunu kontrol edin.';
        }

        return "GA4 API istegi basarisiz oldu. HTTP {$status}: {$message}";
    }
}
