<?php

namespace App\Services\Integrations;

use Throwable;

class FirebaseUsageService
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
                'message' => 'FIREBASE_PROJECT_ID veya Firebase service account credentials tanimli degil.',
                'summary' => [],
                'daily' => [],
            ];
        }

        try {
            $reads = $this->sumFirstAvailable([
                'firestore.googleapis.com/document/read_ops_count',
                'firestore.googleapis.com/document/read_count',
            ]);
            $writes = $this->sumFirstAvailable([
                'firestore.googleapis.com/document/write_ops_count',
                'firestore.googleapis.com/document/write_count',
            ]);
            $deletes = $this->sumFirstAvailable([
                'firestore.googleapis.com/document/delete_ops_count',
                'firestore.googleapis.com/document/delete_count',
            ]);

            return [
                'configured' => true,
                'status' => 'ok',
                'summary' => [
                    'project_id' => $this->projectId(),
                    'firestore_reads' => $reads,
                    'firestore_writes' => $writes,
                    'firestore_deletes' => $deletes,
                    'firestore_storage_bytes' => $this->latestFirstAvailable([
                        'firestore.googleapis.com/storage/data_and_index_storage_bytes',
                    ]),
                    'storage_total_bytes' => $this->latestFirstAvailable([
                        'storage.googleapis.com/storage/total_bytes',
                    ]),
                    'storage_sent_bytes' => $this->sumFirstAvailable([
                        'storage.googleapis.com/network/sent_bytes_count',
                    ]),
                    'storage_request_count' => $this->sumFirstAvailable([
                        'storage.googleapis.com/api/request_count',
                    ]),
                    'storage_rules_evaluations' => $this->sumFirstAvailable([
                        'firebasestorage.googleapis.com/rules/evaluation_count',
                    ]),
                ],
                'daily' => [
                    'firestore_reads' => $this->dailyFirstAvailable([
                        'firestore.googleapis.com/document/read_ops_count',
                        'firestore.googleapis.com/document/read_count',
                    ]),
                    'firestore_writes' => $this->dailyFirstAvailable([
                        'firestore.googleapis.com/document/write_ops_count',
                        'firestore.googleapis.com/document/write_count',
                    ]),
                    'firestore_deletes' => $this->dailyFirstAvailable([
                        'firestore.googleapis.com/document/delete_ops_count',
                        'firestore.googleapis.com/document/delete_count',
                    ]),
                ],
                'updated_at' => now()->toIso8601String(),
            ];
        } catch (Throwable $e) {
            return [
                'configured' => true,
                'status' => 'error',
                'message' => $this->friendlyError($e->getMessage()),
                'summary' => ['project_id' => $this->projectId()],
                'daily' => [],
            ];
        }
    }

    private function sumFirstAvailable(array $metricTypes): float
    {
        foreach ($metricTypes as $metricType) {
            try {
                $value = $this->monitoring->sum($this->projectId(), $metricType);
                if ($value > 0) {
                    return $value;
                }
            } catch (Throwable) {
                continue;
            }
        }

        return 0.0;
    }

    private function latestFirstAvailable(array $metricTypes): float
    {
        foreach ($metricTypes as $metricType) {
            try {
                $value = $this->monitoring->latest($this->projectId(), $metricType);
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

    private function friendlyError(string $message): string
    {
        if (str_contains($message, 'Permission') || str_contains($message, '403')) {
            return 'Firebase/GCP kullanim metrikleri okunamadi. Service account icin Cloud Monitoring Viewer yetkisi verin ve Cloud Monitoring API aktif oldugunu kontrol edin.';
        }

        return $message;
    }

    private function projectId(): string
    {
        return (string) config('services.firebase.project_id', '');
    }
}
