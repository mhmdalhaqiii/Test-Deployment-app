<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pelanggan;
use App\Models\AsetAppTr;
use App\Models\TiketPekerjaan;
use Carbon\Carbon;
use PhpOffice\PhpSpreadsheet\Shared\Date;
use Illuminate\Http\Request;
use PhpOffice\PhpSpreadsheet\IOFactory;
use Illuminate\Support\Facades\DB;

class ImportController extends Controller
{
    public function pelanggan(Request $request)
{
    $file = $request->file('file');

    $spreadsheet = IOFactory::load(
        $file->getPathname()
    );

    $rows = $spreadsheet->getActiveSheet()->toArray();

    foreach ($rows as $i => $row) {
        if ($i === 0) continue;

        Pelanggan::create([
            'unitup'           => trim($row[0]),
            'idpel'            => (string) trim($row[1]),
            'nama_pelanggan'   => trim($row[2]),
            'alamat_pelanggan' => trim($row[3]),
            'tarif'            => trim($row[4]),
            'daya'             => (int) $row[5],
            'tikor'            => !empty($row[6]) ? trim($row[6]) : null,
        ]);
    }

    return response()->json([
        'message' => 'IMPORT BERHASIL'
    ]);
}

public function aset(Request $request)
{
    if (!$request->hasFile('file')) {
        return response()->json([
            'error' => 'File tidak ditemukan (key harus: file)'
        ], 422);
    }

    $file = $request->file('file');
    $rows = IOFactory::load($file->getPathname())
        ->getActiveSheet()
        ->toArray();

    $gagal = [];
    $sukses = 0;

    foreach ($rows as $i => $row) {
        if ($i === 0) continue;

        $idpel = trim($row[0] ?? '');

        if ($idpel === '') {
            $gagal[] = ['baris' => $i + 1, 'alasan' => 'IDPEL kosong'];
            continue;
        }

        $pelanggan = Pelanggan::where('idpel', $idpel)->first();
        if (!$pelanggan) {
            $gagal[] = [
                'baris' => $i + 1,
                'idpel' => $idpel,
                'alasan' => 'Pelanggan tidak ditemukan'
            ];
            continue;
        }

        AsetAppTr::create([
            'pelanggan_id'    => $pelanggan->id,
            'nomor_kwh'       => trim($row[1] ?? ''),
            'merek_kwh'        => trim($row[2] ?? ''),
            'thtera_kwh'      => $row[3] ?? null,
            'faktor_kali_dil' => $row[4] ?? null,
            'tikor_baru'      => !empty($row[5]) ? trim($row[5]) : null,
        ]);

        $sukses++;
    }

    return response()->json([
        'message' => 'Import aset selesai',
        'sukses'  => $sukses,
        'gagal'   => $gagal
    ]);
}

 public function tiket(Request $request)
{
    if (!$request->hasFile('file')) {
        return response()->json([
            'error' => 'File tidak ditemukan (key harus: file)'
        ], 422);
    }

    $rows = IOFactory::load(
        $request->file('file')->getPathname()
    )->getActiveSheet()->toArray();

    $sukses = 0;
    $gagal  = [];

    foreach ($rows as $i => $row) {
        if ($i === 0) continue;

        $nomorKwh = trim($row[0] ?? '');
        $idpel    = trim($row[1] ?? '');
        $tanggal  = $this->parseTanggalExcel($row[2] ?? null);
        $status   = trim($row[3] ?? 'tersedia');

        $aset = null;

        if ($nomorKwh !== '') {
            $aset = AsetAppTr::with('pelanggan')
                ->where('nomor_kwh', $nomorKwh)
                ->first();
        }

        if (!$aset && $idpel !== '') {
            $pelanggan = Pelanggan::with('aset')
                ->where('idpel', $idpel)
                ->first();

            if ($pelanggan && $pelanggan->aset->count() === 1) {
                $aset = $pelanggan->aset->first();
            }
        }

        if (!$aset) {
            $gagal[] = [
                'baris'     => $i + 1,
                'nomor_kwh' => $nomorKwh ?: null,
                'idpel'     => $idpel ?: null,
                'alasan'    => 'Aset tidak ditemukan atau lebih dari satu aset'
            ];
            continue;
        }

        $idpelTiket = $aset->pelanggan->idpel;

        $jumlahTiket = TiketPekerjaan::whereHas('aset.pelanggan', function ($q) use ($idpelTiket) {
            $q->where('idpel', $idpelTiket);
        })->count();

        $nomorTiket = "PKJ-{$idpelTiket}-" . ($jumlahTiket + 1);

        TiketPekerjaan::create([
            'aset_id'       => $aset->id,
            'nomor_tiket'   => $nomorTiket,
            'tanggal_tiket' => $tanggal,
            'status'        => $status,
        ]);

        $sukses++;
    }

    return response()->json([
        'message' => 'Import tiket pekerjaan selesai',
        'sukses'  => $sukses,
        'gagal'   => $gagal
    ]);
}

private function parseTanggalExcel($value)
{
    if (empty($value)) {
        return null;
    }

    if (is_numeric($value)) {
        $dt = Date::excelToDateTimeObject($value);

        if ((int)$dt->format('Y') < 1900) {
            return null;
        }

        return $dt->format('Y-m-d');
    }

    $value = trim($value);

    $formats = [
        'Y-m-d',
        'd-m-Y',
        'd/m/Y',
        'm/d/Y',
        'Y/m/d',
    ];

    foreach ($formats as $format) {
        try {
            $dt = Carbon::createFromFormat($format, $value);

            if ((int)$dt->format('Y') < 1900) {
                continue;
            }

            return $dt->format('Y-m-d');
        } catch (\Exception $e) {
        }
    }

    return null;
}

}
