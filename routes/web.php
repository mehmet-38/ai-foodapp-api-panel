<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\Admin\AdminController;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [AdminController::class, 'dashboard'])->name('dashboard');
});

// Admin Panel Routes
Route::middleware(['auth', 'verified'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/dashboard', [AdminController::class, 'dashboard'])->name('dashboard');
    Route::get('/users', [AdminController::class, 'users'])->name('users');
    Route::get('/recipes', [AdminController::class, 'recipes'])->name('recipes');
    Route::get('/posts', [AdminController::class, 'posts'])->name('posts');
    Route::get('/packages', [AdminController::class, 'packages'])->name('packages');
    
    // Admin API endpoints
    Route::get('/api/stats', [AdminController::class, 'getDashboardStats'])->name('api.stats');
    
    // User management API endpoints
    Route::post('/api/users', [AdminController::class, 'storeUser'])->name('api.users.store');
    Route::put('/api/users/{id}', [AdminController::class, 'updateUser'])->name('api.users.update');
    Route::delete('/api/users/{id}', [AdminController::class, 'deleteUser'])->name('api.users.delete');
    
    // Recipe management API endpoints
    Route::post('/api/recipes', [AdminController::class, 'storeRecipe'])->name('api.recipes.store');
    Route::put('/api/recipes/{id}', [AdminController::class, 'updateRecipe'])->name('api.recipes.update');
    Route::delete('/api/recipes/{id}', [AdminController::class, 'deleteRecipe'])->name('api.recipes.delete');
    
    // Posts management API endpoints
    Route::post('/api/posts', [AdminController::class, 'storePost'])->name('api.posts.store');
    Route::put('/api/posts/{id}', [AdminController::class, 'updatePost'])->name('api.posts.update');
    Route::delete('/api/posts/{id}', [AdminController::class, 'deletePost'])->name('api.posts.delete');
    
    // Packages management API endpoints
    Route::get('/api/packages/list', [AdminController::class, 'getPackagesList'])->name('api.packages.list');
    Route::post('/api/packages', [AdminController::class, 'storePackage'])->name('api.packages.store');
    Route::put('/api/packages/{id}', [AdminController::class, 'updatePackage'])->name('api.packages.update');
    Route::delete('/api/packages/{id}', [AdminController::class, 'deletePackage'])->name('api.packages.delete');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
