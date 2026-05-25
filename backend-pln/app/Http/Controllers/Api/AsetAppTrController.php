<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AsetAppTr;
use Illuminate\Http\Request;

class AsetAppTrController extends Controller
{
    public function index()
    {
        $asets = AsetAppTr::with('pelanggan', 'tiket')->get();

        $asets->map(function ($aset) {
            $cekSelesai = false;

            if ($aset->tiket) {
                $cekSelesai = $aset->tiket->contains('status', 'selesai');
            }

            $aset->status_pekerjaan = $cekSelesai ? 'selesai' : 'belum';

            return $aset;
        });

        return response()->json([
            'success' => true,
            'data'    => $asets
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
