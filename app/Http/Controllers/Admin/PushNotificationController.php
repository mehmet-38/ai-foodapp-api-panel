<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\Firebase\FirebaseService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use RuntimeException;

class PushNotificationController extends Controller
{
    public function __construct(private readonly FirebaseService $firebase)
    {
    }

    public function index()
    {
        $users = collect($this->firebase->listUsers())
            ->map(fn (array $user) => [
                'uid' => $user['uid'],
                'username' => $user['username'] ?: $user['name'],
                'email' => $user['email'],
            ])
            ->values()
            ->all();

        return Inertia::render('admin/push-notifications', [
            'users' => $users,
            'firebaseConfigured' => $this->firebase->isConfigured(),
            'pushConfigured' => $this->firebase->isPushNotificationConfigured(),
        ]);
    }

    public function send(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:100',
            'body' => 'required|string|max:500',
            'target' => 'required|array',
            'target.type' => 'required|in:all,topic,users',
            'target.topic' => 'required_if:target.type,topic|in:premium_users,free_users',
            'target.uids' => 'required_if:target.type,users|array|min:1',
            'target.uids.*' => 'string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $data = $validator->validated();
        $target = ['type' => $data['target']['type']];

        if ($data['target']['type'] === 'topic') {
            $target['topic'] = $data['target']['topic'];
        } elseif ($data['target']['type'] === 'users') {
            $target['uids'] = $data['target']['uids'];
        }

        try {
            $result = $this->firebase->sendPushNotification($data['title'], $data['body'], $target);
        } catch (RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 502);
        }

        return response()->json([
            'success' => true,
            'message' => 'Bildirim gönderildi.',
            'data' => $result,
        ]);
    }
}
