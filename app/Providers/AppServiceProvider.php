<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $compiledViewsPath = config('view.compiled');

        if (is_string($compiledViewsPath) && $compiledViewsPath !== '' && ! is_dir($compiledViewsPath)) {
            @mkdir($compiledViewsPath, 0775, true);
        }
    }
}
