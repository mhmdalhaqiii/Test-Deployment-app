<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\PetugasController;
use App\Http\Controllers\Api\PelangganController;
use App\Http\Controllers\Api\AsetAppTrController;
use App\Http\Controllers\Api\TiketPekerjaanController;
use App\Http\Controllers\Api\PekerjaanPemeliharaanController;
use App\Http\Controllers\Api\FotoPekerjaanController;
use App\Http\Controllers\Api\SpkController;
use App\Http\Controllers\Api\ImportController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Api\PenggunaController;

/*
|--------------------------------------------------------------------------
| AUTH
|--------------------------------------------------------------------------
*/

Route::post('/login', [AuthController::class, 'login']);
Route::middleware('auth:sanctum')->post('/logout', [AuthController::class, 'logout']);


/*
|--------------------------------------------------------------------------
| ADMIN (SUPER)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
    Route::apiResource('petugas', PetugasController::class);
    Route::apiResource('pelanggan', PelangganController::class);
    Route::apiResource('aset', AsetAppTrController::class);
    Route::apiResource('pengguna', PenggunaController::class);

    Route::get('/admin/tiket', [TiketPekerjaanController::class, 'index']);
    Route::post('/admin/tiket', [TiketPekerjaanController::class, 'store']);
    Route::put('/admin/tiket/{id}', [TiketPekerjaanController::class, 'update']);
    Route::delete('/admin/tiket/{id}', [TiketPekerjaanController::class, 'destroy']);

    Route::get('/admin/pengguna', [PenggunaController::class, 'index']);
    Route::post('/admin/pengguna', [PenggunaController::class, 'store']);
    Route::put('/admin/pengguna/{id}', [PenggunaController::class, 'update']);
    Route::delete('/admin/pengguna/{id}', [PenggunaController::class, 'destroy']);

    Route::get('/admin/pekerjaan-review', [PekerjaanPemeliharaanController::class, 'adminReviewIndex']);
    Route::get('/admin/pekerjaan-review/{id}', [PekerjaanPemeliharaanController::class, 'adminReviewShow']);
    Route::put('/admin/pekerjaan-review/{id}', [PekerjaanPemeliharaanController::class, 'adminReviewUpdate']);

    Route::post('/pekerjaan/{id}/review-selesai', [PekerjaanPemeliharaanController::class, 'reviewSelesai']);

    Route::post('/import/pelanggan', [ImportController::class, 'pelanggan']);
    Route::post('/import/aset', [ImportController::class, 'aset']);
    Route::post('/import/tiket', [ImportController::class, 'tiket']);
});

/*
|--------------------------------------------------------------------------
| PETUGAS
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum', 'role:petugas'])->group(function () {
    Route::get('/tiket', [TiketPekerjaanController::class, 'index']);
    Route::get('/tiket-aktif-saya', [TiketPekerjaanController::class, 'pekerjaanAktif']);

    Route::get('/maps/aset-petugas', [AsetAppTrController::class, 'mapsPetugas']);

    Route::post('/tiket/ambil-pekerjaan', [TiketPekerjaanController::class, 'ambilPekerjaan']);
    Route::post('/tiket/{id}/mulai', [TiketPekerjaanController::class, 'mulaiDikerjakan']);
    Route::get('/riwayat-pekerjaan-saya', [TiketPekerjaanController::class, 'riwayatPekerjaan']);

    Route::post('/pekerjaan', [PekerjaanPemeliharaanController::class, 'store']);
    Route::get('/pekerjaan', [PekerjaanPemeliharaanController::class, 'index']);
    Route::get('/pekerjaan/{id}', [PekerjaanPemeliharaanController::class, 'show']);
    Route::post('/pekerjaan/draft', [PekerjaanPemeliharaanController::class, 'draft']);

    Route::post('/foto-pekerjaan/upload', [FotoPekerjaanController::class, 'upload']);
    Route::post('/pekerjaan/{id}/kirim-review', [PekerjaanPemeliharaanController::class, 'kirimReview']);
    Route::post('/tiket/{id}/batal', [TiketPekerjaanController::class, 'batalDikerjakan']);
});

/*
|--------------------------------------------------------------------------
| MANAJER
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum', 'role:manajer'])->group(function () {
    Route::get('/manajer/pekerjaan', [TiketPekerjaanController::class, 'manajerIndex']);
    Route::get('/manajer/pekerjaan/{id}', [TiketPekerjaanController::class, 'manajerShow']);
    Route::post('/manajer/pekerjaan/{id}/validasi', [TiketPekerjaanController::class, 'validasiManajer']);
});


/*
|--------------------------------------------------------------------------
| ADMIN & MANAJER
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum', 'role:admin,manajer'])->group(function () {
    Route::get('/dashboard/statistik', [DashboardController::class, 'statistik']);
    Route::post('/pekerjaan/{id}/selesai', [PekerjaanPemeliharaanController::class, 'selesai']);
});

/*
|--------------------------------------------------------------------------
| ADMIN & PETUGAS
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum', 'role:admin,petugas'])->group(function () {
    Route::get('/spk/prioritas', [SpkController::class, 'prioritas']);
    Route::get('/aset', [AsetAppTrController::class, 'index']);
    Route::get('/tiket/{id}', [TiketPekerjaanController::class, 'show']);
});
