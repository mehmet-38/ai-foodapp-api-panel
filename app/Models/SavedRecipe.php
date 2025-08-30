<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SavedRecipe extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'recipe_id',
    ];

    protected $casts = [
        'user_id' => 'integer',
        'recipe_id' => 'integer',
    ];

    // Disable updated_at since we only have created_at
    const UPDATED_AT = null;

    /**
     * Get the user that saved the recipe.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the recipe that was saved.
     */
    public function recipe()
    {
        return $this->belongsTo(Recipe::class);
    }
}