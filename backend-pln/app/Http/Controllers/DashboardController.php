<?php

namespace App\Http\Controllers;
use App\Models\TiketPekerjaan;
use App\Models\PekerjaanPemeliharaan;

use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function statistik()
    {
        return [ 'tiket' =>
        [ 'tersedia' => TiketPekerjaan::where('status', 'tersedia')->count(),
        'dikerjakan' => TiketPekerjaan::where('status', 'dikerjakan')->count(),
        'inReview' => TiketPekerjaan::where('status', 'inReview')->count(),
        'selesai' => TiketPekerjaan::where('status', 'selesai')->count(), ],
        'pekerjaan_selesai' => PekerjaanPemeliharaan::count()
        ];
    }
}
