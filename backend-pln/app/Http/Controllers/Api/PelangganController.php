<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pelanggan;
use Illuminate\Http\Request;
use App\Models\AsetAppTr;

class PelangganController extends Controller
{
    public function index(Request $request)
    {
        $search = trim($request->query('search', ''));

        $perPage = (int) $request->query('per_page', 10);
        $perPage = $perPage > 25 ? 25 : $perPage;

        $query = Pelanggan::query()
            ->select([
                'id',
                'unitup',
                'idpel',
                'nama_pelanggan',
                'alamat_pelanggan',
                'tarif',
                'daya',
                'tikor',
                'created_at',
                'updated_at',
            ]);

        // KHUSUS UNTUK DROPDOWN TAMBAH ASET:
        // hanya tampilkan pelanggan yang belum punya aset
        if ($request->boolean('available_for_aset')) {
            $query->whereNotIn(
                'id',
                AsetAppTr::query()
                    ->select('pelanggan_id')
                    ->whereNotNull('pelanggan_id')
            );
        }

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('idpel', 'like', "%{$search}%")
                    ->orWhere('unitup', 'like', "%{$search}%")
                    ->orWhere('nama_pelanggan', 'like', "%{$search}%")
                    ->orWhere('alamat_pelanggan', 'like', "%{$search}%")
                    ->orWhere('tarif', 'like', "%{$search}%")
                    ->orWhere('daya', 'like', "%{$search}%")
                    ->orWhere('tikor', 'like', "%{$search}%");
            });
        }

        $data = $query
            ->orderBy('id', 'asc')
            ->paginate($perPage);

        $tarifOptions = Pelanggan::query()
            ->whereNotNull('tarif')
            ->where('tarif', '!=', '')
            ->distinct()
            ->orderBy('tarif')
            ->pluck('tarif')
            ->values();

        $unitupOptions = Pelanggan::query()
            ->whereNotNull('unitup')
            ->where('unitup', '!=', '')
            ->distinct()
            ->orderBy('unitup')
            ->pluck('unitup')
            ->values();

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
                'total_pelanggan' => Pelanggan::count(),
                'total_filter' => $data->total(),
            ],
            'filters' => [
                'tarif_options' => $tarifOptions,
                'unitup_options' => $unitupOptions,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'unitup'           => 'required',
            'idpel'            => 'required|unique:pelanggan,idpel',
            'nama_pelanggan'   => 'required',
            'alamat_pelanggan' => 'required',
            'tarif'            => 'required',
            'daya'             => 'required|integer',
            'tikor'            => 'nullable',
        ]);

        return Pelanggan::create($data);
    }

    public function show($id)
    {
        return Pelanggan::findOrFail($id);
    }

    public function update(Request $request, $id)
    {
        $pelanggan = Pelanggan::findOrFail($id);

        $data = $request->validate([
            'unitup'           => 'required',
            'nama_pelanggan'   => 'required',
            'alamat_pelanggan' => 'required',
            'tarif'            => 'required',
            'daya'             => 'required|integer',
            'tikor'            => 'nullable',
        ]);

        $pelanggan->update($data);
        return $pelanggan;
    }

    public function destroy($id)
    {
        Pelanggan::destroy($id);
        return response()->json([
            'message' => 'Pelanggan dihapus'
        ]);
    }
}
