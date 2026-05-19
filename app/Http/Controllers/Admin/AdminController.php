<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\Firebase\FirebaseService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;

class AdminController extends Controller
{
    public function __construct(private readonly FirebaseService $firebase)
    {
    }

    public function dashboard()
    {
        $users = collect($this->firebase->listUsers())->take(5)->values();
        $recipes = collect($this->firebase->listRecipes())->take(5)->values();

        return Inertia::render('admin/dashboard', [
            'stats' => $this->firebase->dashboardStats(),
            'recentUsers' => $users,
            'recentRecipes' => $recipes,
            'firebaseConfigured' => $this->firebase->isConfigured(),
        ]);
    }

    public function users(Request $request)
    {
        $search = $request->get('search');
        $perPage = (int) $request->get('per_page', 10);
        $page = (int) $request->get('page', 1);

        return Inertia::render('admin/users', [
            'users' => $this->firebase->paginate(
                $this->firebase->listUsers(),
                $page,
                $perPage,
                $search,
                ['username', 'name', 'email']
            ),
            'filters' => ['search' => $search, 'per_page' => $perPage],
        ]);
    }

    public function recipes(Request $request)
    {
        $search = $request->get('search');
        $perPage = (int) $request->get('per_page', 10);
        $page = (int) $request->get('page', 1);
        $recipes = collect($this->firebase->listRecipes())->map(fn (array $recipe) => [
            ...$recipe,
            'created_at' => $recipe['createdAt'] ?? $recipe['created_at'] ?? null,
            'image_url' => $recipe['image_url'] ?? $recipe['imageUrl'] ?? null,
        ])->all();

        return Inertia::render('admin/recipes', [
            'recipes' => $this->firebase->paginate(
                $recipes,
                $page,
                $perPage,
                $search,
                ['name', 'description', 'ingredients', 'category']
            ),
            'filters' => ['search' => $search, 'per_page' => $perPage],
        ]);
    }

    public function posts(Request $request)
    {
        $search = $request->get('search');
        $perPage = (int) $request->get('per_page', 10);
        $page = (int) $request->get('page', 1);

        $usersById = collect($this->firebase->listUsers())->keyBy('uid');
        $posts = collect($this->firebase->listPosts())->map(function (array $post) use ($usersById) {
            $user = $usersById->get($post['userId'] ?? '', []);

            return [
                ...$post,
                'image_url' => $post['imageUrl'] ?? $post['image_url'] ?? null,
                'likes_count' => $post['likesCount'] ?? $post['likes_count'] ?? 0,
                'created_at' => $post['createdAt'] ?? $post['created_at'] ?? null,
                'status' => (int) (bool) ($post['status'] ?? true),
                'user' => [
                    'id' => $post['userId'] ?? '',
                    'uid' => $post['userId'] ?? '',
                    'name' => $user['name'] ?? $post['username'] ?? '',
                    'username' => $user['username'] ?? $post['username'] ?? '',
                    'email' => $user['email'] ?? '',
                ],
            ];
        })->all();

        return Inertia::render('admin/posts', [
            'posts' => $this->firebase->paginate($posts, $page, $perPage, $search, ['title', 'description', 'username', 'category']),
            'filters' => ['search' => $search, 'per_page' => $perPage],
        ]);
    }

    public function packages(Request $request)
    {
        return redirect()->route('admin.settings');
    }

    public function settings()
    {
        return Inertia::render('admin/settings', [
            'settings' => $this->firebase->appSettings(),
            'firebaseConfigured' => $this->firebase->isConfigured(),
        ]);
    }

    public function getDashboardStats()
    {
        return response()->json(['success' => true, 'data' => $this->firebase->dashboardStats()]);
    }

    public function getPackagesList()
    {
        return response()->json(['success' => true, 'data' => []]);
    }

    public function storePackage()
    {
        return $this->legacyPackagesDisabled();
    }

    public function updatePackage()
    {
        return $this->legacyPackagesDisabled();
    }

    public function deletePackage()
    {
        return $this->legacyPackagesDisabled();
    }

    public function storeUser(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'nullable|string|max:255',
            'username' => 'required|string|max:50',
            'email' => 'required|string|email|max:100',
            'password' => 'required|string|min:6',
            'role' => 'required|in:user,admin',
            'height' => 'nullable|numeric|min:0',
            'weight' => 'nullable|numeric|min:0',
            'age' => 'nullable|integer|min:0|max:150',
            'is_premium' => 'boolean',
            'premium_until' => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator);
        }

        return response()->json([
            'success' => true,
            'message' => 'User created successfully',
            'data' => $this->firebase->createUser($validator->validated()),
        ], 201);
    }

    public function updateUser(Request $request, string $id)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|nullable|string|max:255',
            'username' => 'sometimes|string|max:50',
            'email' => 'sometimes|string|email|max:100',
            'password' => 'sometimes|nullable|string|min:6',
            'role' => 'sometimes|in:user,admin',
            'height' => 'sometimes|nullable|numeric|min:0',
            'weight' => 'sometimes|nullable|numeric|min:0',
            'age' => 'sometimes|nullable|integer|min:0|max:150',
            'is_premium' => 'boolean',
            'premium_until' => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator);
        }

        return response()->json([
            'success' => true,
            'message' => 'User updated successfully',
            'data' => $this->firebase->updateUser($id, $validator->validated()),
        ]);
    }

    public function deleteUser(string $id)
    {
        $this->firebase->deleteUser($id);

        return response()->json(['success' => true, 'message' => 'User deleted successfully']);
    }

    public function userActivity(string $id)
    {
        return response()->json([
            'success' => true,
            'data' => [
                'savedRecipes' => $this->firebase->savedRecipesForUser($id),
                'likedPosts' => $this->firebase->likedPostsForUser($id),
            ],
        ]);
    }

    public function storeRecipe(Request $request)
    {
        $validator = Validator::make($request->all(), $this->recipeRules());

        if ($validator->fails()) {
            return $this->validationError($validator);
        }

        return response()->json([
            'success' => true,
            'message' => 'Recipe created successfully',
            'data' => $this->firebase->createRecipe($validator->validated()),
        ], 201);
    }

    public function updateRecipe(Request $request, string $id)
    {
        $validator = Validator::make($request->all(), $this->recipeRules('sometimes'));

        if ($validator->fails()) {
            return $this->validationError($validator);
        }

        return response()->json([
            'success' => true,
            'message' => 'Recipe updated successfully',
            'data' => $this->firebase->updateRecipe($id, $validator->validated()),
        ]);
    }

    public function deleteRecipe(string $id)
    {
        $this->firebase->deleteRecipe($id);

        return response()->json(['success' => true, 'message' => 'Recipe deleted successfully']);
    }

    public function storePost(Request $request)
    {
        $validator = Validator::make($request->all(), $this->postRules());

        if ($validator->fails()) {
            return $this->validationError($validator);
        }

        return response()->json([
            'success' => true,
            'message' => 'Post created successfully',
            'data' => $this->firebase->createPost($validator->validated()),
        ], 201);
    }

    public function updatePost(Request $request, string $id)
    {
        $validator = Validator::make($request->all(), $this->postRules('sometimes'));

        if ($validator->fails()) {
            return $this->validationError($validator);
        }

        return response()->json([
            'success' => true,
            'message' => 'Post updated successfully',
            'data' => $this->firebase->updatePost($id, $validator->validated()),
        ]);
    }

    public function deletePost(string $id)
    {
        $this->firebase->deletePost($id);

        return response()->json(['success' => true, 'message' => 'Post deleted successfully']);
    }

    public function updateSettings(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'adsEnabled' => 'boolean',
            'bannerAdsEnabled' => 'boolean',
            'rewardedAdsEnabled' => 'boolean',
            'admobBannerId' => 'nullable|string|max:255',
            'admobRewardedId' => 'nullable|string|max:255',
            'freeDailyLimit' => 'required|integer|min:0|max:1000',
            'searchRewardCredits' => 'required|integer|min:0|max:1000',
            'visionRewardCredits' => 'required|integer|min:0|max:1000',
            'maintenanceMode' => 'boolean',
            'maintenanceMessage' => 'nullable|string|max:1000',
            'minimumSupportedVersion' => 'nullable|string|max:50',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator);
        }

        return response()->json([
            'success' => true,
            'message' => 'Settings updated successfully',
            'data' => $this->firebase->updateAppSettings($validator->validated()),
        ]);
    }

    private function recipeRules(string $required = 'required'): array
    {
        return [
            'name' => "{$required}|string|max:255",
            'description' => 'nullable|string',
            'ingredients' => "{$required}|string",
            'instructions' => "{$required}|string",
            'image_url' => 'nullable|string|max:1000',
            'prep_time' => 'nullable',
            'cook_time' => 'nullable',
            'servings' => 'nullable',
            'difficulty' => 'nullable|string|max:100',
            'category' => 'nullable|string|max:100',
            'language' => 'nullable|string|max:10',
            'image_keyword_en' => 'nullable|string|max:255',
            'calories' => 'nullable|numeric|min:0',
            'protein' => 'nullable|numeric|min:0',
            'fat' => 'nullable|numeric|min:0',
            'carbohydrates' => 'nullable|numeric|min:0',
            'unsplash_id' => 'nullable|string',
            'unsplash_photographer' => 'nullable|string',
            'unsplash_photographer_url' => 'nullable|string',
            'unsplash_photo_url' => 'nullable|string',
            'unsplash_download_url' => 'nullable|string',
            'unsplash_download_location' => 'nullable|string',
        ];
    }

    private function postRules(string $required = 'required'): array
    {
        return [
            'userId' => "{$required}|string",
            'username' => 'nullable|string|max:255',
            'title' => "{$required}|string|max:255",
            'description' => 'nullable|string',
            'imageUrl' => 'nullable|string|max:1000',
            'category' => 'nullable|string|max:100',
            'difficulty' => 'nullable|string|max:100',
            'ingredients' => 'nullable|string',
            'steps' => 'nullable|string',
            'likesCount' => 'nullable|integer|min:0',
            'status' => 'sometimes|boolean',
        ];
    }

    private function validationError($validator)
    {
        return response()->json([
            'success' => false,
            'message' => 'Validation error',
            'errors' => $validator->errors(),
        ], 422);
    }

    private function legacyPackagesDisabled()
    {
        return response()->json([
            'success' => false,
            'message' => 'Premium packages are now managed by RevenueCat and mobile settings.',
        ], 410);
    }
}
