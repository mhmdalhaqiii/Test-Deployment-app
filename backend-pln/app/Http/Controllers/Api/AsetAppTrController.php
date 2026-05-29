<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AsetAppTr;
use Illuminate\Http\Request;

class AsetAppTrController extends Controller
{
    public function index(Request $request)
    {
        $search = trim($request->query('search', ''));

        $perPage = (int) $request->query('per_page', 10);
        $perPage = $perPage > 25 ? 25 : $perPage;

        $query = AsetAppTr::query()
            ->select([
                'id',
                'pelanggan_id',
                'nomor_kwh',
                'merek_kwh',
                'thtera_kwh',
                'faktor_kali_dil',
                'tikor_baru',
                'created_at',
                'updated_at',
            ])
            ->with([
                'pelanggan:id,unitup,idpel,nama_pelanggan,alamat_pelanggan,tarif,daya,tikor',
            ])
            ->withExists([
                'tiket as sudah_selesai' => function ($query) {
                    $query->where('status', 'selesai');
                },
            ]);

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('nomor_kwh', 'like', "%{$search}%")
                    ->orWhere('merek_kwh', 'like', "%{$search}%")
                    ->orWhere('thtera_kwh', 'like', "%{$search}%")
                    ->orWhere('faktor_kali_dil', 'like', "%{$search}%")
                    ->orWhere('tikor_baru', 'like', "%{$search}%")
                    ->orWhereHas('pelanggan', function ($pelangganQuery) use ($search) {
                        $pelangganQuery
                            ->where('idpel', 'like', "%{$search}%")
                            ->orWhere('unitup', 'like', "%{$search}%")
                            ->orWhere('nama_pelanggan', 'like', "%{$search}%")
                            ->orWhere('alamat_pelanggan', 'like', "%{$search}%")
                            ->orWhere('tarif', 'like', "%{$search}%")
                            ->orWhere('daya', 'like', "%{$search}%")
                            ->orWhere('tikor', 'like', "%{$search}%");
                    });
            });
        }

        $data = $query
            ->orderBy('id', 'asc')
            ->paginate($perPage);

        $data->getCollection()->transform(function ($aset) {
            $aset->status_pekerjaan = $aset->sudah_selesai ? 'selesai' : 'belum';
            return $aset;
        });

        return response()->json([
            'success' => true,
            'data' => $data->items(),
            'meta' => [
                'current_page' => $data->currentPage(),
                'last_page' => $data->lastPage(),
                'per_page' => $data->perPage(),
                'total' => $data->total(),
                'has_more' => $data->hasMorePages(),
            ],
            'statistik' => [
                'total_aset' => AsetAppTr::count(),
                'total_filter' => $data->total(),
            ],
        ]);
    }

    public function mapsPetugas(Request $request)
    {
        $minLat = (float) $request->query('minLat');
        $maxLat = (float) $request->query('maxLat');
        $minLng = (float) $request->query('minLng');
        $maxLng = (float) $request->query('maxLng');

        $limit = (int) $request->query('limit', 200);
        $limit = $limit > 300 ? 300 : $limit;

        if (!$minLat || !$maxLat || !$minLng || !$maxLng) {
            return response()->json([
                'success' => true,
                'data' => [],
            ]);
        }

        $asets = AsetAppTr::query()
            ->select([
                'id',
                'pelanggan_id',
                'nomor_kwh',
                'merek_kwh',
                'thtera_kwh',
                'tikor_baru',
            ])
            ->with([
                'pelanggan:id,idpel,nama_pelanggan,alamat_pelanggan,tikor',
            ])
            ->withExists([
                'tiket as sudah_selesai' => function ($query) {
                    $query->where('status', 'selesai');
                },
            ])
            ->where(function ($query) {
                $query
                    ->whereNotNull('tikor_baru')
                    ->orWhereHas('pelanggan', function ($q) {
                        $q->whereNotNull('tikor');
                    });
            })
            ->get();

        $data = [];

        foreach ($asets as $aset) {
            $tikor = $aset->tikor_baru ?: optional($aset->pelanggan)->tikor;

            if (!$tikor || !str_contains($tikor, ',')) {
                continue;
            }

            $parts = explode(',', $tikor);

            if (count($parts) !== 2) {
                continue;
            }

            $lat = (float) trim($parts[0]);
            $lng = (float) trim($parts[1]);

            if (!$lat || !$lng) {
                continue;
            }

            if (
                $lat < $minLat ||
                $lat > $maxLat ||
                $lng < $minLng ||
                $lng > $maxLng
            ) {
                continue;
            }

            $data[] = [
                'id' => $aset->id,
                'nomor_kwh' => $aset->nomor_kwh,
                'merek_kwh' => $aset->merek_kwh,
                'thtera_kwh' => $aset->thtera_kwh,
                'lat' => $lat,
                'lng' => $lng,
                'status_pekerjaan' => $aset->sudah_selesai ? 'selesai' : 'belum',
                'pelanggan' => [
                    'idpel' => $aset->pelanggan?->idpel,
                    'nama_pelanggan' => $aset->pelanggan?->nama_pelanggan,
                    'alamat_pelanggan' => $aset->pelanggan?->alamat_pelanggan,
                ],
            ];

            if (count($data) >= $limit) {
                break;
            }
        }

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }


    public function store(Request $request)
    {
        $data = $request->validate([
            'pelanggan_id' => 'required|exists:pelanggan,id',
            'nomor_kwh' => 'required',
            'merek_kwh' => 'required',
            'thtera_kwh' => 'required|digits:4',
            'faktor_kali_dil' => 'required|numeric',
            'tikor_baru' => 'nullable',
        ]);

        return AsetAppTr::create($data);
    }

    public function show($id)
    {
        return AsetAppTr::with('pelanggan')->findOrFail($id);
    }

    public function update(Request $request, $id)
    {
        $aset = AsetAppTr::findOrFail($id);

        $data = $request->validate([
            'nomor_kwh' => 'required',
            'merek_kwh' => 'required',
            'thtera_kwh' => 'required|digits:4',
            'faktor_kali_dil' => 'required|numeric',
            'tikor_baru' => 'nullable',
        ]);

        $aset->update($data);
        return $aset;
    }

    public function destroy($id)
    {
        AsetAppTr::destroy($id);
        return response()->json(['message' => 'Aset APP TR dihapus']);
    }
}
