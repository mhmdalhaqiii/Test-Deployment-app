<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\GoogleOAuthController;

Route::get('/google/auth', [GoogleOAuthController::class, 'redirect']);
Route::get('/google/callback', [GoogleOAuthController::class, 'callback']);

Route::get('/', function () {
    return view('welcome');
});
