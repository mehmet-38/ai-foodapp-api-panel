<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Recipe extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'ingredients',
        'instructions',
        'image_url',
        'prep_time',
        'cook_time',
        'servings',
    ];

    protected $casts = [
        'prep_time' => 'integer',
        'cook_time' => 'integer',
        'servings' => 'integer',
    ];

    /**
     * Get the users who saved this recipe.
     */
    public function savedByUsers()
    {
        return $this->belongsToMany(User::class, 'saved_recipes');
    }

    /**
     * Get the saved recipe records for this recipe.
     */
    public function savedRecipes()
    {
        return $this->hasMany(SavedRecipe::class);
    }

    /**
     * Check if recipe is saved by a specific user.
     */
    public function isSavedByUser($userId)
    {
        return $this->savedByUsers()->where('user_id', $userId)->exists();
    }
}