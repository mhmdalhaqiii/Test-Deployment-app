<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TiketPekerjaan;
use App\Models\Petugas;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TiketPekerjaanController extends Controller
{
    /**
     * Ambil semua tiket (untuk admin)
     */
    public function index()
    {
        $data = TiketPekerjaan::with([
            'aset.pelanggan',
            'tim',
            'pekerjaan.petugas',
            'pekerjaan.foto',
        ])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $data
        ]);
    }

    /**
     * Buat tiket baru (untuk admin)
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'aset_id' => 'required|exists:aset_app_tr,id',
            'nomor_tiket' => 'required|unique:tiket_pekerjaan,nomor_tiket',
            'tanggal_tiket' => 'required|date',
            'status' => 'required|in:tersedia,berjalan,dikerjakan,inReview,menungguValidasi,selesai',
            'tim_id' => 'nullable|exists:tim,id',
        ]);

        $tiket = TiketPekerjaan::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Tiket berhasil dibuat',
            'data' => $tiket->load([
                'aset.pelanggan',
                'tim',
                'pekerjaan.petugas',
                'pekerjaan.foto',
            ])
        ], 201);
    }

    public function ambilPekerjaan(Request $request)
    {
        $request->validate([
            'tiket_ids' => 'required|array',
            'tiket_ids.*' => 'exists:tiket_pekerjaan,id',
            'tim_id' => 'required|exists:tim,id',
        ]);

        // Cek apakah tiket sudah dalam status berjalan/selesai
        $tiketBermasalah = TiketPekerjaan::whereIn('id', $request->tiket_ids)
            ->whereNotIn('status', ['tersedia', null])
            ->count();

        if ($tiketBermasalah > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Tiket sudah dalam status berjalan/selesai.'
            ], 422);
        }

        // Update tiket
        $updated = TiketPekerjaan::whereIn('id', $request->tiket_ids)
            ->update([
                'status' => 'berjalan',
                'tim_id' => $request->tim_id
            ]);

        if ($updated === 0) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal update tiket - tidak ada record yang diupdate'
            ], 500);
        }

        // Return data tiket yang sudah diupdate
        $tiketTerupdate = TiketPekerjaan::whereIn('id', $request->tiket_ids)
            ->with('aset')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Berhasil mengambil ' . count($request->tiket_ids) . ' tiket',
            'data' => $tiketTerupdate
        ]);
    }


    public function pekerjaanAktif(Request $request)
    {
        $user = $request->user();

        // Validasi user ada
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User tidak authenticated'
            ], 401);
        }

        // Query Petugas berdasarkan user_id
        $petugas = Petugas::where('user_id', $user->id)->first();

        if (!$petugas) {
            return response()->json([
                'success' => false,
                'message' => 'Petugas tidak ditemukan untuk user ini'
            ], 404);
        }

        // Validasi petugas punya tim_id
        if (!$petugas->tim_id) {
            return response()->json([
                'success' => false,
                'message' => 'Petugas tidak memiliki tim_id'
            ], 400);
        }

        $pekerjaan = TiketPekerjaan::with('aset.pelanggan')
            ->where('tim_id', $petugas->tim_id)
            ->whereIn('status', ['berjalan', 'dikerjakan'])
            ->get();

        return response()->json([
            'success' => true,
            'data' => $pekerjaan
        ]);
    }

    /**
     * Ambil riwayat pekerjaan (status: selesai)
     */
    public function riwayatPekerjaan(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated'
            ], 401);
        }

        $petugas = Petugas::where('user_id', $user->id)->first();

        if (!$petugas || !$petugas->tim_id) {
            return response()->json([
                'success' => false,
                'message' => 'Data tim tidak ditemukan'
            ], 400);
        }

        $riwayat = TiketPekerjaan::with(['aset.pelanggan', 'pekerjaan'])
            ->where('tim_id', $petugas->tim_id)
            ->whereIn('status', ['inReview', 'menungguValidasi', 'selesai'])
            ->orderBy('updated_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $riwayat
        ]);
    }

    /**
     * Petugas mulai mengerjakan tiket
     */
    public function mulaiDikerjakan($id)
    {
        $tiket = TiketPekerjaan::findOrFail($id);

        if ($tiket->status !== 'berjalan') {
            return response()->json([
                'success' => false,
                'message' => 'Tiket ini belum diambil (berjalan) atau sudah selesai.'
            ], 422);
        }

        $tiket->update([
            'status' => 'dikerjakan'
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Petugas telah sampai. Status tiket sekarang "dikerjakan", siap isi form ceklis.'
        ]);
    }

    /**
     * Tampilkan detail tiket
     */
    public function show($id)
    {
        return TiketPekerjaan::with(['aset.pelanggan', 'pekerjaan.foto'])->findOrFail($id);
    }

    public function update(Request $request, $id)
    {
        $tiket = TiketPekerjaan::findOrFail($id);

        $data = $request->validate([
            'aset_id' => 'required|exists:aset_app_tr,id',
            'nomor_tiket' => 'required|unique:tiket_pekerjaan,nomor_tiket,' . $id,
            'tanggal_tiket' => 'required|date',
            'status' => 'required|in:tersedia,berjalan,dikerjakan,inReview,menungguValidasi,selesai',
            'tim_id' => 'nullable|exists:tim,id',
        ]);

        $tiket->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Tiket berhasil diperbarui',
            'data' => $tiket->fresh([
                'aset.pelanggan',
                'tim',
                'pekerjaan.petugas',
                'pekerjaan.foto',
            ])
        ]);
    }

    /**
     * Hapus tiket (admin only)
     */
    public function destroy($id)
    {
        TiketPekerjaan::destroy($id);
        return response()->json(['message' => 'Tiket dihapus']);
    }

    public function batalDikerjakan($id)
    {
        $tiket = TiketPekerjaan::find($id);

        if (!$tiket) {
            return response()->json(['success' => false, 'message' => 'Tiket tidak ditemukan'], 404);
        }

        // Kembalikan statusnya ke berjalan
        $tiket->status = 'berjalan';
        $tiket->save();

        return response()->json([
            'success' => true,
            'message' => 'Pekerjaan dibatalkan, status kembali berjalan.'
        ]);
    }

    public function manajerIndex(Request $request)
    {
        $status = $request->query('status', 'semua');

        $allowedStatuses = [
            'berjalan',
            'dikerjakan',
            'inReview',
            'menungguValidasi',
            'selesai'
        ];

        $query = TiketPekerjaan::with([
            'aset.pelanggan',
            'tim',
            'pekerjaan.petugas',
            'pekerjaan.tim',
            'pekerjaan.foto',
        ])
            ->whereIn('status', $allowedStatuses)
            ->orderBy('updated_at', 'desc');

        if ($status !== 'semua') {
            if (!in_array($status, $allowedStatuses)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Status tidak valid'
                ], 422);
            }

            $query->where('status', $status);
        }

        $data = $query->get();

        return response()->json([
            'success' => true,
            'data' => $data
        ]);
    }

    public function manajerShow($id)
    {
        $allowedStatuses = [
            'berjalan',
            'dikerjakan',
            'inReview',
            'menungguValidasi',
            'selesai'
        ];

        $tiket = TiketPekerjaan::with([
            'aset.pelanggan',
            'tim',
            'pekerjaan.petugas',
            'pekerjaan.tim',
            'pekerjaan.foto',
        ])
            ->whereIn('status', $allowedStatuses)
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $tiket
        ]);
    }

    public function validasiManajer($id)
    {
        DB::beginTransaction();

        try {
            $tiket = TiketPekerjaan::with([
                'aset.pelanggan',
                'tim',
                'pekerjaan.petugas',
                'pekerjaan.tim',
                'pekerjaan.foto',
            ])->findOrFail($id);

            if ($tiket->status !== 'menungguValidasi') {
                return response()->json([
                    'success' => false,
                    'message' => 'Tiket belum berada pada tahap validasi manajer'
                ], 422);
            }

            if (!$tiket->pekerjaan) {
                return response()->json([
                    'success' => false,
                    'message' => 'Data laporan pekerjaan belum ditemukan'
                ], 422);
            }

            $tiket->update([
                'status' => 'selesai'
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Pekerjaan berhasil divalidasi dan dinyatakan selesai',
                'data' => $tiket->fresh([
                    'aset.pelanggan',
                    'tim',
                    'pekerjaan.petugas',
                    'pekerjaan.tim',
                    'pekerjaan.foto',
                ])
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Gagal memvalidasi pekerjaan',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
