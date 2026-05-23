<?php

namespace App\Services\Integrations;

use Throwable;

class GeminiUsageService
{
    public function __construct(private readonly CloudMonitoringService $monitoring)
    {
    }

    public function overview(): array
    {
        if ($this->projectId() === '' || ! $this->monitoring->isConfigured()) {
            return [
                'configured' => false,
                'status' => 'unconfigured',
                'message' => 'GEMINI_GCP_PROJECT_ID/FIREBASE_PROJECT_ID veya Firebase service account credentials tanimli degil.',
                'summary' => [],
                'metrics' => [],
            ];
        }

        try {
            $inputTokens = $this->sumFirstAvailable([
                'generativelanguage.googleapis.com/generate_content_usage_input_token_count',
                'generativelanguage.googleapis.com/generate_content_input_token_count',
            ]);
            $outputTokens = $this->sumFirstAvailable([
                'generativelanguage.googleapis.com/generate_content_usage_output_token_count',
                'generativelanguage.googleapis.com/generate_content_output_token_count',
            ]);
            $requestCount = $this->sumFirstAvailable([
                'generativelanguage.googleapis.com/generate_content_usage_request_count',
                'generativelanguage.googleapis.com/generate_content_request_count',
                'serviceruntime.googleapis.com/api/request_count',
            ], [
                'serviceruntime.googleapis.com/api/request_count' => ['metric.labels.service = "generativelanguage.googleapis.com"'],
            ]);
            $metrics = $this->monitoring->descriptors($this->projectId(), 'generativelanguage.googleapis.com/');

            return [
                'configured' => true,
                'status' => 'ok',
                'summary' => [
                    'project_id' => $this->projectId(),
                    'input_tokens' => $inputTokens,
                    'output_tokens' => $outputTokens,
                    'total_tokens' => $inputTokens + $outputTokens,
                    'request_count' => $requestCount,
                    'estimated_cost' => $this->estimatedCost($inputTokens, $outputTokens),
                    'input_price_per_1m' => $this->inputPrice(),
                    'output_price_per_1m' => $this->outputPrice(),
                    'available_metrics' => count($metrics),
                ],
                'daily' => [
                    'input_tokens' => $this->dailyFirstAvailable([
                        'generativelanguage.googleapis.com/generate_content_usage_input_token_count',
                        'generativelanguage.googleapis.com/generate_content_input_token_count',
                    ]),
                    'output_tokens' => $this->dailyFirstAvailable([
                        'generativelanguage.googleapis.com/generate_content_usage_output_token_count',
                        'generativelanguage.googleapis.com/generate_content_output_token_count',
                    ]),
                ],
                'metrics' => $metrics,
                'updated_at' => now()->toIso8601String(),
            ];
        } catch (Throwable $e) {
            return [
                'configured' => true,
                'status' => 'error',
                'message' => $e->getMessage(),
                'summary' => ['project_id' => $this->projectId()],
                'metrics' => [],
            ];
        }
    }

    private function sumFirstAvailable(array $metricTypes, array $extraFiltersByMetric = []): float
    {
        foreach ($metricTypes as $metricType) {
            try {
                $value = $this->monitoring->sum($this->projectId(), $metricType, 30, $extraFiltersByMetric[$metricType] ?? []);
                if ($value > 0) {
                    return $value;
                }
            } catch (Throwable) {
                continue;
            }
        }

        return 0.0;
    }

    private function dailyFirstAvailable(array $metricTypes): array
    {
        foreach ($metricTypes as $metricType) {
            try {
                $rows = $this->monitoring->daily($this->projectId(), $metricType);
                if ($rows !== []) {
                    return $rows;
                }
            } catch (Throwable) {
                continue;
            }
        }

        return [];
    }

    private function estimatedCost(float $inputTokens, float $outputTokens): ?float
    {
        if ($this->inputPrice() <= 0 && $this->outputPrice() <= 0) {
            return null;
        }

        return round(($inputTokens / 1_000_000 * $this->inputPrice()) + ($outputTokens / 1_000_000 * $this->outputPrice()), 6);
    }

    private function inputPrice(): float
    {
        return (float) config('services.gemini.input_token_price_per_1m', 0);
    }

    private function outputPrice(): float
    {
        return (float) config('services.gemini.output_token_price_per_1m', 0);
    }

    private function projectId(): string
    {
        return (string) config('services.gemini.project_id', config('services.firebase.project_id', ''));
    }
}
