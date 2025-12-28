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
        Schema::table('recipes', function (Blueprint $table) {
            // Unsplash Metadata
            $table->string('unsplash_photographer')->nullable();
            $table->string('unsplash_photographer_url')->nullable();
            $table->string('unsplash_download_location')->nullable();
            
            // Nutrition Data
            $table->integer('calories')->nullable();
            $table->float('protein')->nullable();
            $table->float('carbohydrates')->nullable();
            $table->float('fat')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('recipes', function (Blueprint $table) {
            $table->dropColumn([
                'unsplash_photographer', 
                'unsplash_photographer_url', 
                'unsplash_download_location',
                'calories',
                'protein',
                'carbohydrates',
                'fat'
            ]);
        });
    }
};
