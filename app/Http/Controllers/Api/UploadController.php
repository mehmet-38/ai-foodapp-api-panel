<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class UploadController extends Controller
{
    /**
     * Upload recipe image
     * POST /api/upload/recipe-image
     */
    public function uploadRecipeImage(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'image' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $image = $request->file('image');
            $originalName = $image->getClientOriginalName();
            $extension = $image->getClientOriginalExtension();
            $filename = time() . '_' . Str::random(10) . '.' . $extension;
            
            // Store in public/uploads/recipes directory
            $path = $image->storeAs('uploads/recipes', $filename, 'public');
            
            $imageUrl = '/api/images/' . $filename;
            $size = $image->getSize();

            return response()->json([
                'success' => true,
                'message' => 'Image uploaded successfully',
                'data' => [
                    'imageUrl' => $imageUrl,
                    'filename' => $filename,
                    'originalName' => $originalName,
                    'size' => $size
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Image upload failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete recipe image
     * DELETE /api/upload/recipe-image/:filename
     */
    public function deleteRecipeImage($filename)
    {
        try {
            $path = 'uploads/recipes/' . $filename;
            
            if (Storage::disk('public')->exists($path)) {
                Storage::disk('public')->delete($path);
                
                return response()->json([
                    'success' => true,
                    'message' => 'Image deleted successfully'
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Image not found'
                ], 404);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Image deletion failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Serve image from uploads directory
     * GET /api/upload/images/:filename
     */
    public function serveUploadImage($filename)
    {
        $path = 'uploads/recipes/' . $filename;
        
        if (!Storage::disk('public')->exists($path)) {
            return response()->json([
                'success' => false,
                'message' => 'Image not found'
            ], 404);
        }

        $file = Storage::disk('public')->get($path);
        
        // Get MIME type based on file extension
        $extension = pathinfo($filename, PATHINFO_EXTENSION);
        $mimeTypes = [
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'png' => 'image/png',
            'gif' => 'image/gif',
            'webp' => 'image/webp'
        ];
        $mimeType = $mimeTypes[strtolower($extension)] ?? 'application/octet-stream';

        return response($file, 200)->header('Content-Type', $mimeType);
    }

    /**
     * Serve image (short path)
     * GET /api/images/:filename
     */
    public function serveImage($filename)
    {
        return $this->serveUploadImage($filename);
    }
}