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
        $request->validate([
            'lat' => 'required|numeric',
            'lng' => 'required|numeric',
            'radius' => 'nullable|numeric|min:0.1|max:50',
            'limit' => 'nullable|integer|min:1|max:50',
        ]);

        $latPetugas = (float) $request->lat;
        $lngPetugas = (float) $request->lng;

        $radiusKm = (float) $request->query('radius', 5);
        $limit = (int) $request->query('limit', 10);

        /*
        |--------------------------------------------------------------------------
        | Ambil data secukupnya saja
        |--------------------------------------------------------------------------
        | Jangan ambil semua kolom. Ambil hanya kolom yang dibutuhkan SPK.
        */
        $tikets = TiketPekerjaan::query()
            ->select([
                'id',
                'aset_id',
                'nomor_tiket',
                'status',
            ])
            ->where('status', 'tersedia')
            ->where(function ($query) {
                $query
                    ->whereHas('aset', function ($q) {
                        $q->whereNotNull('tikor_baru');
                    })
                    ->orWhereHas('aset.pelanggan', function ($q) {
                        $q->whereNotNull('tikor');
                    });
            })
            ->with([
                'aset:id,pelanggan_id,tikor_baru,thtera_kwh',
                'aset.pelanggan:id,idpel,nama_pelanggan,alamat_pelanggan,daya,tarif,tikor',
            ])
            ->get();

        $alternatif = [];

        foreach ($tikets as $tiket) {
            $aset = $tiket->aset;
            $pelanggan = $aset?->pelanggan;

            if (!$aset || !$pelanggan) {
                continue;
            }

            $koordinat = $aset->tikor_baru ?: $pelanggan->tikor;
            $coords = $this->parseKoordinat($koordinat);

            if (!$coords) {
                continue;
            }

            [$latAset, $lngAset] = $coords;

            $jarakKm = $this->hitungJarakHaversine(
                $latPetugas,
                $lngPetugas,
                $latAset,
                $lngAset
            );

            if ($jarakKm > $radiusKm) {
                continue;
            }

            $alternatif[] = [
                'tiket_id' => $tiket->id,
                'nomor_tiket' => $tiket->nomor_tiket,

                'nama_pelanggan' => $pelanggan->nama_pelanggan,
                'alamat_pelanggan' => $pelanggan->alamat_pelanggan,
                'koordinat' => $koordinat,

                'daya' => (float) $pelanggan->daya,
                'selisih_tahun_tera' => $aset->selisih_tahun_tera,
                'jenis' => $pelanggan->tarif_score,

                'jarak_km' => round($jarakKm, 2),
            ];
        }

        if (empty($alternatif)) {
            return response()->json([
                'success' => true,
                'message' => 'Tidak ada tiket tersedia di sekitar area ini.',
                'data' => [],
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | Hitung SAW hanya untuk kandidat dalam radius
        |--------------------------------------------------------------------------
        */
        $hasil = $service->hitung($alternatif);

        $hasilTerbatas = array_slice($hasil, 0, $limit);
        $hasilTerbatas = array_values($hasilTerbatas);

        return response()->json([
            'success' => true,
            'message' => 'Berhasil mengambil prioritas pemeliharaan',
            'data' => $hasilTerbatas,
        ]);
    }

    private function parseKoordinat(?string $koordinat): ?array
    {
        if (!$koordinat || !str_contains($koordinat, ',')) {
            return null;
        }

        $pecah = explode(',', $koordinat);

        if (count($pecah) < 2) {
            return null;
        }

        $lat = (float) trim($pecah[0]);
        $lng = (float) trim($pecah[1]);

        if (!$lat || !$lng) {
            return null;
        }

        return [$lat, $lng];
    }

    private function hitungJarakHaversine(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        $earthRadius = 6371;

        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);

        $a = sin($dLat / 2) * sin($dLat / 2) +
            cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
            sin($dLon / 2) * sin($dLon / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }
}
