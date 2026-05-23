<?php

namespace App\Services\Integrations;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class GoogleAccessTokenService
{
    private ?array $credentials;

    public function __construct()
    {
        $this->credentials = $this->loadCredentials();
    }

    public function isConfigured(): bool
    {
        return $this->credentials !== null;
    }

    public function token(array $scopes): string
    {
        if (! $this->credentials) {
            throw new RuntimeException('Google service account credentials are not configured.');
        }

        sort($scopes);
        $cacheKey = 'google_access_token_'.md5(($this->credentials['client_email'] ?? '').implode(' ', $scopes));

        return Cache::remember($cacheKey, 3300, function () use ($scopes) {
            $now = time();
            $header = $this->base64Url(json_encode(['alg' => 'RS256', 'typ' => 'JWT']) ?: '');
            $claim = $this->base64Url(json_encode([
                'iss' => $this->credentials['client_email'],
                'scope' => implode(' ', $scopes),
                'aud' => 'https://oauth2.googleapis.com/token',
                'iat' => $now,
                'exp' => $now + 3600,
            ]) ?: '');

            $unsigned = "{$header}.{$claim}";
            openssl_sign($unsigned, $signature, $this->credentials['private_key'], OPENSSL_ALGO_SHA256);

            $response = Http::asForm()
                ->withOptions(['proxy' => ''])
                ->post('https://oauth2.googleapis.com/token', [
                    'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                    'assertion' => "{$unsigned}.".$this->base64Url($signature),
                ])
                ->throw()
                ->json();

            return $response['access_token'];
        });
    }

    private function loadCredentials(): ?array
    {
        $json = config('services.firebase.credentials_json');
        if (is_string($json) && trim($json) !== '') {
            $credentials = json_decode($json, true);

            if (is_array($credentials)) {
                return $credentials;
            }
        }

        $base64 = config('services.firebase.credentials_base64');
        if (is_string($base64) && trim($base64) !== '') {
            $decoded = base64_decode($base64, true);
            $credentials = $decoded ? json_decode($decoded, true) : null;

            if (is_array($credentials)) {
                return $credentials;
            }
        }

        $path = $this->resolveCredentialsPath(config('services.firebase.credentials'));

        if (! $path || ! is_file($path)) {
            return null;
        }

        $credentials = json_decode((string) file_get_contents($path), true);

        return is_array($credentials) ? $credentials : null;
    }

    private function resolveCredentialsPath(?string $path): ?string
    {
        if (! $path) {
            return null;
        }

        $path = str_replace(['${APP_BASE_PATH}', '{APP_BASE_PATH}'], base_path(), $path);

        if (! preg_match('/^[A-Za-z]:[\/\\\\]/', $path) && ! str_starts_with($path, '/')) {
            $path = base_path($path);
        }

        return $path;
    }

    private function base64Url(string $value): string
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }
}
