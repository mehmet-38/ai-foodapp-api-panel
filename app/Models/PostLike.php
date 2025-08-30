<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PostLike extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'post_id',
    ];

    protected $casts = [
        'user_id' => 'integer',
        'post_id' => 'integer',
    ];

    // Disable updated_at since we only have created_at
    const UPDATED_AT = null;

    /**
     * Get the user that liked the post.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the post that was liked.
     */
    public function post()
    {
        return $this->belongsTo(Post::class);
    }
}