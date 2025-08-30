<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class UsersController extends Controller
{
    /**
     * Get user profile
     * GET /api/users/profile
     */
    public function profile(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'user' => [
                'id' => $user->id,
                'username' => $user->username,
                'email' => $user->email,
                'height' => $user->height,
                'weight' => $user->weight,
                'age' => $user->age,
                'created_at' => $user->created_at,
            ]
        ]);
    }

    /**
     * Update user profile
     * PUT /api/users/profile
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'username' => 'sometimes|string|max:50|unique:users,username,' . $user->id,
            'email' => 'sometimes|string|email|max:100|unique:users,email,' . $user->id,
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

        $user->update($request->only(['username', 'email', 'height', 'weight', 'age']));

        return response()->json([
            'message' => 'Profile updated successfully'
        ]);
    }

    /**
     * Change user password
     * PUT /api/users/change-password
     */
    public function changePassword(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'currentPassword' => 'required|string',
            'newPassword' => 'required|string|min:6',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        if (!Hash::check($request->currentPassword, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Current password is incorrect'
            ], 422);
        }

        $user->update([
            'password' => Hash::make($request->newPassword)
        ]);

        return response()->json([
            'message' => 'Password changed successfully'
        ]);
    }

    /**
     * Get user's saved recipes
     * GET /api/users/saved-recipes
     */
    public function savedRecipes(Request $request)
    {
        $user = $request->user();
        
        $recipes = $user->savedRecipes()
            ->select(['id', 'name', 'description', 'ingredients', 'instructions', 'image_url', 'prep_time', 'cook_time', 'servings', 'created_at'])
            ->get();

        return response()->json([
            'recipes' => $recipes
        ]);
    }
}