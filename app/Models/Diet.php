<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Diet extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'description',
    ];

    protected $casts = [
        'user_id' => 'integer',
    ];

    /**
     * Get the user that owns the diet.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}