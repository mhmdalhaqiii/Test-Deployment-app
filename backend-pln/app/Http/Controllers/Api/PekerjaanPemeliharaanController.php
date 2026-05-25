<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PekerjaanPemeliharaan;
use App\Models\TiketPekerjaan;
use App\Services\PerhitunganPekerjaanService;
use App\Models\Petugas;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PekerjaanPemeliharaanController extends Controller
{
    public function index()
    {
        return PekerjaanPemeliharaan::with(['tiket', 'petugas', 'tim', 'foto'])->get();
    }

    public function show($id)
    {
        return PekerjaanPemeliharaan::with(['tiket', 'petugas', 'tim', 'foto'])
            ->findOrFail($id);
    }

    public function draft(Request $request)
    {
        $request->validate([
            'tiket_id' => 'required|exists:tiket_pekerjaan,id',
        ]);

        $petugas = Petugas::where('user_id', $request->user()->id)->first();

        if (!$petugas) {
            return response()->json([
                'message' => 'Data petugas tidak ditemukan untuk user ini'
            ], 404);
        }

        if (!$petugas->tim_id) {
            return response()->json([
                'message' => 'Petugas belum memiliki tim'
            ], 422);
        }

        DB::beginTransaction();

        try {
            $tiket = TiketPekerjaan::with('aset.pelanggan')
                ->findOrFail($request->tiket_id);

            if ($tiket->status !== 'dikerjakan') {
                return response()->json([
                    'message' => 'Tiket belum dalam status dikerjakan'
                ], 422);
            }

            $data = [
                'tiket_id' => $request->tiket_id,
                'petugas_id' => $petugas->id,
                'tim_id' => $petugas->tim_id,
                'idpel' => $tiket->aset->pelanggan->idpel,

                'pemadaman' => $request->pemadaman ?? 'tidak padam',
                'konstruksi_app' => $request->konstruksi_app ?? 'non kubikel',
                'faktor_kali_dil' => $request->faktor_kali_dil ?? 0,
                'faktor_kali_real' => $request->faktor_kali_real,

                'arus_primer_r_ukur' => $request->arus_primer_r_ukur,
                'arus_primer_s_ukur' => $request->arus_primer_s_ukur,
                'arus_primer_t_ukur' => $request->arus_primer_t_ukur,

                'tegangan_primer_r_ukur' => $request->tegangan_primer_r_ukur,
                'tegangan_primer_s_ukur' => $request->tegangan_primer_s_ukur,
                'tegangan_primer_t_ukur' => $request->tegangan_primer_t_ukur,

                'cos_phi_primer' => $request->cos_phi_primer,
                'p_primer_r' => $request->p_primer_r,
                'p_primer_s' => $request->p_primer_s,
                'p_primer_t' => $request->p_primer_t,
                'p_primer_total' => $request->p_primer_total,

                'arus_sekunder_r_ukur' => $request->arus_sekunder_r_ukur,
                'arus_sekunder_s_ukur' => $request->arus_sekunder_s_ukur,
                'arus_sekunder_t_ukur' => $request->arus_sekunder_t_ukur,

                'arus_sekunder_r_meter' => $request->arus_sekunder_r_meter,
                'arus_sekunder_s_meter' => $request->arus_sekunder_s_meter,
                'arus_sekunder_t_meter' => $request->arus_sekunder_t_meter,

                'tegangan_meter_r' => $request->tegangan_meter_r,
                'tegangan_meter_s' => $request->tegangan_meter_s,
                'tegangan_meter_t' => $request->tegangan_meter_t,

                'cos_phi_sekunder' => $request->cos_phi_sekunder,

                'p_meter_r' => $request->p_meter_r,
                'p_meter_s' => $request->p_meter_s,
                'p_meter_t' => $request->p_meter_t,
                'p_meter_total' => $request->p_meter_total,

                'error_kwh_r' => $request->error_kwh_r,
                'error_kwh_s' => $request->error_kwh_s,
                'error_kwh_t' => $request->error_kwh_t,
                'error_kwh_total' => $request->error_kwh_total,

                'error_ct_r' => $request->error_ct_r,
                'error_ct_s' => $request->error_ct_s,
                'error_ct_t' => $request->error_ct_t,
                'error_ct_total' => $request->error_ct_total,

                'catatan_ct' => $request->catatan_ct,
                'rekomendasi' => $request->rekomendasi,

                'merk_box' => $request->merk_box,
                'no_seri_box' => $request->no_seri_box,
                'tahun_box' => $request->tahun_box,
                'kondisi_box_segel_kwh' => $request->kondisi_box_segel_kwh,

                'catatan' => $request->catatan,
                'tikor_baru' => $request->tikor_baru,

                'tanggal' => $request->tanggal ?? now()->toDateString(),
                'jam' => $request->jam ?? now()->format('H:i'),

                'keterangan' => $request->keterangan
            ];

            $pekerjaan = PekerjaanPemeliharaan::updateOrCreate(
                ['tiket_id' => $request->tiket_id],
                $data
            );

            DB::commit();

            return response()->json([
                'message' => 'Draft berhasil disimpan di database',
                'data' => $pekerjaan
            ], 200);
        } catch (\Throwable $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Gagal menyimpan draft',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request, PerhitunganPekerjaanService $service)
    {
        $request->validate([
            'tiket_id' => 'required|exists:tiket_pekerjaan,id',

            'pemadaman' => 'required|in:padam,tidak padam',
            'konstruksi_app' => 'required|in:kubikel,non kubikel',

            'faktor_kali_dil' => 'required|numeric',
            'faktor_kali_real' => 'nullable|numeric',

            'arus_primer_r_ukur' => 'nullable|numeric',
            'arus_primer_s_ukur' => 'nullable|numeric',
            'arus_primer_t_ukur' => 'nullable|numeric',

            'tegangan_primer_r_ukur' => 'nullable|numeric',
            'tegangan_primer_s_ukur' => 'nullable|numeric',
            'tegangan_primer_t_ukur' => 'nullable|numeric',

            'cos_phi_primer' => 'nullable|numeric',
            'p_primer_r' => 'nullable|numeric',
            'p_primer_s' => 'nullable|numeric',
            'p_primer_t' => 'nullable|numeric',
            'p_primer_total' => 'nullable|numeric',

            'arus_sekunder_r_ukur' => 'nullable|numeric',
            'arus_sekunder_s_ukur' => 'nullable|numeric',
            'arus_sekunder_t_ukur' => 'nullable|numeric',

            'arus_sekunder_r_meter' => 'nullable|numeric',
            'arus_sekunder_s_meter' => 'nullable|numeric',
            'arus_sekunder_t_meter' => 'nullable|numeric',

            'tegangan_meter_r' => 'nullable|numeric',
            'tegangan_meter_s' => 'nullable|numeric',
            'tegangan_meter_t' => 'nullable|numeric',

            'cos_phi_sekunder' => 'nullable|numeric',

            'merk_box' => 'nullable|string',
            'no_seri_box' => 'nullable|string',
            'tahun_box' => 'nullable|digits:4',

            'kondisi_box_segel_kwh' => 'nullable|string',

            'catatan' => 'nullable|string',
            'tikor_baru' => 'nullable|string',

            'tanggal' => 'required|date',
            'jam' => 'required|date_format:H:i',

            'keterangan' => 'nullable|string',
        ]);

        $petugas = Petugas::where('user_id', $request->user()->id)->first();

        if (!$petugas) {
            return response()->json([
                'message' => 'Data petugas tidak ditemukan untuk user ini'
            ], 404);
        }

        if (!$petugas->tim_id) {
            return response()->json([
                'message' => 'Petugas belum memiliki tim'
            ], 422);
        }

        DB::beginTransaction();

        try {
            $tiket = TiketPekerjaan::with('aset.pelanggan')
                ->findOrFail($request->tiket_id);

            if ($tiket->status !== 'dikerjakan') {
                return response()->json([
                    'message' => 'Tiket belum siap dikerjakan'
                ], 422);
            }

            $hasil = $service->hitung($request->all());

            $data = [
                'tiket_id' => $request->tiket_id,
                'petugas_id' => $petugas->id,
                'tim_id' => $petugas->tim_id,
                'idpel' => $tiket->aset->pelanggan->idpel,

                'pemadaman' => $request->pemadaman,
                'konstruksi_app' => $request->konstruksi_app,
                'faktor_kali_dil' => $request->faktor_kali_dil,
                'faktor_kali_real' => $request->faktor_kali_real,

                'arus_primer_r_ukur' => $request->arus_primer_r_ukur,
                'arus_primer_s_ukur' => $request->arus_primer_s_ukur,
                'arus_primer_t_ukur' => $request->arus_primer_t_ukur,

                'tegangan_primer_r_ukur' => $request->tegangan_primer_r_ukur,
                'tegangan_primer_s_ukur' => $request->tegangan_primer_s_ukur,
                'tegangan_primer_t_ukur' => $request->tegangan_primer_t_ukur,

                'cos_phi_primer' => $request->cos_phi_primer,
                'p_primer_r' => $request->p_primer_r,
                'p_primer_s' => $request->p_primer_s,
                'p_primer_t' => $request->p_primer_t,
                'p_primer_total' => $request->p_primer_total,

                'arus_sekunder_r_ukur' => $request->arus_sekunder_r_ukur,
                'arus_sekunder_s_ukur' => $request->arus_sekunder_s_ukur,
                'arus_sekunder_t_ukur' => $request->arus_sekunder_t_ukur,

                'arus_sekunder_r_meter' => $request->arus_sekunder_r_meter,
                'arus_sekunder_s_meter' => $request->arus_sekunder_s_meter,
                'arus_sekunder_t_meter' => $request->arus_sekunder_t_meter,

                'tegangan_meter_r' => $request->tegangan_meter_r,
                'tegangan_meter_s' => $request->tegangan_meter_s,
                'tegangan_meter_t' => $request->tegangan_meter_t,

                'cos_phi_sekunder' => $request->cos_phi_sekunder,

                'p_meter_r' => $hasil['pMeterR'],
                'p_meter_s' => $hasil['pMeterS'],
                'p_meter_t' => $hasil['pMeterT'],
                'p_meter_total' => $hasil['pMeterTotal'],

                'error_kwh_r' => $hasil['errorKwhR'],
                'error_kwh_s' => $hasil['errorKwhS'],
                'error_kwh_t' => $hasil['errorKwhT'],
                'error_kwh_total' => $hasil['errorKwhTotal'],

                'error_ct_r' => $hasil['errorCtR'],
                'error_ct_s' => $hasil['errorCtS'],
                'error_ct_t' => $hasil['errorCtT'],
                'error_ct_total' => $hasil['errorCtTotal'],

                'catatan_ct' => $hasil['catatanCt'],
                'rekomendasi' => $hasil['rekomendasi'],

                'merk_box' => $request->merk_box,
                'no_seri_box' => $request->no_seri_box,
                'tahun_box' => $request->tahun_box,
                'kondisi_box_segel_kwh' => $request->kondisi_box_segel_kwh,

                'catatan' => $request->catatan,
                'tikor_baru' => $request->tikor_baru,
                'tanggal' => $request->tanggal,
                'jam' => $request->jam,
                'keterangan' => $request->keterangan
            ];

            $pekerjaan = PekerjaanPemeliharaan::updateOrCreate(
                ['tiket_id' => $request->tiket_id],
                $data
            );

            DB::commit();

            return response()->json([
                'message' => 'Pekerjaan pemeliharaan berhasil disimpan',
                'data' => $pekerjaan
            ], 201);
        } catch (\Throwable $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Gagal menyimpan pekerjaan pemeliharaan',
                'error' => $e->getMessage()
            ], 500);
        }
    }


    public function kirimReview($id)
    {
        DB::beginTransaction();

        try {
            $pekerjaan = PekerjaanPemeliharaan::with(['tiket', 'foto'])
                ->findOrFail($id);

            if ($pekerjaan->tiket->status !== 'dikerjakan') {
                return response()->json([
                    'success' => false,
                    'message' => 'Status tiket tidak valid untuk dikirim ke review'
                ], 422);
            }

            // FOTO BOLEH KOSONG / TIDAK LENGKAP
            // Kalau ada foto, tetap tersimpan.
            // Kalau sebagian foto null, tetap boleh lanjut ke admin.

            $pekerjaan->tiket->update([
                'status' => 'inReview'
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Pekerjaan berhasil dikirim ke admin untuk review',
                'data' => $pekerjaan
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Gagal mengirim pekerjaan ke review',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function reviewSelesai($id)
    {
        DB::beginTransaction();

        try {
            $pekerjaan = PekerjaanPemeliharaan::with('tiket')
                ->findOrFail($id);

            if ($pekerjaan->tiket->status !== 'inReview') {
                return response()->json([
                    'message' => 'Pekerjaan belum berada pada tahap review admin'
                ], 422);
            }

            $pekerjaan->tiket->update([
                'status' => 'menungguValidasi'
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Review admin selesai. Pekerjaan diteruskan ke manager untuk validasi.'
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Gagal menyelesaikan review admin',
                'error' => $e->getMessage()
            ], 500);
        }
    }


    public function selesai($id)
    {
        DB::beginTransaction();

        try {
            $pekerjaan = PekerjaanPemeliharaan::with('tiket')
                ->findOrFail($id);

            if ($pekerjaan->tiket->status !== 'menungguValidasi') {
                return response()->json([
                    'message' => 'Tiket belum dalam tahap validasi'
                ], 422);
            }


            $pekerjaan->tiket->update([
                'status' => 'selesai'
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Tiket pekerjaan selesai'
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Gagal menyelesaikan tiket',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function adminReviewIndex(Request $request)
    {
        $status = $request->query('status', 'inReview');

        $allowedStatuses = [
            'inReview',
            'menungguValidasi',
            'selesai'
        ];

        if (!in_array($status, $allowedStatuses)) {
            return response()->json([
                'success' => false,
                'message' => 'Status tidak valid'
            ], 422);
        }

        $data = PekerjaanPemeliharaan::with([
            'tiket.aset.pelanggan',
            'petugas',
            'tim',
            'foto'
        ])
            ->whereHas('tiket', function ($query) use ($status) {
                $query->where('status', $status);
            })
            ->orderBy('updated_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $data
        ]);
    }

    public function adminReviewShow($id)
    {
        $pekerjaan = PekerjaanPemeliharaan::with([
            'tiket.aset.pelanggan',
            'petugas',
            'tim',
            'foto'
        ])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $pekerjaan
        ]);
    }

    public function adminReviewUpdate(Request $request, $id)
{
    $pekerjaan = PekerjaanPemeliharaan::with('tiket')->findOrFail($id);

    if (!$pekerjaan->tiket || $pekerjaan->tiket->status !== 'inReview') {
        return response()->json([
            'success' => false,
            'message' => 'Data hanya bisa diedit saat status masih inReview.'
        ], 422);
    }

    $data = $request->validate([
        'pemadaman' => 'nullable|string',
        'konstruksi_app' => 'nullable|string',
        'faktor_kali_dil' => 'nullable|numeric',
        'faktor_kali_real' => 'nullable|numeric',

        'arus_primer_r_ukur' => 'nullable|numeric',
        'arus_primer_s_ukur' => 'nullable|numeric',
        'arus_primer_t_ukur' => 'nullable|numeric',
        'tegangan_primer_r_ukur' => 'nullable|numeric',
        'tegangan_primer_s_ukur' => 'nullable|numeric',
        'tegangan_primer_t_ukur' => 'nullable|numeric',
        'cos_phi_primer' => 'nullable|numeric',
        'p_primer_r' => 'nullable|numeric',
        'p_primer_s' => 'nullable|numeric',
        'p_primer_t' => 'nullable|numeric',
        'p_primer_total' => 'nullable|numeric',

        'arus_sekunder_r_ukur' => 'nullable|numeric',
        'arus_sekunder_s_ukur' => 'nullable|numeric',
        'arus_sekunder_t_ukur' => 'nullable|numeric',
        'arus_sekunder_r_meter' => 'nullable|numeric',
        'arus_sekunder_s_meter' => 'nullable|numeric',
        'arus_sekunder_t_meter' => 'nullable|numeric',
        'tegangan_meter_r' => 'nullable|numeric',
        'tegangan_meter_s' => 'nullable|numeric',
        'tegangan_meter_t' => 'nullable|numeric',
        'cos_phi_sekunder' => 'nullable|numeric',

        'merk_box' => 'nullable|string',
        'no_seri_box' => 'nullable|string',
        'tahun_box' => 'nullable|string',
        'kondisi_box_segel_kwh' => 'nullable|string',
        'tikor_baru' => 'nullable|string',
        'tanggal' => 'nullable|string',
        'jam' => 'nullable|string',
        'keterangan' => 'nullable|string',
        'catatan' => 'nullable|string',
    ]);

    $pekerjaan->update($data);

    return response()->json([
        'success' => true,
        'message' => 'Data review berhasil diperbarui',
        'data' => $pekerjaan->fresh([
            'tiket.aset.pelanggan',
            'petugas',
            'tim',
            'foto'
        ])
    ]);
}
}
