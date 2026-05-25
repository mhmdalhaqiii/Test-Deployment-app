<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\FotoPekerjaan;
use App\Models\PekerjaanPemeliharaan;
use App\Services\GoogleDriveService;

class FotoPekerjaanController extends Controller
{
    protected array $allowedFields = [
        'foto_arus_primer_r',
        'foto_arus_primer_s',
        'foto_arus_primer_t',

        'foto_tegangan_primer_r',
        'foto_tegangan_primer_s',
        'foto_tegangan_primer_t',

        'foto_arus_sekunder_r_ukur',
        'foto_arus_sekunder_s_ukur',
        'foto_arus_sekunder_t_ukur',

        'foto_arus_sekunder_r_meter',
        'foto_arus_sekunder_s_meter',
        'foto_arus_sekunder_t_meter',

        'foto_tegangan_kwh_r',
        'foto_tegangan_kwh_s',
        'foto_tegangan_kwh_t',
    ];

    public function upload(Request $request, GoogleDriveService $drive)
    {
        $request->validate([
            'pekerjaan_id' => 'required|exists:pekerjaan_pemeliharaan,id',
            'field'        => 'required|string',
            'file'         => 'required|image|max:15360',
        ]);

        if (!in_array($request->field, $this->allowedFields)) {
            return response()->json([
                'message' => 'Field foto tidak valid'
            ], 422);
        }

        $pekerjaan = PekerjaanPemeliharaan::with('tiket')
            ->findOrFail($request->pekerjaan_id);

        if ($pekerjaan->tiket->status !== 'dikerjakan') {
            return response()->json([
                'message' => 'Upload foto hanya diizinkan saat status dikerjakan'
            ], 403);
        }

        DB::beginTransaction();

        try {
            $file = $request->file('file');

            $fileName = $request->pekerjaan_id . '_' . $request->field . '_' . time() . '.' . $file->getClientOriginalExtension();

            $fileId = $drive->upload(
                $file,
                $fileName,
                config('google.folder_id')
            );

            $foto = FotoPekerjaan::firstOrCreate([
                'pekerjaan_id' => $request->pekerjaan_id,
            ]);

            $foto->update([
                $request->field => $fileId,
            ]);

            DB::commit();

            return response()->json([
                'success'   => true,
                'message'   => 'Foto berhasil diupload dan dikompresi',
                'file_id'   => $fileId,
                'field'     => $request->field
            ], 201);

        } catch (\Throwable $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Gagal upload foto',
                'error'   => $e->getMessage()
            ], 500);
        }
    }
}
