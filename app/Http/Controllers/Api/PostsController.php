<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Post;
use App\Models\PostLike;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class PostsController extends Controller
{
    /**
     * Get posts feed
     * GET /api/posts/feed
     */
    public function feed(Request $request)
    {
        $user = $request->user();
        $limit = $request->query('limit', 10);
        $offset = $request->query('offset', 0);

        $posts = Post::with('user')
            ->select([
                'posts.id', 'posts.user_id', 'posts.title', 'posts.description', 
                'posts.image_url', 'posts.likes_count', 'posts.created_at'
            ])
            ->leftJoin('post_likes', function ($join) use ($user) {
                $join->on('posts.id', '=', 'post_likes.post_id')
                     ->where('post_likes.user_id', '=', $user->id);
            })
            ->addSelect(DB::raw('CASE WHEN post_likes.id IS NOT NULL THEN 1 ELSE 0 END as is_liked_by_user'))
            ->offset($offset)
            ->limit($limit)
            ->orderBy('posts.created_at', 'desc')
            ->get()
            ->map(function ($post) {
                return [
                    'id' => $post->id,
                    'user_id' => $post->user_id,
                    'title' => $post->title,
                    'description' => $post->description,
                    'image_url' => $post->image_url,
                    'username' => $post->user->username,
                    'email' => $post->user->email,
                    'likes_count' => $post->likes_count,
                    'is_liked_by_user' => (bool) $post->is_liked_by_user,
                    'created_at' => $post->created_at,
                ];
            });

        $count = Post::count();

        return response()->json([
            'success' => true,
            'data' => $posts,
            'pagination' => [
                'limit' => $limit,
                'offset' => $offset,
                'count' => $count
            ]
        ]);
    }

    /**
     * Get user's own posts
     * GET /api/posts/my-posts
     */
    public function myPosts(Request $request)
    {
        $user = $request->user();
        $limit = $request->query('limit', 10);
        $offset = $request->query('offset', 0);

        $posts = Post::where('posts.user_id', $user->id)
            ->select([
                'id', 'user_id', 'title', 'description', 
                'image_url', 'likes_count', 'created_at'
            ])
            ->offset($offset)
            ->limit($limit)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($post) use ($user) {
                return [
                    'id' => $post->id,
                    'user_id' => $post->user_id,
                    'title' => $post->title,
                    'description' => $post->description,
                    'image_url' => $post->image_url,
                    'username' => $user->username,
                    'email' => $user->email,
                    'likes_count' => $post->likes_count,
                    'is_liked_by_user' => false, // Not needed for own posts
                    'created_at' => $post->created_at,
                ];
            });

        $count = Post::where('posts.user_id', $user->id)->count();

        return response()->json([
            'success' => true,
            'data' => $posts,
            'pagination' => [
                'limit' => $limit,
                'offset' => $offset,
                'count' => $count
            ]
        ]);
    }

    /**
     * Get posts by specific user
     * GET /api/posts/user/:userId
     */
    public function userPosts(Request $request, $userId)
    {
        $currentUser = $request->user();
        $limit = $request->query('limit', 10);
        $offset = $request->query('offset', 0);

        $posts = Post::with('user')
            ->where('posts.user_id', $userId)
            ->select([
                'posts.id', 'posts.user_id', 'posts.title', 'posts.description', 
                'posts.image_url', 'posts.likes_count', 'posts.created_at'
            ])
            ->leftJoin('post_likes', function ($join) use ($currentUser) {
                $join->on('posts.id', '=', 'post_likes.post_id')
                     ->where('post_likes.user_id', '=', $currentUser->id);
            })
            ->addSelect(DB::raw('CASE WHEN post_likes.id IS NOT NULL THEN 1 ELSE 0 END as is_liked_by_user'))
            ->offset($offset)
            ->limit($limit)
            ->orderBy('posts.created_at', 'desc')
            ->get()
            ->map(function ($post) {
                return [
                    'id' => $post->id,
                    'user_id' => $post->user_id,
                    'title' => $post->title,
                    'description' => $post->description,
                    'image_url' => $post->image_url,
                    'username' => $post->user->username,
                    'email' => $post->user->email,
                    'likes_count' => $post->likes_count,
                    'is_liked_by_user' => (bool) $post->is_liked_by_user,
                    'created_at' => $post->created_at,
                ];
            });

        $count = Post::where('posts.user_id', $userId)->count();

        return response()->json([
            'success' => true,
            'data' => $posts,
            'pagination' => [
                'limit' => $limit,
                'offset' => $offset,
                'count' => $count
            ]
        ]);
    }

    /**
     * Get a specific post
     * GET /api/posts/:id
     */
    public function show(Request $request, $id)
    {
        $user = $request->user();
        
        $post = Post::with('user')
            ->where('id', $id)
            ->first();

        if (!$post) {
            return response()->json([
                'success' => false,
                'message' => 'Post not found'
            ], 404);
        }

        $isLiked = PostLike::where('user_id', $user->id)
            ->where('post_id', $id)
            ->exists();

        $postData = [
            'id' => $post->id,
            'user_id' => $post->user_id,
            'title' => $post->title,
            'description' => $post->description,
            'image_url' => $post->image_url,
            'username' => $post->user->username,
            'email' => $post->user->email,
            'likes_count' => $post->likes_count,
            'is_liked_by_user' => $isLiked,
            'created_at' => $post->created_at,
        ];

        return response()->json([
            'success' => true,
            'data' => $postData
        ]);
    }

    /**
     * Create a new post
     * POST /api/posts
     */
    public function store(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'image_url' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $post = Post::create([
            'user_id' => $user->id,
            'title' => $request->title,
            'description' => $request->description,
            'image_url' => $request->image_url,
            'likes_count' => 0,
        ]);

        $postData = [
            'id' => $post->id,
            'user_id' => $post->user_id,
            'title' => $post->title,
            'description' => $post->description,
            'image_url' => $post->image_url,
            'username' => $user->username,
            'email' => $user->email,
            'likes_count' => $post->likes_count,
            'is_liked_by_user' => false,
            'created_at' => $post->created_at,
        ];

        return response()->json([
            'success' => true,
            'message' => 'Post created successfully',
            'data' => $postData
        ], 201);
    }

    /**
     * Update a post
     * PUT /api/posts/:id
     */
    public function update(Request $request, $id)
    {
        $user = $request->user();
        
        $post = Post::where('id', $id)
            ->where('user_id', $user->id)
            ->first();

        if (!$post) {
            return response()->json([
                'success' => false,
                'message' => 'Post not found or unauthorized'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|string|max:255',
            'description' => 'sometimes|nullable|string',
            'image_url' => 'sometimes|nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $post->update($request->only(['title', 'description', 'image_url']));

        $postData = [
            'id' => $post->id,
            'user_id' => $post->user_id,
            'title' => $post->title,
            'description' => $post->description,
            'image_url' => $post->image_url,
            'username' => $user->username,
            'email' => $user->email,
            'likes_count' => $post->likes_count,
            'is_liked_by_user' => false,
            'created_at' => $post->created_at,
        ];

        return response()->json([
            'success' => true,
            'message' => 'Post updated successfully',
            'data' => $postData
        ]);
    }

    /**
     * Delete a post
     * DELETE /api/posts/:id
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        
        $post = Post::where('id', $id)
            ->where('user_id', $user->id)
            ->first();

        if (!$post) {
            return response()->json([
                'success' => false,
                'message' => 'Post not found or unauthorized'
            ], 404);
        }

        $post->delete();

        return response()->json([
            'success' => true,
            'message' => 'Post deleted successfully'
        ]);
    }

    /**
     * Like a post
     * POST /api/posts/:id/like
     */
    public function likePost(Request $request, $id)
    {
        $user = $request->user();
        
        $post = Post::find($id);
        if (!$post) {
            return response()->json([
                'success' => false,
                'message' => 'Post not found'
            ], 404);
        }

        try {
            PostLike::create([
                'user_id' => $user->id,
                'post_id' => $id
            ]);

            $post->incrementLikes();

            return response()->json([
                'success' => true,
                'message' => 'Post liked successfully',
                'data' => [
                    'postId' => $post->id,
                    'likesCount' => $post->fresh()->likes_count,
                    'isLiked' => true
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Post already liked'
            ], 409);
        }
    }

    /**
     * Unlike a post
     * DELETE /api/posts/:id/like
     */
    public function unlikePost(Request $request, $id)
    {
        $user = $request->user();
        
        $post = Post::find($id);
        if (!$post) {
            return response()->json([
                'success' => false,
                'message' => 'Post not found'
            ], 404);
        }

        $like = PostLike::where('user_id', $user->id)
            ->where('post_id', $id)
            ->first();

        if (!$like) {
            return response()->json([
                'success' => false,
                'message' => 'Post not liked by user'
            ], 404);
        }

        $like->delete();
        $post->decrementLikes();

        return response()->json([
            'success' => true,
            'message' => 'Post unliked successfully',
            'data' => [
                'postId' => $post->id,
                'likesCount' => $post->fresh()->likes_count,
                'isLiked' => false
            ]
        ]);
    }
}