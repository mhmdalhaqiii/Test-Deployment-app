<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pelanggan;
use Illuminate\Http\Request;

class PelangganController extends Controller
{
    public function index()
    {
        return Pelanggan::all();
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
