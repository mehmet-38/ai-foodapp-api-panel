<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('posts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('title')->comment('Post başlığı');
            $table->text('description')->nullable()->comment('Post açıklaması');
            $table->string('image_url', 500)->nullable()->comment('Yemek görseli URL');
            $table->integer('likes_count')->default(0)->comment('Beğeni sayısı');
            $table->timestamps();
            
            $table->index('user_id', 'idx_user_id');
            $table->index('created_at', 'idx_created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('posts');
    }
};