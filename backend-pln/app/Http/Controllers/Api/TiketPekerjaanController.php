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
            'tiket_ids' => 'required|array|min:1',
            'tiket_ids.*' => 'required|integer|exists:tiket_pekerjaan,id',
        ]);

        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User tidak authenticated'
            ], 401);
        }

        $petugas = Petugas::query()
            ->select(['id', 'user_id', 'tim_id'])
            ->where('user_id', $user->id)
            ->first();

        if (!$petugas || !$petugas->tim_id) {
            return response()->json([
                'success' => false,
                'message' => 'Petugas belum memiliki tim.'
            ], 400);
        }

        $tiketIds = collect($request->tiket_ids)
            ->map(fn($id) => (int) $id)
            ->unique()
            ->values()
            ->all();

        DB::beginTransaction();

        try {
            $jumlahTiketTersedia = TiketPekerjaan::query()
                ->whereIn('id', $tiketIds)
                ->where('status', 'tersedia')
                ->count();

            if ($jumlahTiketTersedia !== count($tiketIds)) {
                DB::rollBack();

                return response()->json([
                    'success' => false,
                    'message' => 'Tiket sudah diambil petugas lain atau tidak tersedia lagi.'
                ], 422);
            }

            $updated = TiketPekerjaan::query()
                ->whereIn('id', $tiketIds)
                ->where('status', 'tersedia')
                ->update([
                    'status' => 'berjalan',
                    'tim_id' => $petugas->tim_id,
                    'updated_at' => now(),
                ]);

            if ($updated !== count($tiketIds)) {
                DB::rollBack();

                return response()->json([
                    'success' => false,
                    'message' => 'Gagal mengambil tiket. Silakan coba lagi.'
                ], 500);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Tiket berhasil diambil.',
                'data' => [
                    'tiket_ids' => $tiketIds,
                    'updated_count' => $updated,
                ],
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil tiket',
                'error' => $e->getMessage(),
            ], 500);
        }
    }


    public function pekerjaanAktif(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User tidak authenticated'
            ], 401);
        }

        $petugas = Petugas::query()
            ->select(['id', 'user_id', 'tim_id'])
            ->where('user_id', $user->id)
            ->first();

        if (!$petugas) {
            return response()->json([
                'success' => false,
                'message' => 'Petugas tidak ditemukan untuk user ini'
            ], 404);
        }

        if (!$petugas->tim_id) {
            return response()->json([
                'success' => false,
                'message' => 'Petugas tidak memiliki tim_id'
            ], 400);
        }

        $pekerjaan = TiketPekerjaan::query()
            ->select([
                'id',
                'aset_id',
                'nomor_tiket',
                'tanggal_tiket',
                'status',
                'tim_id',
                'updated_at',
            ])
            ->with([
                'aset:id,pelanggan_id,nomor_kwh,merek_kwh,tikor_baru',
                'aset.pelanggan:id,idpel,nama_pelanggan,alamat_pelanggan,tikor',
            ])
            ->where('tim_id', $petugas->tim_id)
            ->whereIn('status', ['berjalan', 'dikerjakan'])
            ->orderBy('updated_at', 'desc')
            ->limit(50)
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

        $perPage = (int) $request->query('per_page', 10);
        $perPage = $perPage > 20 ? 20 : $perPage;

        $riwayat = TiketPekerjaan::query()
            ->select([
                'id',
                'aset_id',
                'nomor_tiket',
                'tanggal_tiket',
                'status',
                'tim_id',
                'updated_at',
            ])
            ->with([
                'aset:id,pelanggan_id,nomor_kwh,merek_kwh,thtera_kwh',
                'aset.pelanggan:id,idpel,nama_pelanggan,alamat_pelanggan',
                'pekerjaan',
            ])
            ->where('tim_id', $petugas->tim_id)
            ->whereIn('status', ['inReview', 'menungguValidasi', 'selesai'])
            ->orderBy('updated_at', 'desc')
            ->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $riwayat->items(),
            'meta' => [
                'current_page' => $riwayat->currentPage(),
                'last_page' => $riwayat->lastPage(),
                'per_page' => $riwayat->perPage(),
                'total' => $riwayat->total(),
                'has_more' => $riwayat->hasMorePages(),
            ],
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
        $search = trim($request->query('search', ''));

        $perPage = (int) $request->query('per_page', 10);
        $perPage = $perPage > 25 ? 25 : $perPage;

        $allowedStatuses = [
            'berjalan',
            'dikerjakan',
            'inReview',
            'menungguValidasi',
            'selesai'
        ];

        if ($status !== 'semua' && !in_array($status, $allowedStatuses)) {
            return response()->json([
                'success' => false,
                'message' => 'Status tidak valid'
            ], 422);
        }

        /*
    |--------------------------------------------------------------------------
    | Base query untuk statistik dan pencarian
    |--------------------------------------------------------------------------
    */
        $baseQuery = TiketPekerjaan::query()
            ->whereIn('status', $allowedStatuses);

        if ($search !== '') {
            $baseQuery->where(function ($query) use ($search) {
                $query
                    ->where('nomor_tiket', 'like', "%{$search}%")
                    ->orWhere('status', 'like', "%{$search}%")
                    ->orWhereHas('aset.pelanggan', function ($q) use ($search) {
                        $q->where('nama_pelanggan', 'like', "%{$search}%")
                            ->orWhere('idpel', 'like', "%{$search}%")
                            ->orWhere('alamat_pelanggan', 'like', "%{$search}%");
                    })
                    ->orWhereHas('tim', function ($q) use ($search) {
                        $q->where('nama_tim', 'like', "%{$search}%");
                    })
                    ->orWhereHas('pekerjaan.petugas', function ($q) use ($search) {
                        $q->where('nama_petugas', 'like', "%{$search}%");
                    })
                    ->orWhereHas('pekerjaan', function ($q) use ($search) {
                        $q->where('rekomendasi', 'like', "%{$search}%")
                            ->orWhere('idpel', 'like', "%{$search}%");
                    });
            });
        }

        /*
    |--------------------------------------------------------------------------
    | Statistik status berdasarkan hasil search
    |--------------------------------------------------------------------------
    */
        $statusCountsRaw = (clone $baseQuery)
            ->select('status', DB::raw('COUNT(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status')
            ->toArray();

        $statusCounts = [
            'semua' => array_sum($statusCountsRaw),
            'berjalan' => (int) ($statusCountsRaw['berjalan'] ?? 0),
            'dikerjakan' => (int) ($statusCountsRaw['dikerjakan'] ?? 0),
            'inReview' => (int) ($statusCountsRaw['inReview'] ?? 0),
            'menungguValidasi' => (int) ($statusCountsRaw['menungguValidasi'] ?? 0),
            'selesai' => (int) ($statusCountsRaw['selesai'] ?? 0),
        ];

        $hariIniCount = (clone $baseQuery)
            ->whereDate('updated_at', now()->toDateString())
            ->count();

        /*
    |--------------------------------------------------------------------------
    | Query utama data pekerjaan manajer
    |--------------------------------------------------------------------------
    */
        $query = (clone $baseQuery)
            ->select([
                'id',
                'aset_id',
                'nomor_tiket',
                'tanggal_tiket',
                'status',
                'tim_id',
                'updated_at',
            ])
            ->with([
                'aset:id,pelanggan_id,nomor_kwh,merek_kwh,thtera_kwh',
                'aset.pelanggan:id,idpel,nama_pelanggan,alamat_pelanggan',
                'tim:id,nama_tim',
                'pekerjaan.petugas',
                'pekerjaan.tim',
            ])
            ->orderBy('updated_at', 'desc');

        if ($status !== 'semua') {
            $query->where('status', $status);
        }

        $data = $query->paginate($perPage);

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
                'total' => $statusCounts['semua'],
                'hari_ini' => $hariIniCount,
                'berjalan' => $statusCounts['berjalan'],
                'dikerjakan' => $statusCounts['dikerjakan'],
                'inReview' => $statusCounts['inReview'],
                'menungguValidasi' => $statusCounts['menungguValidasi'],
                'selesai' => $statusCounts['selesai'],
                'status_counts' => $statusCounts,
            ],
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
