# Laravel Food App API Documentation

## Overview

This documentation describes the REST API endpoints for the Laravel Food App. The API provides functionality for user authentication, recipe management, social posts, diet planning, and file uploads.

**Base URL:** `http://127.0.0.1:8000/api`

**Authentication:** Bearer Token (Laravel Sanctum)

---

## Table of Contents

1. [Authentication](#authentication)
2. [User Management](#user-management)
3. [Recipes](#recipes)
4. [File Uploads](#file-uploads)
5. [Diets](#diets)
6. [Social Posts](#social-posts)
7. [Error Responses](#error-responses)
8. [Headers](#headers)

---

## Authentication

### Register User
**POST** `/auth/register`

Create a new user account.

**Request Body:**
```json
{
  "username": "string (required, max:50, unique)",
  "email": "string (required, email, max:100, unique)",
  "password": "string (required, min:6)",
  "height": "float (optional, min:0)",
  "weight": "float (optional, min:0)",
  "age": "integer (optional, min:0, max:150)"
}
```

**Response (201):**
```json
{
  "message": "User registered successfully",
  "token": "bearer_token_string",
  "user": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "height": 175.5,
    "weight": 70.2,
    "age": 25
  }
}
```

---

### Login User
**POST** `/auth/login`

Authenticate user and get access token.

**Request Body:**
```json
{
  "email": "string (required, email)",
  "password": "string (required)"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "token": "bearer_token_string",
  "user": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com"
  }
}
```

---

### Get User Profile
**GET** `/auth/profile` 🔒

Get authenticated user's profile information.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "user": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "height": 175.5,
    "weight": 70.2,
    "age": 25,
    "created_at": "2025-08-30T15:30:00.000000Z"
  }
}
```

---

### Logout User
**POST** `/auth/logout` 🔒

Logout user and invalidate current token.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Logout successful"
}
```

---

## User Management

### Get User Profile
**GET** `/users/profile` 🔒

Get authenticated user's profile (same as auth/profile).

---

### Update User Profile
**PUT** `/users/profile` 🔒

Update user profile information.

**Request Body (any subset):**
```json
{
  "username": "string (optional, max:50, unique)",
  "email": "string (optional, email, max:100, unique)",
  "height": "float (optional, min:0)",
  "weight": "float (optional, min:0)",
  "age": "integer (optional, min:0, max:150)"
}
```

**Response (200):**
```json
{
  "message": "Profile updated successfully"
}
```

---

### Change Password
**PUT** `/users/change-password` 🔒

Change user password.

**Request Body:**
```json
{
  "currentPassword": "string (required)",
  "newPassword": "string (required, min:6)"
}
```

**Response (200):**
```json
{
  "message": "Password changed successfully"
}
```

---

### Get Saved Recipes
**GET** `/users/saved-recipes` 🔒

Get user's saved recipes.

**Response (200):**
```json
{
  "recipes": [
    {
      "id": 1,
      "name": "Pasta with Tomato Sauce",
      "description": "Simple and delicious pasta recipe",
      "ingredients": "pasta, tomatoes, garlic, olive oil",
      "instructions": "1. Cook pasta...",
      "image_url": "/api/images/recipe_123.jpg",
      "prep_time": 15,
      "cook_time": 20,
      "servings": 4,
      "created_at": "2025-08-30T15:30:00.000000Z"
    }
  ]
}
```

---

## Recipes

### Get All Recipes
**GET** `/recipes`

Get recipes with pagination and optional search.

**Query Parameters:**
- `limit` (optional, default: 10) - Number of recipes per page
- `offset` (optional, default: 0) - Number of recipes to skip
- `search` (optional) - Search in name, description, ingredients

**Example:** `/recipes?limit=20&offset=0&search=pasta`

**Response (200):**
```json
{
  "recipes": [
    {
      "id": 1,
      "name": "Pasta with Tomato Sauce",
      "description": "Simple and delicious pasta recipe",
      "ingredients": "pasta, tomatoes, garlic, olive oil",
      "instructions": "1. Cook pasta...",
      "image_url": "/api/images/recipe_123.jpg",
      "prep_time": 15,
      "cook_time": 20,
      "servings": 4,
      "created_at": "2025-08-30T15:30:00.000000Z"
    }
  ],
  "pagination": {
    "limit": 10,
    "offset": 0
  }
}
```

---

### Get Single Recipe
**GET** `/recipes/{id}`

Get a specific recipe by ID.

**Response (200):**
```json
{
  "recipe": {
    "id": 1,
    "name": "Pasta with Tomato Sauce",
    "description": "Simple and delicious pasta recipe",
    "ingredients": "pasta, tomatoes, garlic, olive oil",
    "instructions": "1. Cook pasta...",
    "image_url": "/api/images/recipe_123.jpg",
    "prep_time": 15,
    "cook_time": 20,
    "servings": 4,
    "created_at": "2025-08-30T15:30:00.000000Z",
    "updated_at": "2025-08-30T15:30:00.000000Z"
  }
}
```

---

### Create Recipe
**POST** `/recipes` 🔒

Create a new recipe.

**Request Body:**
```json
{
  "name": "string (required, max:100)",
  "description": "string (optional)",
  "ingredients": "string (required)",
  "instructions": "string (required)",
  "image_url": "string (optional, max:255)",
  "prep_time": "integer (optional, min:0)",
  "cook_time": "integer (optional, min:0)",
  "servings": "integer (optional, min:1)"
}
```

**Response (201):**
```json
{
  "message": "Recipe created successfully",
  "recipeId": 1
}
```

---

### Update Recipe
**PUT** `/recipes/{id}` 🔒

Update an existing recipe.

**Request Body (any subset):**
```json
{
  "name": "string (optional, max:100)",
  "description": "string (optional)",
  "ingredients": "string (optional)",
  "instructions": "string (optional)",
  "image_url": "string (optional, max:255)",
  "prep_time": "integer (optional, min:0)",
  "cook_time": "integer (optional, min:0)",
  "servings": "integer (optional, min:1)"
}
```

**Response (200):**
```json
{
  "message": "Recipe updated successfully"
}
```

---

### Delete Recipe
**DELETE** `/recipes/{id}` 🔒

Delete a recipe.

**Response (200):**
```json
{
  "message": "Recipe deleted successfully"
}
```

---

### Search Recipes by Ingredients
**POST** `/recipes/search`

Search recipes that contain specific ingredients.

**Query Parameters:**
- `limit` (optional, default: 10) - Number of recipes to return

**Request Body:**
```json
{
  "ingredients": ["tomato", "pasta", "garlic"]
}
```

**Response (200):**
```json
{
  "recipes": [
    {
      "id": 1,
      "name": "Pasta with Tomato Sauce",
      "description": "Simple and delicious pasta recipe",
      "ingredients": "pasta, tomatoes, garlic, olive oil",
      "instructions": "1. Cook pasta...",
      "image_url": "/api/images/recipe_123.jpg",
      "prep_time": 15,
      "cook_time": 20,
      "servings": 4,
      "created_at": "2025-08-30T15:30:00.000000Z"
    }
  ]
}
```

---

### Save Recipe
**POST** `/recipes/{recipeId}/save` 🔒

Save a recipe to user's favorites.

**Response (200):**
```json
{
  "message": "Recipe saved successfully"
}
```

---

### Unsave Recipe
**DELETE** `/recipes/{recipeId}/save` 🔒

Remove recipe from user's favorites.

**Response (200):**
```json
{
  "message": "Recipe removed from saved recipes"
}
```

---

### Update Recipe Image
**PUT** `/recipes/{id}/image` 🔒

Update recipe image URL.

**Request Body:**
```json
{
  "image_url": "string (required, max:255)"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Recipe image updated successfully",
  "data": {
    "recipeId": 1,
    "image_url": "/api/images/recipe_123.jpg"
  }
}
```

---

## File Uploads

### Upload Recipe Image
**POST** `/upload/recipe-image` 🔒

Upload an image file for recipes.

**Content-Type:** `multipart/form-data`

**Form Data:**
- `image` (file) - Image file (jpeg, png, jpg, gif, max: 2MB)

**Response (200):**
```json
{
  "success": true,
  "message": "Image uploaded successfully",
  "data": {
    "imageUrl": "/api/images/1693484400_abc123def.jpg",
    "filename": "1693484400_abc123def.jpg",
    "originalName": "my-recipe.jpg",
    "size": 1048576
  }
}
```

---

### Delete Recipe Image
**DELETE** `/upload/recipe-image/{filename}` 🔒

Delete an uploaded image file.

**Response (200):**
```json
{
  "success": true,
  "message": "Image deleted successfully"
}
```

---

### Serve Image
**GET** `/upload/images/{filename}` or **GET** `/images/{filename}`

Serve/display uploaded images.

**Response:** Binary image data with appropriate Content-Type header.

---

## Diets

### Get User Diets
**GET** `/diets` 🔒

Get all diets for authenticated user.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Mediterranean Diet",
      "description": "A heart-healthy eating plan...",
      "created_at": "2025-08-30T15:30:00.000000Z",
      "updated_at": "2025-08-30T15:30:00.000000Z"
    }
  ]
}
```

---

### Get Single Diet
**GET** `/diets/{id}` 🔒

Get a specific diet by ID (must belong to authenticated user).

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Mediterranean Diet",
    "description": "A heart-healthy eating plan...",
    "created_at": "2025-08-30T15:30:00.000000Z",
    "updated_at": "2025-08-30T15:30:00.000000Z"
  }
}
```

---

### Create Diet
**POST** `/diets` 🔒

Create a new diet plan.

**Request Body:**
```json
{
  "name": "string (required, max:255)",
  "description": "string (required)"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Diet created successfully",
  "data": {
    "id": 1
  }
}
```

---

### Update Diet
**PUT** `/diets/{id}` 🔒

Update an existing diet (must belong to authenticated user).

**Request Body (any subset):**
```json
{
  "name": "string (optional, max:255)",
  "description": "string (optional)"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Diet updated successfully"
}
```

---

### Delete Diet
**DELETE** `/diets/{id}` 🔒

Delete a diet (must belong to authenticated user).

**Response (200):**
```json
{
  "success": true,
  "message": "Diet deleted successfully"
}
```

---

## Social Posts

### Get Posts Feed
**GET** `/posts/feed` 🔒

Get posts from all users with like status for authenticated user.

**Query Parameters:**
- `limit` (optional, default: 10) - Number of posts per page
- `offset` (optional, default: 0) - Number of posts to skip

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "user_id": 2,
      "title": "My Amazing Pasta Recipe",
      "description": "Just made this delicious pasta...",
      "image_url": "/api/images/post_123.jpg",
      "username": "chef_mario",
      "email": "mario@example.com",
      "likes_count": 15,
      "is_liked_by_user": true,
      "created_at": "2025-08-30T15:30:00.000000Z"
    }
  ],
  "pagination": {
    "limit": 10,
    "offset": 0,
    "count": 50
  }
}
```

---

### Get My Posts
**GET** `/posts/my-posts` 🔒

Get posts created by authenticated user.

**Query Parameters:**
- `limit` (optional, default: 10) - Number of posts per page
- `offset` (optional, default: 0) - Number of posts to skip

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "user_id": 1,
      "title": "My Amazing Pasta Recipe",
      "description": "Just made this delicious pasta...",
      "image_url": "/api/images/post_123.jpg",
      "username": "testuser",
      "email": "test@example.com",
      "likes_count": 15,
      "is_liked_by_user": false,
      "created_at": "2025-08-30T15:30:00.000000Z"
    }
  ],
  "pagination": {
    "limit": 10,
    "offset": 0,
    "count": 5
  }
}
```

---

### Get Posts by User
**GET** `/posts/user/{userId}` 🔒

Get posts by a specific user.

**Query Parameters:**
- `limit` (optional, default: 10) - Number of posts per page
- `offset` (optional, default: 0) - Number of posts to skip

**Response:** Same format as feed, filtered by user.

---

### Get Single Post
**GET** `/posts/{id}` 🔒

Get a specific post by ID.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "user_id": 2,
    "title": "My Amazing Pasta Recipe",
    "description": "Just made this delicious pasta...",
    "image_url": "/api/images/post_123.jpg",
    "username": "chef_mario",
    "email": "mario@example.com",
    "likes_count": 15,
    "is_liked_by_user": true,
    "created_at": "2025-08-30T15:30:00.000000Z"
  }
}
```

---

### Create Post
**POST** `/posts` 🔒

Create a new post.

**Request Body:**
```json
{
  "title": "string (required, max:255)",
  "description": "string (optional)",
  "image_url": "string (optional, max:500)"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Post created successfully",
  "data": {
    "id": 1,
    "user_id": 1,
    "title": "My Amazing Pasta Recipe",
    "description": "Just made this delicious pasta...",
    "image_url": "/api/images/post_123.jpg",
    "username": "testuser",
    "email": "test@example.com",
    "likes_count": 0,
    "is_liked_by_user": false,
    "created_at": "2025-08-30T15:30:00.000000Z"
  }
}
```

---

### Update Post
**PUT** `/posts/{id}` 🔒

Update a post (must belong to authenticated user).

**Request Body (any subset):**
```json
{
  "title": "string (optional, max:255)",
  "description": "string (optional)",
  "image_url": "string (optional, max:500)"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Post updated successfully",
  "data": {
    "id": 1,
    "user_id": 1,
    "title": "Updated Post Title",
    "description": "Updated description...",
    "image_url": "/api/images/post_123.jpg",
    "username": "testuser",
    "email": "test@example.com",
    "likes_count": 15,
    "is_liked_by_user": false,
    "created_at": "2025-08-30T15:30:00.000000Z"
  }
}
```

---

### Delete Post
**DELETE** `/posts/{id}` 🔒

Delete a post (must belong to authenticated user).

**Response (200):**
```json
{
  "success": true,
  "message": "Post deleted successfully"
}
```

---

### Like Post
**POST** `/posts/{id}/like` 🔒

Like a post.

**Response (200):**
```json
{
  "success": true,
  "message": "Post liked successfully",
  "data": {
    "postId": 1,
    "likesCount": 16,
    "isLiked": true
  }
}
```

---

### Unlike Post
**DELETE** `/posts/{id}/like` 🔒

Remove like from a post.

**Response (200):**
```json
{
  "success": true,
  "message": "Post unliked successfully",
  "data": {
    "postId": 1,
    "likesCount": 15,
    "isLiked": false
  }
}
```

---

## Error Responses

### 401 Unauthorized
```json
{
  "message": "Unauthenticated."
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "This action is unauthorized."
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Resource not found"
}
```

### 422 Validation Error
```json
{
  "success": false,
  "message": "Validation error",
  "errors": {
    "email": ["The email has already been taken."],
    "password": ["The password must be at least 6 characters."]
  }
}
```

### 409 Conflict
```json
{
  "success": false,
  "message": "Resource already exists"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error",
  "error": "Error details..."
}
```

---

## Headers

### For JSON Requests
```
Content-Type: application/json
```

### For File Uploads
```
Content-Type: multipart/form-data
```

### For Protected Routes
```
Authorization: Bearer <your_access_token>
```

---

## Rate Limiting

No rate limiting is currently implemented, but it's recommended to implement it for production use.

---

## Notes

- 🔒 indicates protected routes that require authentication
- All timestamps are in ISO 8601 format (UTC)
- File uploads are limited to 2MB for images
- Supported image formats: jpeg, png, jpg, gif, webp
- Images are stored in `storage/app/public/uploads/recipes/`
- Image URLs are served via `/api/images/{filename}` endpoint

---

## Example Usage

### Register and Login Flow
```bash
# 1. Register
curl -X POST http://127.0.0.1:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"john_doe","email":"john@example.com","password":"password123"}'

# 2. Use the token from registration response
export TOKEN="your_bearer_token_here"

# 3. Get profile
curl -X GET http://127.0.0.1:8000/api/auth/profile \
  -H "Authorization: Bearer $TOKEN"
```

### Create and Save Recipe Flow
```bash
# 1. Create a recipe
curl -X POST http://127.0.0.1:8000/api/recipes \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Pasta Recipe","ingredients":"pasta, tomato","instructions":"Cook pasta..."}'

# 2. Save the recipe (use recipe ID from response)
curl -X POST http://127.0.0.1:8000/api/recipes/1/save \
  -H "Authorization: Bearer $TOKEN"
```