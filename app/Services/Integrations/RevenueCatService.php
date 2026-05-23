<?php

namespace App\Services\Integrations;

use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;
use Throwable;

class RevenueCatService
{
    private string $baseUrl = 'https://api.revenuecat.com';

    public function isConfigured(): bool
    {
        return $this->secretKey() !== '' && $this->projectId() !== '';
    }

    public function overview(): array
    {
        if (! $this->isConfigured()) {
            return $this->unconfigured('REVENUECAT_SECRET_KEY ve REVENUECAT_PROJECT_ID tanimli degil.');
        }

        try {
            $response = $this->client()
                ->get("/v2/projects/{$this->projectId()}/metrics/overview", [
                    'start_date' => now()->subDays(30)->toDateString(),
                    'end_date' => now()->toDateString(),
                    'environment' => $this->environment(),
                ]);

            if (! $response->successful()) {
                return $this->failed($this->messageFromResponse($response->status(), $response->json()));
            }

            $payload = $response->json() ?? [];

            return [
                'configured' => true,
                'status' => 'ok',
                'summary' => [
                    'revenue' => $this->firstNumber($payload, ['revenue', 'total_revenue', 'total_revenue_in_usd', 'metrics.revenue.value']),
                    'active_subscribers' => $this->firstNumber($payload, ['active_subscribers', 'active_subscriptions', 'metrics.active_subscribers.value']),
                    'mrr' => $this->firstNumber($payload, ['mrr', 'monthly_recurring_revenue', 'metrics.mrr.value']),
                    'trial_count' => $this->firstNumber($payload, ['trials', 'trial_count', 'metrics.trials.value']),
                ],
                'raw' => $payload,
                'updated_at' => now()->toIso8601String(),
            ];
        } catch (Throwable $e) {
            return $this->failed($e->getMessage());
        }
    }

    public function customer(string $uid): array
    {
        if (! $this->isConfigured()) {
            return $this->unconfigured('REVENUECAT_SECRET_KEY ve REVENUECAT_PROJECT_ID tanimli degil.');
        }

        try {
            $customerId = rawurlencode($uid);
            $customer = $this->client()->get("/v2/projects/{$this->projectId()}/customers/{$customerId}");

            if ($customer->status() === 404) {
                return [
                    'configured' => true,
                    'status' => 'not_found',
                    'message' => 'RevenueCat musterisi bulunamadi.',
                    'customer' => null,
                    'active_entitlements' => [],
                    'subscriptions' => [],
                ];
            }

            if (! $customer->successful()) {
                return $this->failed($this->messageFromResponse($customer->status(), $customer->json()));
            }

            $entitlements = $this->client()->get("/v2/projects/{$this->projectId()}/customers/{$customerId}/active_entitlements", [
                'limit' => 20,
            ]);
            $subscriptions = $this->client()->get("/v2/projects/{$this->projectId()}/customers/{$customerId}/subscriptions", [
                'environment' => $this->environment(),
                'limit' => 20,
            ]);

            return [
                'configured' => true,
                'status' => 'ok',
                'customer' => $customer->json(),
                'active_entitlements' => $this->items($entitlements->json()),
                'subscriptions' => collect($this->items($subscriptions->json()))
                    ->map(fn (array $subscription) => $this->normalizeSubscription($subscription))
                    ->values()
                    ->all(),
                'errors' => array_values(array_filter([
                    $entitlements->successful() ? null : $this->messageFromResponse($entitlements->status(), $entitlements->json()),
                    $subscriptions->successful() ? null : $this->messageFromResponse($subscriptions->status(), $subscriptions->json()),
                ])),
            ];
        } catch (RequestException $e) {
            return $this->failed($e->getMessage());
        } catch (Throwable $e) {
            return $this->failed($e->getMessage());
        }
    }

    private function client()
    {
        return Http::baseUrl($this->baseUrl)
            ->withToken($this->secretKey())
            ->acceptJson()
            ->timeout(20)
            ->retry(1, 250);
    }

    private function secretKey(): string
    {
        return (string) config('services.revenuecat.secret_key', '');
    }

    private function projectId(): string
    {
        return (string) config('services.revenuecat.project_id', '');
    }

    private function environment(): string
    {
        return (string) config('services.revenuecat.environment', 'production');
    }

    private function items(?array $payload): array
    {
        return $payload['items'] ?? [];
    }

    private function normalizeSubscription(array $subscription): array
    {
        foreach (['starts_at', 'current_period_starts_at', 'current_period_ends_at', 'ends_at'] as $field) {
            if (isset($subscription[$field]) && is_numeric($subscription[$field])) {
                $subscription[$field.'_formatted'] = Carbon::createFromTimestampMs((int) $subscription[$field])->toDateTimeString();
            }
        }

        return $subscription;
    }

    private function firstNumber(array $payload, array $keys): int|float|null
    {
        foreach ($keys as $key) {
            $value = data_get($payload, $key);
            if (is_numeric($value)) {
                return $value + 0;
            }
        }

        return null;
    }

    private function unconfigured(string $message): array
    {
        return [
            'configured' => false,
            'status' => 'unconfigured',
            'message' => $message,
            'summary' => [],
        ];
    }

    private function failed(string $message): array
    {
        return [
            'configured' => true,
            'status' => 'error',
            'message' => $message,
            'summary' => [],
        ];
    }

    private function messageFromResponse(int $status, ?array $payload): string
    {
        $message = data_get($payload, 'message') ?? data_get($payload, 'error') ?? 'RevenueCat API istegi basarisiz oldu.';

        return "HTTP {$status}: {$message}";
    }
}
