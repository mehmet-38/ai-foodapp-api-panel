<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UsersController;
use App\Http\Controllers\Api\RecipesController;
use App\Http\Controllers\Api\UploadController;
use App\Http\Controllers\Api\DietsController;
use App\Http\Controllers\Api\PostsController;
use App\Http\Controllers\Api\PremiumController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Public routes
Route::get('/premium/packages', [PremiumController::class, 'index']);
Route::post('/revenuecat/webhook', [App\Http\Controllers\Api\RevenueCatController::class, 'handleWebhook']);

Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
});

// Public recipe routes
Route::prefix('recipes')->group(function () {
    Route::get('/', [RecipesController::class, 'index']);
    Route::get('/{id}', [RecipesController::class, 'show']);
    Route::post('/search', [RecipesController::class, 'searchByIngredients']);
});

// Public image serving routes
Route::get('/upload/images/{filename}', [UploadController::class, 'serveUploadImage']);
Route::get('/images/{filename}', [UploadController::class, 'serveImage']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    
    // Auth routes
    Route::prefix('auth')->group(function () {
        Route::get('/profile', [AuthController::class, 'profile']);
        Route::post('/logout', [AuthController::class, 'logout']);
    });

    // Users routes
    Route::prefix('users')->group(function () {
        Route::get('/profile', [UsersController::class, 'profile']);
        Route::put('/profile', [UsersController::class, 'updateProfile']);
        Route::put('/change-password', [UsersController::class, 'changePassword']);
        Route::get('/saved-recipes', [UsersController::class, 'savedRecipes']);
    });

    // Protected recipe routes
    Route::prefix('recipes')->group(function () {
        Route::post('/', [RecipesController::class, 'store']);
        Route::put('/{id}', [RecipesController::class, 'update']);
        Route::delete('/{id}', [RecipesController::class, 'destroy']);
        Route::post('/{recipeId}/save', [RecipesController::class, 'saveRecipe']);
        Route::delete('/{recipeId}/save', [RecipesController::class, 'unsaveRecipe']);
        Route::put('/{id}/image', [RecipesController::class, 'updateImage']);
    });

    // Upload routes
    Route::prefix('upload')->group(function () {
        Route::post('/recipe-image', [UploadController::class, 'uploadRecipeImage']);
        Route::delete('/recipe-image/{filename}', [UploadController::class, 'deleteRecipeImage']);
    });

    // Diets routes
    Route::prefix('diets')->group(function () {
        Route::get('/', [DietsController::class, 'index']);
        Route::get('/{id}', [DietsController::class, 'show']);
        Route::post('/', [DietsController::class, 'store']);
        Route::put('/{id}', [DietsController::class, 'update']);
        Route::delete('/{id}', [DietsController::class, 'destroy']);
    });

    // Posts routes
    Route::prefix('posts')->group(function () {
        Route::get('/feed', [PostsController::class, 'feed']);
        Route::get('/my-posts', [PostsController::class, 'myPosts']);
        Route::get('/user/{userId}', [PostsController::class, 'userPosts']);
        Route::get('/{id}', [PostsController::class, 'show']);
        Route::post('/', [PostsController::class, 'store']);
        Route::put('/{id}', [PostsController::class, 'update']);
        Route::delete('/{id}', [PostsController::class, 'destroy']);
        Route::post('/{id}/like', [PostsController::class, 'likePost']);
        Route::delete('/{id}/like', [PostsController::class, 'unlikePost']);
    });
});