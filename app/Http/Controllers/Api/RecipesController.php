<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Recipe;
use App\Models\SavedRecipe;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class RecipesController extends Controller
{
    /**
     * Get all recipes with pagination
     * GET /api/recipes
     */
    public function index(Request $request)
    {
        $limit = $request->query('limit', 10);
        $offset = $request->query('offset', 0);
        $search = $request->query('search');

        $query = Recipe::query();

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'LIKE', '%' . $search . '%')
                  ->orWhere('description', 'LIKE', '%' . $search . '%')
                  ->orWhere('ingredients', 'LIKE', '%' . $search . '%');
            });
        }

        $recipes = $query->select([
                'id', 'name', 'description', 'ingredients', 'instructions', 
                'image_url', 'prep_time', 'cook_time', 'servings', 'created_at',
                'unsplash_photographer', 'unsplash_photographer_url', 'unsplash_download_location',
                'calories', 'protein', 'carbohydrates', 'fat'
            ])
            ->offset($offset)
            ->limit($limit)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'recipes' => $recipes,
            'pagination' => [
                'limit' => $limit,
                'offset' => $offset
            ]
        ]);
    }

    /**
     * Get a specific recipe
     * GET /api/recipes/:id
     */
    public function show($id)
    {
        $recipe = Recipe::find($id);

        if (!$recipe) {
            return response()->json([
                'success' => false,
                'message' => 'Recipe not found'
            ], 404);
        }

        return response()->json([
            'recipe' => $recipe
        ]);
    }

    /**
     * Create a new recipe
     * POST /api/recipes
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:100',
            'description' => 'nullable|string',
            'ingredients' => 'required|string',
            'instructions' => 'required|string',
            'prep_time' => 'nullable|integer|min:0',
            'cook_time' => 'nullable|integer|min:0',
            'servings' => 'nullable|integer|min:1',
            'unsplash_photographer' => 'nullable|string',
            'unsplash_photographer_url' => 'nullable|string',
            'unsplash_download_location' => 'nullable|string',
            'calories' => 'nullable|integer|min:0',
            'protein' => 'nullable|numeric|min:0',
            'carbohydrates' => 'nullable|numeric|min:0',
            'fat' => 'nullable|numeric|min:0',
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
            'message' => 'Recipe created successfully',
            'recipeId' => $recipe->id
        ], 201);
    }

    /**
     * Update a recipe
     * PUT /api/recipes/:id
     */
    public function update(Request $request, $id)
    {
        $recipe = Recipe::find($id);

        if (!$recipe) {
            return response()->json([
                'success' => false,
                'message' => 'Recipe not found'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:100',
            'description' => 'sometimes|nullable|string',
            'ingredients' => 'sometimes|string',
            'instructions' => 'sometimes|string',
            'prep_time' => 'sometimes|nullable|integer|min:0',
            'cook_time' => 'sometimes|nullable|integer|min:0',
            'servings' => 'sometimes|nullable|integer|min:1',
            'unsplash_photographer' => 'sometimes|nullable|string',
            'unsplash_photographer_url' => 'sometimes|nullable|string',
            'unsplash_download_location' => 'sometimes|nullable|string',
            'calories' => 'sometimes|nullable|integer|min:0',
            'protein' => 'sometimes|nullable|numeric|min:0',
            'carbohydrates' => 'sometimes|nullable|numeric|min:0',
            'fat' => 'sometimes|nullable|numeric|min:0',
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
            'message' => 'Recipe updated successfully'
        ]);
    }

    /**
     * Delete a recipe
     * DELETE /api/recipes/:id
     */
    public function destroy($id)
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
            'message' => 'Recipe deleted successfully'
        ]);
    }

    /**
     * Search recipes by ingredients
     * POST /api/recipes/search
     */
    public function searchByIngredients(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'ingredients' => 'required|array',
            'ingredients.*' => 'string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $limit = $request->query('limit', 10);
        $ingredients = $request->ingredients;

        $query = Recipe::query();

        foreach ($ingredients as $ingredient) {
            $query->where('ingredients', 'LIKE', '%' . $ingredient . '%');
        }

        $recipes = $query->select([
                'id', 'name', 'description', 'ingredients', 'instructions', 
                'image_url', 'prep_time', 'cook_time', 'servings', 'created_at',
                'unsplash_photographer', 'unsplash_photographer_url', 'unsplash_download_location',
                'calories', 'protein', 'carbohydrates', 'fat'
            ])
            ->limit($limit)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'recipes' => $recipes
        ]);
    }

    /**
     * Save a recipe for user
     * POST /api/recipes/:recipeId/save
     */
    public function saveRecipe(Request $request, $recipeId)
    {
        $user = $request->user();
        $recipe = Recipe::find($recipeId);

        if (!$recipe) {
            return response()->json([
                'success' => false,
                'message' => 'Recipe not found'
            ], 404);
        }

        try {
            SavedRecipe::create([
                'user_id' => $user->id,
                'recipe_id' => $recipeId
            ]);

            return response()->json([
                'message' => 'Recipe saved successfully'
            ]);
        } catch (\Exception $e) {
            // Handle duplicate entry error
            return response()->json([
                'success' => false,
                'message' => 'Recipe already saved'
            ], 409);
        }
    }

    /**
     * Unsave a recipe for user
     * DELETE /api/recipes/:recipeId/save
     */
    public function unsaveRecipe(Request $request, $recipeId)
    {
        $user = $request->user();

        $savedRecipe = SavedRecipe::where('user_id', $user->id)
            ->where('recipe_id', $recipeId)
            ->first();

        if (!$savedRecipe) {
            return response()->json([
                'success' => false,
                'message' => 'Recipe not found in saved recipes'
            ], 404);
        }

        $savedRecipe->delete();

        return response()->json([
            'message' => 'Recipe removed from saved recipes'
        ]);
    }

    /**
     * Update recipe image
     * PUT /api/recipes/:id/image
     */
    public function updateImage(Request $request, $id)
    {
        $recipe = Recipe::find($id);

        if (!$recipe) {
            return response()->json([
                'success' => false,
                'message' => 'Recipe not found'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'image_url' => 'required|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $recipe->update(['image_url' => $request->image_url]);

        return response()->json([
            'success' => true,
            'message' => 'Recipe image updated successfully',
            'data' => [
                'recipeId' => $recipe->id,
                'image_url' => $recipe->image_url
            ]
        ]);
    }
}