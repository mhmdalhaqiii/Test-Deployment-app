<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TiketPekerjaan;
use App\Services\SpkSawService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SpkController extends Controller
{
    public function prioritas(Request $request, SpkSawService $service): JsonResponse
    {
        $tikets = TiketPekerjaan::with('aset.pelanggan')
        ->where('status', 'tersedia')
        ->get();

        $alternatif = $tikets->map(function ($tiket){
            return[
                'tiket_id' => $tiket->id,
                'nomor_tiket' => $tiket->nomor_tiket,
                'nama_pelanggan' => $tiket->aset->pelanggan->nama_pelanggan,
                'alamat_pelanggan' => $tiket->aset->pelanggan->alamat_pelanggan,
                'koordinat' => $tiket->aset->tikor_baru ?? $tiket->aset->pelanggan->tikor,

                'daya' => (float) $tiket->aset->pelanggan->daya,
                'selisih_tahun_tera' => $tiket->aset->selisih_tahun_tera,
                'jenis' => $tiket->aset->pelanggan->tarif_score,
            ];
        })->toArray();

        // 1. Hitung SAW menggunakan Service
        $hasil_semua = $service->hitung($alternatif);

        // 2. Hitung Jarak (Haversine) dan Filter Maksimal 5 km
        $latPetugas = $request->lat;
        $lngPetugas = $request->lng;

        if ($latPetugas && $lngPetugas) {
            foreach ($hasil_semua as &$hasil) {
                $koordinatAset = $hasil['koordinat'] ?? null;

                if ($koordinatAset) {
                    $pecahTikor = explode(',', $koordinatAset);

                    if (count($pecahTikor) >= 2) {
                        $latAset = (float) trim($pecahTikor[0]);
                        $lngAset = (float) trim($pecahTikor[1]);

                        // Panggil fungsi Haversine
                        $jarakKm = $this->hitungJarakHaversine($latPetugas, $lngPetugas, $latAset, $lngAset);
                        $hasil['jarak_km'] = round($jarakKm, 2);
                    } else {
                        $hasil['jarak_km'] = null; // Format koma salah
                    }
                } else {
                    $hasil['jarak_km'] = null; // Tidak punya koordinat
                }
            }

            // FILTER: Buang yang null dan buang yang jaraknya > 5 km
            $hasil_semua = array_filter($hasil_semua, function ($item) {
                return $item['jarak_km'] !== null && $item['jarak_km'] <= 5;
            });
        }

        // 3. Potong Data Jadi 10 Teratas
        $hasil_terbatas = array_slice($hasil_semua, 0, 10);
        $hasil_terbatas = array_values($hasil_terbatas);

        return response()->json([
            'success'    => true,
            'message'    => 'Berhasil mengambil prioritas pemeliharaan',
            'data'       => $hasil_terbatas
        ]);
    }

    /**
     * Rumus Matematika Haversine untuk jarak lurus (Kilometer)
     */
    private function hitungJarakHaversine(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        $earthRadius = 6371; // Radius bumi dalam kilometer

        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);

        $a = sin($dLat / 2) * sin($dLat / 2) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($dLon / 2) * sin($dLon / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
        $jarak = $earthRadius * $c;

        return $jarak;
    }
}
