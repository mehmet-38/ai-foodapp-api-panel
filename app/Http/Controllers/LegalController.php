<?php

namespace App\Http\Controllers;

use Inertia\Inertia;

class LegalController extends Controller
{
    public function privacyPolicy()
    {
        return Inertia::render('legal/privacy-policy', [
            'updatedAt' => now()->toDateString(),
        ]);
    }

    public function termsOfService()
    {
        return Inertia::render('legal/terms-of-service', [
            'updatedAt' => now()->toDateString(),
        ]);
    }
}
