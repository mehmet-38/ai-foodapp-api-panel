<?php

namespace App\Services\Firebase;

use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Google\Auth\Credentials\ServiceAccountCredentials;
use Google\Cloud\Firestore\FirestoreClient;
use Kreait\Firebase\Contract\Auth;
use Kreait\Firebase\Factory;
use Kreait\Firebase\Auth\UserRecord;
use Kreait\Firebase\Http\HttpClientOptions;
use RuntimeException;

class FirebaseService
{
    private string $projectId;

    private ?array $credentials;

    private ?Auth $auth = null;

    private ?FirestoreClient $database = null;

    public function __construct()
    {
        $this->projectId = (string) config('services.firebase.project_id');
        $this->credentials = $this->loadCredentials();

        if ($this->isConfigured()) {
            $this->disableProxyEnvironment();

            $httpOptions = HttpClientOptions::default()->withGuzzleConfigOptions([
                'proxy' => '',
                'connect_timeout' => 10,
                'timeout' => 30,
            ]);

            $factory = (new Factory)
                ->withServiceAccount($this->credentials)
                ->withProjectId($this->projectId)
                ->withHttpClientOptions($httpOptions);

            $this->auth = $factory->createAuth();
            $this->database = new FirestoreClient([
                'projectId' => $this->projectId,
                'credentials' => new ServiceAccountCredentials(
                    [FirestoreClient::FULL_CONTROL_SCOPE],
                    $this->credentials
                ),
                'transport' => 'rest',
            ]);
        }
    }

    public function isConfigured(): bool
    {
        return $this->projectId !== '' && $this->credentials !== null;
    }

    public function dashboardStats(): array
    {
        $users = $this->listUsers(1000);
        $recipes = $this->listCollection('recipes', 1000, 'createdAt');
        $posts = $this->listCollection('posts', 1000, 'createdAt');

        $today = now()->toDateString();

        return [
            'totalUsers' => count($users),
            'totalRecipes' => count($recipes),
            'totalPosts' => count($posts),
            'todayUsers' => $this->countCreatedToday($users, $today),
            'todayRecipes' => $this->countCreatedToday($recipes, $today),
            'todayPosts' => $this->countCreatedToday($posts, $today),
        ];
    }

    public function listUsers(int $maxResults = 1000): array
    {
        if (! $this->isConfigured()) {
            return [];
        }

        $authUsers = collect(iterator_to_array($this->auth()->listUsers($maxResults, min($maxResults, 1000))))
            ->mapWithKeys(function (UserRecord $user) {
                return [$user->uid => $user];
        });

        $profiles = collect($this->listCollection('users', $maxResults))->mapWithKeys(function (array $profile) {
            return [$profile['id'] => $profile];
        });

        return $authUsers->map(function (UserRecord $authUser, string $uid) use ($profiles) {
            $profile = $profiles->get($uid, []);

            return $this->normalizeUser($uid, $authUser, $profile);
        })->values()->sortByDesc('created_at')->values()->all();
    }

    public function getUser(string $uid): ?array
    {
        if (! $this->isConfigured()) {
            return null;
        }

        $authUser = $this->auth()->getUser($uid);

        $profile = $this->getDocument('users', $uid) ?? [];

        return $this->normalizeUser($uid, $authUser, $profile);
    }

    public function createUser(array $data): array
    {
        $authPayload = [
            'email' => $data['email'],
            'password' => $data['password'],
            'displayName' => $data['username'] ?? $data['name'] ?? $data['email'],
            'emailVerified' => false,
        ];

        $created = $this->auth()->createUser($authPayload);

        $uid = $created->uid;
        $profile = $this->userProfilePayload($data, $created);
        $profile['createdAt'] = now()->toIso8601String();

        $this->setDocument('users', $uid, $profile);

        return $this->getUser($uid) ?? ['id' => $uid, ...$profile];
    }

    public function updateUser(string $uid, array $data): array
    {
        $authPayload = [];

        if (array_key_exists('email', $data)) {
            $authPayload['email'] = $data['email'];
        }

        if (array_key_exists('username', $data) || array_key_exists('name', $data)) {
            $authPayload['displayName'] = $data['username'] ?? $data['name'];
        }

        if (! empty($data['password'])) {
            $authPayload['password'] = $data['password'];
        }

        if ($authPayload !== []) {
            $this->auth()->updateUser($uid, $authPayload);
        }

        $profile = $this->userProfilePayload($data);
        unset($profile['createdAt']);

        if ($profile !== []) {
            $this->setDocument('users', $uid, $profile, true);
        }

        return $this->getUser($uid) ?? ['id' => $uid, ...$profile];
    }

    public function deleteUser(string $uid): void
    {
        $this->auth()->deleteUser($uid);

        $this->deleteDocument('users', $uid);
    }

    public function savedRecipesForUser(string $uid): array
    {
        return $this->listCollection("users/{$uid}/savedRecipes", 100);
    }

    public function likedPostsForUser(string $uid): array
    {
        return $this->listCollection("users/{$uid}/likedPosts", 100);
    }

    public function listRecipes(int $limit = 1000): array
    {
        return $this->listCollection('recipes', $limit, 'createdAt');
    }

    public function createRecipe(array $data): array
    {
        $payload = $this->recipePayload($data);
        $payload['createdAt'] = now()->toIso8601String();

        return $this->createDocument('recipes', $payload);
    }

    public function updateRecipe(string $id, array $data): array
    {
        $payload = $this->recipePayload($data);
        $this->setDocument('recipes', $id, $payload, true);

        return $this->getDocument('recipes', $id) ?? ['id' => $id, ...$payload];
    }

    public function deleteRecipe(string $id): void
    {
        $this->deleteDocument('recipes', $id);
    }

    public function listPosts(int $limit = 1000): array
    {
        return $this->listCollection('posts', $limit, 'createdAt');
    }

    public function createPost(array $data): array
    {
        $payload = $this->postPayload($data);
        $payload['createdAt'] = now()->toIso8601String();

        return $this->createDocument('posts', $payload);
    }

    public function updatePost(string $id, array $data): array
    {
        $payload = $this->postPayload($data);
        $this->setDocument('posts', $id, $payload, true);

        return $this->getDocument('posts', $id) ?? ['id' => $id, ...$payload];
    }

    public function deletePost(string $id): void
    {
        $this->deleteDocument('posts', $id);
    }

    public function appSettings(): array
    {
        return array_merge($this->defaultAppSettings(), $this->getDocument('appSettings', 'mobile') ?? []);
    }

    public function updateAppSettings(array $data): array
    {
        $payload = [
            'adsEnabled' => (bool) ($data['adsEnabled'] ?? true),
            'bannerAdsEnabled' => (bool) ($data['bannerAdsEnabled'] ?? true),
            'rewardedAdsEnabled' => (bool) ($data['rewardedAdsEnabled'] ?? true),
            'admobBannerId' => (string) ($data['admobBannerId'] ?? ''),
            'admobRewardedId' => (string) ($data['admobRewardedId'] ?? ''),
            'freeDailyLimit' => (int) ($data['freeDailyLimit'] ?? 5),
            'searchRewardCredits' => (int) ($data['searchRewardCredits'] ?? 1),
            'visionRewardCredits' => (int) ($data['visionRewardCredits'] ?? 1),
            'maintenanceMode' => (bool) ($data['maintenanceMode'] ?? false),
            'maintenanceMessage' => (string) ($data['maintenanceMessage'] ?? ''),
            'minimumSupportedVersion' => (string) ($data['minimumSupportedVersion'] ?? ''),
            'updatedAt' => now()->toIso8601String(),
        ];

        $this->setDocument('appSettings', 'mobile', $payload, true);

        return $this->appSettings();
    }

    public function paginate(array $items, int $page = 1, int $perPage = 10, ?string $search = null, array $searchFields = []): array
    {
        $filtered = collect($items);

        if ($search) {
            $needle = Str::lower($search);
            $filtered = $filtered->filter(function (array $item) use ($needle, $searchFields) {
                foreach ($searchFields as $field) {
                    if (Str::contains(Str::lower((string) data_get($item, $field, '')), $needle)) {
                        return true;
                    }
                }

                return false;
            });
        }

        $total = $filtered->count();
        $page = max(1, $page);
        $perPage = max(1, $perPage);

        return [
            'data' => $filtered->forPage($page, $perPage)->values()->all(),
            'current_page' => $page,
            'last_page' => max(1, (int) ceil($total / $perPage)),
            'per_page' => $perPage,
            'total' => $total,
        ];
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

    private function google()
    {
        return Http::withToken($this->accessToken())
            ->withOptions(['proxy' => ''])
            ->acceptJson()
            ->asJson();
    }

    private function firestore()
    {
        return $this->google()->baseUrl("https://firestore.googleapis.com/v1/projects/{$this->projectId}/databases/(default)/documents");
    }

    private function disableProxyEnvironment(): void
    {
        foreach (['HTTP_PROXY', 'HTTPS_PROXY', 'ALL_PROXY', 'http_proxy', 'https_proxy', 'all_proxy'] as $name) {
            putenv($name);
            unset($_ENV[$name], $_SERVER[$name]);
        }
    }

    private function auth(): Auth
    {
        if (! $this->auth) {
            throw new RuntimeException('Firebase Auth is not configured.');
        }

        return $this->auth;
    }

    private function database(): FirestoreClient
    {
        if (! $this->database) {
            throw new RuntimeException('Firebase Firestore is not configured.');
        }

        return $this->database;
    }

    private function accessToken(): string
    {
        if (! $this->credentials) {
            throw new RuntimeException('Firebase credentials are not configured.');
        }

        return Cache::remember('firebase_access_token_'.$this->projectId, 3300, function () {
            $now = time();
            $header = $this->base64Url(json_encode(['alg' => 'RS256', 'typ' => 'JWT']) ?: '');
            $claim = $this->base64Url(json_encode([
                'iss' => $this->credentials['client_email'],
                'scope' => 'https://www.googleapis.com/auth/cloud-platform https://www.googleapis.com/auth/firebase',
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

    private function base64Url(string $value): string
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }

    private function listCollection(string $collectionPath, int $limit = 100, ?string $orderBy = null): array
    {
        if (! $this->isConfigured()) {
            return [];
        }

        $query = $this->collection($collectionPath);
        if ($orderBy) {
            $query = $query->orderBy($orderBy, 'DESC');
        }
        $query = $query->limit($limit);

        return collect($query->documents())
            ->filter(fn ($document) => $document->exists())
            ->map(fn ($document) => ['id' => $document->id(), ...$document->data()])
            ->values()
            ->all();
    }

    private function getDocument(string $collection, string $id): ?array
    {
        if (! $this->isConfigured()) {
            return null;
        }

        $document = $this->collection($collection)->document($id)->snapshot();

        if (! $document->exists()) {
            return null;
        }

        return ['id' => $document->id(), ...$document->data()];
    }

    private function createDocument(string $collection, array $data): array
    {
        $document = $this->collection($collection)->add($data)->snapshot();

        return ['id' => $document->id(), ...$document->data()];
    }

    private function setDocument(string $collection, string $id, array $data, bool $merge = false): void
    {
        if ($merge) {
            $data = array_merge($this->getDocument($collection, $id) ?? [], $data);
            unset($data['id']);
        }

        $this->collection($collection)->document($id)->set($data, ['merge' => $merge]);
    }

    private function deleteDocument(string $collection, string $id): void
    {
        $this->collection($collection)->document($id)->delete();
    }

    private function collection(string $path)
    {
        $segments = array_values(array_filter(explode('/', $path), fn (string $segment) => $segment !== ''));
        $collection = $this->database()->collection(array_shift($segments));

        while ($segments !== []) {
            $documentId = array_shift($segments);
            $collectionId = array_shift($segments);

            if ($documentId === null || $collectionId === null) {
                break;
            }

            $collection = $collection->document($documentId)->collection($collectionId);
        }

        return $collection;
    }

    private function encodeFields(array $data): array
    {
        return collect($data)
            ->reject(fn ($value) => $value === null)
            ->map(fn ($value) => $this->encodeValue($value))
            ->all();
    }

    private function encodeValue(mixed $value): array
    {
        if ($value instanceof Carbon) {
            return ['timestampValue' => $value->toRfc3339String()];
        }

        if (is_bool($value)) {
            return ['booleanValue' => $value];
        }

        if (is_int($value)) {
            return ['integerValue' => $value];
        }

        if (is_float($value)) {
            return ['doubleValue' => $value];
        }

        if (is_array($value)) {
            if (array_is_list($value)) {
                return ['arrayValue' => ['values' => array_map(fn ($item) => $this->encodeValue($item), $value)]];
            }

            return ['mapValue' => ['fields' => $this->encodeFields($value)]];
        }

        if ($this->looksLikeDate((string) $value)) {
            return ['timestampValue' => Carbon::parse($value)->toRfc3339String()];
        }

        return ['stringValue' => (string) $value];
    }

    private function decodeDocument(array $document): array
    {
        $name = $document['name'] ?? '';
        $id = Str::afterLast($name, '/');

        return [
            'id' => $id,
            ...collect($document['fields'] ?? [])->map(fn (array $value) => $this->decodeValue($value))->all(),
        ];
    }

    private function decodeValue(array $value): mixed
    {
        return match (true) {
            array_key_exists('stringValue', $value) => $value['stringValue'],
            array_key_exists('integerValue', $value) => (int) $value['integerValue'],
            array_key_exists('doubleValue', $value) => (float) $value['doubleValue'],
            array_key_exists('booleanValue', $value) => (bool) $value['booleanValue'],
            array_key_exists('timestampValue', $value) => $value['timestampValue'],
            array_key_exists('arrayValue', $value) => collect($value['arrayValue']['values'] ?? [])->map(fn ($item) => $this->decodeValue($item))->all(),
            array_key_exists('mapValue', $value) => collect($value['mapValue']['fields'] ?? [])->map(fn ($item) => $this->decodeValue($item))->all(),
            default => null,
        };
    }

    private function normalizeUser(string $uid, UserRecord|array $authUser, array $profile): array
    {
        $createdAt = $profile['createdAt'] ?? null;
        if (! $createdAt) {
            $createdAt = $authUser instanceof UserRecord
                ? $authUser->metadata->createdAt->format(DATE_ATOM)
                : (isset($authUser['createdAt']) ? Carbon::createFromTimestampMs((int) $authUser['createdAt'])->toIso8601String() : null);
        }

        $premiumUntil = $profile['premiumUntil'] ?? null;
        $displayName = $authUser instanceof UserRecord ? $authUser->displayName : ($authUser['displayName'] ?? '');
        $email = $authUser instanceof UserRecord ? $authUser->email : ($authUser['email'] ?? null);
        $emailVerified = $authUser instanceof UserRecord ? $authUser->emailVerified : ($authUser['emailVerified'] ?? false);
        $disabled = $authUser instanceof UserRecord ? $authUser->disabled : ($authUser['disabled'] ?? false);

        return [
            'id' => $uid,
            'uid' => $uid,
            'name' => $profile['name'] ?? $profile['username'] ?? $displayName ?? '',
            'username' => $profile['username'] ?? $displayName ?? '',
            'email' => $email ?? $profile['email'] ?? '',
            'email_verified_at' => $emailVerified ? now()->toIso8601String() : null,
            'role' => $profile['role'] ?? 'user',
            'is_premium' => (bool) ($profile['isPremium'] ?? false),
            'isPremium' => (bool) ($profile['isPremium'] ?? false),
            'premium_until' => $premiumUntil,
            'premiumUntil' => $premiumUntil,
            'height' => $profile['height'] ?? null,
            'weight' => $profile['weight'] ?? null,
            'age' => $profile['age'] ?? null,
            'created_at' => $createdAt,
            'createdAt' => $createdAt,
            'disabled' => (bool) $disabled,
        ];
    }

    private function userProfilePayload(array $data, UserRecord|array $authUser = []): array
    {
        $displayName = $authUser instanceof UserRecord ? $authUser->displayName : ($authUser['displayName'] ?? null);
        $email = $authUser instanceof UserRecord ? $authUser->email : ($authUser['email'] ?? null);

        return array_filter([
            'username' => $data['username'] ?? $data['name'] ?? $displayName,
            'email' => $data['email'] ?? $email,
            'role' => $data['role'] ?? null,
            'height' => isset($data['height']) ? (float) $data['height'] : null,
            'weight' => isset($data['weight']) ? (float) $data['weight'] : null,
            'age' => isset($data['age']) ? (int) $data['age'] : null,
            'isPremium' => isset($data['is_premium']) ? (bool) $data['is_premium'] : (isset($data['isPremium']) ? (bool) $data['isPremium'] : null),
            'premiumUntil' => $data['premium_until'] ?? $data['premiumUntil'] ?? null,
        ], fn ($value) => $value !== null);
    }

    private function recipePayload(array $data): array
    {
        return array_filter([
            'name' => $data['name'] ?? null,
            'description' => $data['description'] ?? '',
            'ingredients' => $data['ingredients'] ?? '',
            'instructions' => $data['instructions'] ?? '',
            'cook_time' => $data['cook_time'] ?? $data['cookTime'] ?? null,
            'prep_time' => $data['prep_time'] ?? $data['prepTime'] ?? null,
            'servings' => $data['servings'] ?? null,
            'difficulty' => $data['difficulty'] ?? '',
            'category' => $data['category'] ?? '',
            'image_url' => $data['image_url'] ?? $data['imageUrl'] ?? '',
            'image_keyword_en' => $data['image_keyword_en'] ?? '',
            'language' => $data['language'] ?? 'tr',
            'calories' => isset($data['calories']) ? (int) $data['calories'] : null,
            'protein' => isset($data['protein']) ? (float) $data['protein'] : null,
            'fat' => isset($data['fat']) ? (float) $data['fat'] : null,
            'carbohydrates' => isset($data['carbohydrates']) ? (float) $data['carbohydrates'] : null,
            'unsplash_id' => $data['unsplash_id'] ?? '',
            'unsplash_photographer' => $data['unsplash_photographer'] ?? '',
            'unsplash_photographer_url' => $data['unsplash_photographer_url'] ?? '',
            'unsplash_photo_url' => $data['unsplash_photo_url'] ?? '',
            'unsplash_download_url' => $data['unsplash_download_url'] ?? '',
            'unsplash_download_location' => $data['unsplash_download_location'] ?? '',
            'userId' => $data['userId'] ?? $data['user_id'] ?? null,
        ], fn ($value) => $value !== null);
    }

    private function postPayload(array $data): array
    {
        return array_filter([
            'title' => $data['title'] ?? null,
            'description' => $data['description'] ?? '',
            'category' => $data['category'] ?? '',
            'difficulty' => $data['difficulty'] ?? '',
            'ingredients' => $data['ingredients'] ?? '[]',
            'steps' => $data['steps'] ?? '[]',
            'imageUrl' => $data['imageUrl'] ?? $data['image_url'] ?? '',
            'userId' => $data['userId'] ?? $data['user_id'] ?? null,
            'username' => $data['username'] ?? '',
            'likesCount' => isset($data['likesCount']) ? (int) $data['likesCount'] : (isset($data['likes_count']) ? (int) $data['likes_count'] : 0),
            'status' => isset($data['status']) ? (bool) $data['status'] : true,
        ], fn ($value) => $value !== null);
    }

    private function defaultAppSettings(): array
    {
        return [
            'adsEnabled' => true,
            'bannerAdsEnabled' => true,
            'rewardedAdsEnabled' => true,
            'admobBannerId' => '',
            'admobRewardedId' => '',
            'freeDailyLimit' => 5,
            'searchRewardCredits' => 1,
            'visionRewardCredits' => 1,
            'maintenanceMode' => false,
            'maintenanceMessage' => '',
            'minimumSupportedVersion' => '',
        ];
    }

    private function looksLikeDate(string $value): bool
    {
        return (bool) preg_match('/^\d{4}-\d{2}-\d{2}/', $value);
    }

    private function countCreatedToday(array $items, string $today): int
    {
        return collect($items)->filter(function (array $item) use ($today) {
            $created = $item['created_at'] ?? $item['createdAt'] ?? null;

            return $created && Str::startsWith((string) $created, $today);
        })->count();
    }
}
