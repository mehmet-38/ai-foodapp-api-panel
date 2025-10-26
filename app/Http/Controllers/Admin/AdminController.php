<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Recipe;
use App\Models\Post;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class AdminController extends Controller
{
    /**
     * Show the admin dashboard
     */
    public function dashboard()
    {
        // Dashboard istatistikleri
        $stats = [
            'totalUsers' => User::count(),
            'totalRecipes' => Recipe::count(),
            'totalPosts' => Post::count(),
        ];

        // Son aktiviteler (örnek veri, ihtiyaca göre özelleştirilebilir)
        $recentUsers = User::latest()->take(5)->get(['id', 'username', 'created_at']);
        $recentRecipes = Recipe::latest()->take(5)->get(['id', 'name', 'created_at']);

        return Inertia::render('admin/dashboard', [
            'stats' => $stats,
            'recentUsers' => $recentUsers,
            'recentRecipes' => $recentRecipes,
        ]);
    }

    /**
     * Show users management page
     */
    public function users(Request $request)
    {
        $search = $request->get('search');
        $perPage = $request->get('per_page', 10);

        $users = User::query()
            ->when($search, function ($query, $search) {
                return $query->where('username', 'like', "%{$search}%")
                            ->orWhere('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
            })
            ->latest()
            ->paginate($perPage);

        return Inertia::render('admin/users', [
            'users' => $users,
            'filters' => [
                'search' => $search,
                'per_page' => $perPage,
            ]
        ]);
    }

    /**
     * Show recipes management page
     */
    public function recipes(Request $request)
    {
        $search = $request->get('search');
        $perPage = $request->get('per_page', 10);

        $recipes = Recipe::query()
            ->when($search, function ($query, $search) {
                return $query->where('name', 'like', "%{$search}%")
                            ->orWhere('description', 'like', "%{$search}%");
            })
            ->latest()
            ->paginate($perPage);

        return Inertia::render('admin/recipes', [
            'recipes' => $recipes,
            'filters' => [
                'search' => $search,
                'per_page' => $perPage,
            ]
        ]);
    }

    /**
     * Show posts management page
     */
    public function posts(Request $request)
    {
        $search = $request->get('search');
        $perPage = $request->get('per_page', 10);

        $posts = Post::with('user')
            ->when($search, function ($query, $search) {
                return $query->where('title', 'like', "%{$search}%")
                            ->orWhere('description', 'like', "%{$search}%");
            })
            ->latest()
            ->paginate($perPage);

        return Inertia::render('admin/posts', [
            'posts' => $posts,
            'filters' => [
                'search' => $search,
                'per_page' => $perPage,
            ]
        ]);
    }

    /**
     * Get dashboard statistics API
     */
    public function getDashboardStats()
    {
        $stats = [
            'totalUsers' => User::count(),
            'totalRecipes' => Recipe::count(),
            'totalPosts' => Post::count(),
            'todayUsers' => User::whereDate('created_at', today())->count(),
            'todayRecipes' => Recipe::whereDate('created_at', today())->count(),
            'todayPosts' => Post::whereDate('created_at', today())->count(),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }

    /**
     * Store a new user
     * POST /admin/api/users
     */
    public function storeUser(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'username' => 'required|string|max:50|unique:users',
            'email' => 'required|string|email|max:100|unique:users',
            'password' => 'required|string|min:6',
            'role' => 'required|in:user,admin',
            'height' => 'nullable|numeric|min:0',
            'weight' => 'nullable|numeric|min:0',
            'age' => 'nullable|integer|min:0|max:150',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = User::create([
            'name' => $request->name,
            'username' => $request->username,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
            'height' => $request->height,
            'weight' => $request->weight,
            'age' => $request->age,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'User created successfully',
            'data' => $user
        ], 201);
    }

    /**
     * Update an existing user
     * PUT /admin/api/users/{id}
     */
    public function updateUser(Request $request, $id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not found'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'username' => 'sometimes|string|max:50|unique:users,username,' . $id,
            'email' => 'sometimes|string|email|max:100|unique:users,email,' . $id,
            'password' => 'sometimes|string|min:6',
            'role' => 'sometimes|in:user,admin',
            'height' => 'sometimes|nullable|numeric|min:0',
            'weight' => 'sometimes|nullable|numeric|min:0',
            'age' => 'sometimes|nullable|integer|min:0|max:150',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $updateData = $request->only(['name', 'username', 'email', 'role', 'height', 'weight', 'age']);
        
        if ($request->has('password')) {
            $updateData['password'] = Hash::make($request->password);
        }

        $user->update($updateData);

        return response()->json([
            'success' => true,
            'message' => 'User updated successfully',
            'data' => $user->fresh()
        ]);
    }

    /**
     * Delete a user
     * DELETE /admin/api/users/{id}
     */
    public function deleteUser($id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not found'
            ], 404);
        }

        // Delete user and related data will be handled by foreign key constraints
        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'User deleted successfully'
        ]);
    }

    /**
     * Store a new recipe
     * POST /admin/api/recipes
     */
    public function storeRecipe(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'required|string',
            'ingredients' => 'required|string',
            'instructions' => 'required|string',
            'image_url' => 'nullable|string|max:500',
            'prep_time' => 'required|integer|min:0',
            'cook_time' => 'required|integer|min:0',
            'servings' => 'required|integer|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $recipe = Recipe::create($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Recipe created successfully',
            'data' => $recipe
        ], 201);
    }

    /**
     * Update an existing recipe
     * PUT /admin/api/recipes/{id}
     */
    public function updateRecipe(Request $request, $id)
    {
        $recipe = Recipe::find($id);

        if (!$recipe) {
            return response()->json([
                'success' => false,
                'message' => 'Recipe not found'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
            'ingredients' => 'sometimes|string',
            'instructions' => 'sometimes|string',
            'image_url' => 'sometimes|nullable|string|max:500',
            'prep_time' => 'sometimes|integer|min:0',
            'cook_time' => 'sometimes|integer|min:0',
            'servings' => 'sometimes|integer|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $recipe->update($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Recipe updated successfully',
            'data' => $recipe->fresh()
        ]);
    }

    /**
     * Delete a recipe
     * DELETE /admin/api/recipes/{id}
     */
    public function deleteRecipe($id)
    {
        $recipe = Recipe::find($id);

        if (!$recipe) {
            return response()->json([
                'success' => false,
                'message' => 'Recipe not found'
            ], 404);
        }

        $recipe->delete();

        return response()->json([
            'success' => true,
            'message' => 'Recipe deleted successfully'
        ]);
    }

    /**
     * Store a new post
     * POST /admin/api/posts
     */
    public function storePost(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'image_url' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $post = Post::create($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Post created successfully',
            'data' => $post->load('user')
        ], 201);
    }

    /**
     * Update an existing post
     * PUT /admin/api/posts/{id}
     */
    public function updatePost(Request $request, $id)
    {
        $post = Post::find($id);

        if (!$post) {
            return response()->json([
                'success' => false,
                'message' => 'Post not found'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
            'image_url' => 'sometimes|nullable|string|max:500',
            'status' => 'sometimes|integer|in:0,1',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $post->update($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Post updated successfully',
            'data' => $post->load('user')
        ]);
    }

    /**
     * Delete a post
     * DELETE /admin/api/posts/{id}
     */
    public function deletePost($id)
    {
        $post = Post::find($id);

        if (!$post) {
            return response()->json([
                'success' => false,
                'message' => 'Post not found'
            ], 404);
        }

        $post->delete();

        return response()->json([
            'success' => true,
            'message' => 'Post deleted successfully'
        ]);
    }
}