<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'firebase' => [
        'project_id' => env('FIREBASE_PROJECT_ID', 'aifoodapp-bedbd'),
        'credentials' => env('FIREBASE_CREDENTIALS'),
        'credentials_json' => env('FIREBASE_CREDENTIALS_JSON'),
        'credentials_base64' => env('FIREBASE_CREDENTIALS_BASE64'),
    ],

    'revenuecat' => [
        'secret_key' => env('REVENUECAT_SECRET_KEY'),
        'project_id' => env('REVENUECAT_PROJECT_ID'),
        'environment' => env('REVENUECAT_ENVIRONMENT', 'production'),
    ],

    'ga4' => [
        'property_id' => env('GA4_PROPERTY_ID'),
    ],

    'gemini' => [
        'project_id' => env('GEMINI_GCP_PROJECT_ID', env('FIREBASE_PROJECT_ID', 'aifoodapp-bedbd')),
        'input_token_price_per_1m' => env('GEMINI_INPUT_TOKEN_PRICE_PER_1M', 0),
        'output_token_price_per_1m' => env('GEMINI_OUTPUT_TOKEN_PRICE_PER_1M', 0),
    ],

];
