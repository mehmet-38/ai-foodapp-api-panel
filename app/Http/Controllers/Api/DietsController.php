<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Diet;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class DietsController extends Controller
{
    /**
     * Get all diets for authenticated user
     * GET /api/diets
     */
    public function index(Request $request)
    {
        $user = $request->user();
        
        $diets = Diet::where('user_id', $user->id)
            ->select(['id', 'name', 'description', 'created_at', 'updated_at'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $diets
        ]);
    }

    /**
     * Get a specific diet
     * GET /api/diets/:id
     */
    public function show(Request $request, $id)
    {
        $user = $request->user();
        
        $diet = Diet::where('id', $id)
            ->where('user_id', $user->id)
            ->first();

        if (!$diet) {
            return response()->json([
                'success' => false,
                'message' => 'Diet not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $diet
        ]);
    }

    /**
     * Create a new diet
     * POST /api/diets
     */
    public function store(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $diet = Diet::create([
            'user_id' => $user->id,
            'name' => $request->name,
            'description' => $request->description,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Diet created successfully',
            'data' => [
                'id' => $diet->id
            ]
        ], 201);
    }

    /**
     * Update a diet
     * PUT /api/diets/:id
     */
    public function update(Request $request, $id)
    {
        $user = $request->user();
        
        $diet = Diet::where('id', $id)
            ->where('user_id', $user->id)
            ->first();

        if (!$diet) {
            return response()->json([
                'success' => false,
                'message' => 'Diet not found'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $diet->update($request->only(['name', 'description']));

        return response()->json([
            'success' => true,
            'message' => 'Diet updated successfully'
        ]);
    }

    /**
     * Delete a diet
     * DELETE /api/diets/:id
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        
        $diet = Diet::where('id', $id)
            ->where('user_id', $user->id)
            ->first();

        if (!$diet) {
            return response()->json([
                'success' => false,
                'message' => 'Diet not found'
            ], 404);
        }

        $diet->delete();

        return response()->json([
            'success' => true,
            'message' => 'Diet deleted successfully'
        ]);
    }
}