<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasApiTokens;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'username',
        'email',
        'password',
        'height',
        'weight',
        'age',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'height' => 'float',
            'weight' => 'float',
            'age' => 'integer',
        ];
    }

    /**
     * Get the posts for the user.
     */
    public function posts()
    {
        return $this->hasMany(Post::class);
    }

    /**
     * Get the diets for the user.
     */
    public function diets()
    {
        return $this->hasMany(Diet::class);
    }

    /**
     * Get the saved recipes for the user.
     */
    public function savedRecipes()
    {
        return $this->belongsToMany(Recipe::class, 'saved_recipes')
                    ->withTimestamps();
    }

    /**
     * Get the liked posts for the user.
     */
    public function likedPosts()
    {
        return $this->belongsToMany(Post::class, 'post_likes')
                    ->withTimestamps();
    }

    /**
     * Get the post likes for the user.
     */
    public function postLikes()
    {
        return $this->hasMany(PostLike::class);
    }
}
