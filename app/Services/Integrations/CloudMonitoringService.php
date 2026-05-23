<?php

namespace App\Services\Integrations;

use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;

class CloudMonitoringService
{
    public function __construct(private readonly GoogleAccessTokenService $google)
    {
    }

    public function isConfigured(): bool
    {
        return $this->google->isConfigured();
    }

    public function sum(string $projectId, string $metricType, int $days = 30, array $extraFilters = []): float
    {
        return collect($this->series($projectId, $metricType, $days, 'ALIGN_SUM', 'REDUCE_SUM', $extraFilters))
            ->flatMap(fn (array $series) => $series['points'] ?? [])
            ->sum(fn (array $point) => $this->pointValue($point));
    }

    public function latest(string $projectId, string $metricType, int $days = 30, array $extraFilters = []): float
    {
        $points = collect($this->series($projectId, $metricType, $days, 'ALIGN_MEAN', 'REDUCE_MEAN', $extraFilters))
            ->flatMap(fn (array $series) => $series['points'] ?? [])
            ->sortByDesc(fn (array $point) => data_get($point, 'interval.endTime'))
            ->values();

        return $points->isEmpty() ? 0.0 : $this->pointValue($points->first());
    }

    public function daily(string $projectId, string $metricType, int $days = 30, array $extraFilters = []): array
    {
        $rows = [];

        foreach ($this->series($projectId, $metricType, $days, 'ALIGN_SUM', 'REDUCE_SUM', $extraFilters) as $series) {
            foreach ($series['points'] ?? [] as $point) {
                $date = Carbon::parse((string) data_get($point, 'interval.endTime'))->toDateString();
                $rows[$date] = ($rows[$date] ?? 0) + $this->pointValue($point);
            }
        }

        ksort($rows);

        return collect($rows)
            ->map(fn (float $value, string $date) => ['date' => $date, 'value' => $value])
            ->values()
            ->all();
    }

    public function descriptors(string $projectId, string $prefix): array
    {
        $response = $this->client()
            ->get("https://monitoring.googleapis.com/v3/projects/{$projectId}/metricDescriptors", [
                'filter' => 'metric.type = starts_with("'.$prefix.'")',
                'pageSize' => 100,
            ])
            ->throw()
            ->json();

        return collect($response['metricDescriptors'] ?? [])
            ->map(fn (array $descriptor) => [
                'type' => $descriptor['type'] ?? '',
                'display_name' => $descriptor['displayName'] ?? '',
                'metric_kind' => $descriptor['metricKind'] ?? '',
                'value_type' => $descriptor['valueType'] ?? '',
            ])
            ->filter(fn (array $descriptor) => $descriptor['type'] !== '')
            ->values()
            ->all();
    }

    private function series(
        string $projectId,
        string $metricType,
        int $days,
        string $aligner,
        string $reducer,
        array $extraFilters = [],
    ): array {
        $filter = collect([
            'metric.type = "'.$metricType.'"',
            ...$extraFilters,
        ])->implode(' AND ');

        $response = $this->client()
            ->get("https://monitoring.googleapis.com/v3/projects/{$projectId}/timeSeries", [
                'filter' => $filter,
                'interval.startTime' => now()->subDays($days)->toRfc3339String(),
                'interval.endTime' => now()->toRfc3339String(),
                'aggregation.alignmentPeriod' => '86400s',
                'aggregation.perSeriesAligner' => $aligner,
                'aggregation.crossSeriesReducer' => $reducer,
                'view' => 'FULL',
            ])
            ->throw()
            ->json();

        return $response['timeSeries'] ?? [];
    }

    private function client()
    {
        return Http::withToken($this->google->token(['https://www.googleapis.com/auth/cloud-platform']))
            ->withOptions(['proxy' => ''])
            ->acceptJson()
            ->timeout(20);
    }

    private function pointValue(array $point): float
    {
        $value = $point['value'] ?? [];

        foreach (['int64Value', 'doubleValue'] as $key) {
            if (isset($value[$key]) && is_numeric($value[$key])) {
                return (float) $value[$key];
            }
        }

        if (isset($value['distributionValue']['count'])) {
            return (float) $value['distributionValue']['count'];
        }

        return 0.0;
    }
}
