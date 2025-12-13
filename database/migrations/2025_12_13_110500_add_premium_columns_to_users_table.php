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
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('is_premium')->default(false)->after('password');
            $table->foreignId('premium_package_id')->nullable()->after('is_premium')->constrained('premium_packages')->nullOnDelete();
            $table->timestamp('premium_until')->nullable()->after('premium_package_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['premium_package_id']);
            $table->dropColumn(['is_premium', 'premium_package_id', 'premium_until']);
        });
    }
};
