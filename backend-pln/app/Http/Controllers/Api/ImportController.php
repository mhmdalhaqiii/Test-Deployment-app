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
    set_time_limit(300);
    ini_set('memory_limit', '512M');

    if (!$request->hasFile('file')) {
        return response()->json([
            'success' => false,
            'message' => 'File tidak ditemukan. Pastikan key upload adalah file.'
        ], 422);
    }

    $request->validate([
        'file' => 'required|file|mimes:xlsx,xls,csv|max:51200',
    ]);

    DB::beginTransaction();

    try {
        $file = $request->file('file');

        $spreadsheet = IOFactory::load($file->getPathname());
        $rows = $spreadsheet->getActiveSheet()->toArray();

        $dataImport = [];
        $gagal = [];

        foreach ($rows as $i => $row) {
            if ($i === 0) {
                continue;
            }

            $unitup = trim($row[0] ?? '');
            $idpel = trim($row[1] ?? '');
            $namaPelanggan = trim($row[2] ?? '');
            $alamatPelanggan = trim($row[3] ?? '');
            $tarif = trim($row[4] ?? '');
            $daya = $row[5] ?? null;
            $tikor = trim($row[6] ?? '');

            if ($idpel === '') {
                $gagal[] = [
                    'baris' => $i + 1,
                    'alasan' => 'IDPEL kosong',
                ];
                continue;
            }

            $dataImport[] = [
                'unitup' => $unitup,
                'idpel' => $idpel,
                'nama_pelanggan' => $namaPelanggan,
                'alamat_pelanggan' => $alamatPelanggan,
                'tarif' => $tarif,
                'daya' => is_numeric($daya) ? (int) $daya : 0,
                'tikor' => $tikor !== '' ? $tikor : null,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        foreach (array_chunk($dataImport, 300) as $chunk) {
            Pelanggan::upsert(
                $chunk,
                ['idpel'],
                [
                    'unitup',
                    'nama_pelanggan',
                    'alamat_pelanggan',
                    'tarif',
                    'daya',
                    'tikor',
                    'updated_at',
                ]
            );
        }

        DB::commit();

        return response()->json([
            'success' => true,
            'message' => 'Import pelanggan selesai',
            'sukses' => count($dataImport),
            'gagal' => $gagal,
        ]);
    } catch (\Throwable $e) {
        DB::rollBack();

        return response()->json([
            'success' => false,
            'message' => 'Import pelanggan gagal',
            'error' => $e->getMessage(),
            'line' => $e->getLine(),
        ], 500);
    }
}
public function aset(Request $request)
{
    set_time_limit(600);
    ini_set('memory_limit', '1024M');

    if (!$request->hasFile('file')) {
        return response()->json([
            'success' => false,
            'message' => 'File tidak ditemukan. Pastikan key upload adalah file.'
        ], 422);
    }

    $request->validate([
        'file' => 'required|file|mimes:xlsx,xls,csv|max:51200',
    ]);

    try {
        $file = $request->file('file');

        $rows = IOFactory::load($file->getPathname())
            ->getActiveSheet()
            ->toArray();

        $idpelList = [];
        $calonData = [];
        $gagal = [];

        foreach ($rows as $i => $row) {
            if ($i === 0) {
                continue;
            }

            $idpel = trim((string) ($row[0] ?? ''));
            $nomorKwh = trim((string) ($row[1] ?? ''));
            $merekKwh = trim((string) ($row[2] ?? ''));
            $thteraKwh = trim((string) ($row[3] ?? ''));
            $faktorKaliDil = trim((string) ($row[4] ?? ''));
            $tikorBaru = trim((string) ($row[5] ?? ''));

            if (
                $idpel === '' &&
                $nomorKwh === '' &&
                $merekKwh === '' &&
                $thteraKwh === '' &&
                $faktorKaliDil === ''
            ) {
                continue;
            }

            if ($idpel === '') {
                $gagal[] = [
                    'baris' => $i + 1,
                    'alasan' => 'IDPEL kosong',
                ];
                continue;
            }

            if ($nomorKwh === '') {
                $gagal[] = [
                    'baris' => $i + 1,
                    'idpel' => $idpel,
                    'alasan' => 'Nomor kWh kosong',
                ];
                continue;
            }

            if ($merekKwh === '') {
                $gagal[] = [
                    'baris' => $i + 1,
                    'idpel' => $idpel,
                    'nomor_kwh' => $nomorKwh,
                    'alasan' => 'Merek kWh kosong',
                ];
                continue;
            }

            if ($thteraKwh === '' || !is_numeric($thteraKwh)) {
                $gagal[] = [
                    'baris' => $i + 1,
                    'idpel' => $idpel,
                    'nomor_kwh' => $nomorKwh,
                    'alasan' => 'Tahun tera kWh kosong atau bukan angka',
                ];
                continue;
            }

            if ($faktorKaliDil === '' || !is_numeric($faktorKaliDil)) {
                $gagal[] = [
                    'baris' => $i + 1,
                    'idpel' => $idpel,
                    'nomor_kwh' => $nomorKwh,
                    'alasan' => 'Faktor kali DIL kosong atau bukan angka',
                ];
                continue;
            }

            $idpelList[] = $idpel;

            $calonData[] = [
                'baris' => $i + 1,
                'idpel' => $idpel,
                'nomor_kwh' => $nomorKwh,
                'merek_kwh' => strtoupper($merekKwh),
                'thtera_kwh' => (int) $thteraKwh,
                'faktor_kali_dil' => (float) $faktorKaliDil,
                'tikor_baru' => $tikorBaru !== '' ? $tikorBaru : null,
            ];
        }

        $pelangganMap = Pelanggan::query()
            ->whereIn('idpel', array_unique($idpelList))
            ->pluck('id', 'idpel');

        $validRows = [];
        $now = now();

        foreach ($calonData as $item) {
            $pelangganId = $pelangganMap[$item['idpel']] ?? null;

            if (!$pelangganId) {
                $gagal[] = [
                    'baris' => $item['baris'],
                    'idpel' => $item['idpel'],
                    'nomor_kwh' => $item['nomor_kwh'],
                    'alasan' => 'Pelanggan tidak ditemukan',
                ];
                continue;
            }

            $validRows[] = [
                'pelanggan_id' => $pelangganId,
                'nomor_kwh' => $item['nomor_kwh'],
                'merek_kwh' => $item['merek_kwh'],
                'thtera_kwh' => $item['thtera_kwh'],
                'faktor_kali_dil' => $item['faktor_kali_dil'],
                'tikor_baru' => $item['tikor_baru'],
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        foreach (array_chunk($validRows, 300) as $chunk) {
            AsetAppTr::upsert(
                $chunk,
                ['pelanggan_id'],
                [
                    'nomor_kwh',
                    'merek_kwh',
                    'thtera_kwh',
                    'faktor_kali_dil',
                    'tikor_baru',
                    'updated_at',
                ]
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Import aset selesai',
            'sukses' => count($validRows),
            'gagal' => $gagal,
        ]);
    } catch (\Throwable $e) {
        return response()->json([
            'success' => false,
            'message' => 'Import aset gagal membaca atau memproses file',
            'error' => $e->getMessage(),
            'line' => $e->getLine(),
        ], 500);
    }
}

public function tiket(Request $request)
{
    set_time_limit(600);
    ini_set('memory_limit', '1024M');

    if (!$request->hasFile('file')) {
        return response()->json([
            'success' => false,
            'message' => 'File tidak ditemukan. Pastikan key upload adalah file.'
        ], 422);
    }

    $request->validate([
        'file' => 'required|file|mimes:xlsx,xls,csv|max:51200',
    ]);

    try {
        $rows = IOFactory::load($request->file('file')->getPathname())
            ->getActiveSheet()
            ->toArray();

        $allowedStatuses = [
            'tersedia',
            'berjalan',
            'dikerjakan',
            'inReview',
            'menungguValidasi',
            'selesai',
        ];

        $dataImport = [];
        $nomorKwhList = [];
        $idpelList = [];
        $gagal = [];

        foreach ($rows as $i => $row) {
            if ($i === 0) {
                continue;
            }

            $nomorKwh = trim((string) ($row[0] ?? ''));
            $idpel = trim((string) ($row[1] ?? ''));
            $tanggal = $this->parseTanggalExcel($row[2] ?? null);
            $status = trim((string) ($row[3] ?? 'tersedia'));

            if ($nomorKwh === '' && $idpel === '') {
                continue;
            }

            if (!$tanggal) {
                $gagal[] = [
                    'baris' => $i + 1,
                    'nomor_kwh' => $nomorKwh ?: null,
                    'idpel' => $idpel ?: null,
                    'alasan' => 'Tanggal tiket kosong atau format tanggal tidak valid',
                ];
                continue;
            }

            if (!in_array($status, $allowedStatuses)) {
                $gagal[] = [
                    'baris' => $i + 1,
                    'nomor_kwh' => $nomorKwh ?: null,
                    'idpel' => $idpel ?: null,
                    'alasan' => "Status tidak valid: {$status}",
                ];
                continue;
            }

            if ($nomorKwh !== '') {
                $nomorKwhList[] = $nomorKwh;
            }

            if ($idpel !== '') {
                $idpelList[] = $idpel;
            }

            $dataImport[] = [
                'baris' => $i + 1,
                'nomor_kwh' => $nomorKwh,
                'idpel' => $idpel,
                'tanggal' => $tanggal,
                'status' => $status,
            ];
        }

        $nomorKwhList = array_unique($nomorKwhList);
        $idpelList = array_unique($idpelList);

        $asetQuery = AsetAppTr::query()
            ->with('pelanggan:id,idpel,nama_pelanggan');

        $asetQuery->where(function ($query) use ($nomorKwhList, $idpelList) {
            $hasNomorKwh = !empty($nomorKwhList);
            $hasIdpel = !empty($idpelList);

            if ($hasNomorKwh) {
                $query->whereIn('nomor_kwh', $nomorKwhList);
            }

            if ($hasIdpel) {
                if ($hasNomorKwh) {
                    $query->orWhereHas('pelanggan', function ($q) use ($idpelList) {
                        $q->whereIn('idpel', $idpelList);
                    });
                } else {
                    $query->whereHas('pelanggan', function ($q) use ($idpelList) {
                        $q->whereIn('idpel', $idpelList);
                    });
                }
            }
        });

        $asetCollection = $asetQuery->get();

        $asetByNomorKwh = $asetCollection
            ->filter(fn ($aset) => $aset->nomor_kwh)
            ->keyBy(fn ($aset) => trim((string) $aset->nomor_kwh));

        $asetByIdpel = $asetCollection
            ->filter(fn ($aset) => $aset->pelanggan)
            ->groupBy(fn ($aset) => $aset->pelanggan->idpel);

        $asetIds = $asetCollection->pluck('id')->values();

        $existingCounts = TiketPekerjaan::query()
            ->whereIn('aset_id', $asetIds)
            ->select('aset_id', DB::raw('COUNT(*) as total'))
            ->groupBy('aset_id')
            ->pluck('total', 'aset_id')
            ->toArray();

        $existingTiketByKey = TiketPekerjaan::query()
            ->whereIn('aset_id', $asetIds)
            ->get()
            ->keyBy(fn ($tiket) => $tiket->aset_id . '|' . $tiket->tanggal_tiket);

        $validRows = [];
        $seenKeys = [];
        $now = now();

        foreach ($dataImport as $item) {
            $aset = null;

            if ($item['nomor_kwh'] !== '' && $asetByNomorKwh->has($item['nomor_kwh'])) {
                $aset = $asetByNomorKwh->get($item['nomor_kwh']);
            }

            if (!$aset && $item['idpel'] !== '') {
                $asetGroup = $asetByIdpel->get($item['idpel']);

                if ($asetGroup && $asetGroup->count() === 1) {
                    $aset = $asetGroup->first();
                } elseif ($asetGroup && $asetGroup->count() > 1) {
                    $gagal[] = [
                        'baris' => $item['baris'],
                        'nomor_kwh' => $item['nomor_kwh'] ?: null,
                        'idpel' => $item['idpel'],
                        'alasan' => 'IDPEL memiliki lebih dari satu aset. Isi nomor kWh agar tidak ambigu.',
                    ];
                    continue;
                }
            }

            if (!$aset) {
                $gagal[] = [
                    'baris' => $item['baris'],
                    'nomor_kwh' => $item['nomor_kwh'] ?: null,
                    'idpel' => $item['idpel'] ?: null,
                    'alasan' => 'Aset tidak ditemukan',
                ];
                continue;
            }

            $key = $aset->id . '|' . $item['tanggal'];

            if (isset($seenKeys[$key])) {
                $gagal[] = [
                    'baris' => $item['baris'],
                    'nomor_kwh' => $item['nomor_kwh'] ?: null,
                    'idpel' => $item['idpel'] ?: null,
                    'alasan' => 'Duplikat aset dan tanggal tiket dalam file yang sama',
                ];
                continue;
            }

            $seenKeys[$key] = true;

            if ($existingTiketByKey->has($key)) {
                $nomorTiket = $existingTiketByKey->get($key)->nomor_tiket;
            } else {
                $idpelTiket = $aset->pelanggan?->idpel ?: $item['idpel'];

                $nextNumber = ((int) ($existingCounts[$aset->id] ?? 0)) + 1;
                $existingCounts[$aset->id] = $nextNumber;

                $nomorTiket = "PKJ-{$idpelTiket}-{$nextNumber}";
            }

            $validRows[] = [
                'aset_id' => $aset->id,
                'nomor_tiket' => $nomorTiket,
                'tanggal_tiket' => $item['tanggal'],
                'status' => $item['status'],
                'tim_id' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        foreach (array_chunk($validRows, 300) as $chunk) {
            TiketPekerjaan::upsert(
                $chunk,
                ['nomor_tiket'],
                [
                    'aset_id',
                    'tanggal_tiket',
                    'status',
                    'tim_id',
                    'updated_at',
                ]
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Import tiket pekerjaan selesai',
            'sukses' => count($validRows),
            'gagal' => $gagal,
        ]);
    } catch (\Throwable $e) {
        return response()->json([
            'success' => false,
            'message' => 'Import tiket pekerjaan gagal',
            'error' => $e->getMessage(),
            'line' => $e->getLine(),
        ], 500);
    }
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
