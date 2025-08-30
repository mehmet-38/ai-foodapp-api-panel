<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Post extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'title',
        'description',
        'image_url',
        'likes_count',
    ];

    protected $casts = [
        'user_id' => 'integer',
        'likes_count' => 'integer',
    ];

    /**
     * Get the user that owns the post.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the users who liked this post.
     */
    public function likedByUsers()
    {
        return $this->belongsToMany(User::class, 'post_likes')
                    ->withTimestamps();
    }

    /**
     * Get the post likes for this post.
     */
    public function postLikes()
    {
        return $this->hasMany(PostLike::class);
    }

    /**
     * Check if post is liked by a specific user.
     */
    public function isLikedByUser($userId)
    {
        return $this->likedByUsers()->where('user_id', $userId)->exists();
    }

    /**
     * Increment likes count.
     */
    public function incrementLikes()
    {
        $this->increment('likes_count');
    }

    /**
     * Decrement likes count.
     */
    public function decrementLikes()
    {
        $this->decrement('likes_count');
    }
}