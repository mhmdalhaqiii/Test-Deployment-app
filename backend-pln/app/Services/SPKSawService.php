<?php

namespace App\Services;

class SpkSawService
{
    // Bobot Kriteria (Total 1.0)
    protected array $bobot = [
        'selisih_tahun_tera' => 0.40,
        'daya'               => 0.35,
        'jenis'              => 0.25,
    ];

    // Sifat Kriteria (Benefit = makin besar makin bagus)
    protected array $sifatKriteria = [
        'selisih_tahun_tera' => 'benefit',
        'daya'               => 'benefit',
        'jenis'              => 'benefit',
    ];

    public function hitung(array $alternatif): array
    {
        if (empty($alternatif)) {
            return [];
        }

        // 1. Cari Nilai Max & Min
        $maxValues = [
            'selisih_tahun_tera' => max(array_column($alternatif, 'selisih_tahun_tera')) ?: 1,
            'daya'               => max(array_column($alternatif, 'daya')) ?: 1,
            'jenis'              => max(array_column($alternatif, 'jenis')) ?: 1,
        ];

        $minValues = [
            'selisih_tahun_tera' => min(array_column($alternatif, 'selisih_tahun_tera')) ?: 1,
            'daya'               => min(array_column($alternatif, 'daya')) ?: 1,
            'jenis'              => min(array_column($alternatif, 'jenis')) ?: 1,
        ];

        // 2. Hitung Normalisasi & Total Skor
        foreach ($alternatif as &$item) {
            $skorTotal = 0;
            $kriteriaKeys = ['selisih_tahun_tera', 'daya', 'jenis'];

            foreach ($kriteriaKeys as $key) {
                $nilaiAsli = (float) ($item[$key] ?? 0);
                $nilaiNormalisasi = $this->normalisasi($nilaiAsli, $maxValues[$key], $minValues[$key], $this->sifatKriteria[$key]);
                $skorTotal += ($nilaiNormalisasi * $this->bobot[$key]);
            }

            // 👇 INI KUNCINYA: Variabel dipatenkan jadi skor_saw biar React gak error
            $item['skor_saw'] = round($skorTotal, 4);
        }

        // 3. Urutkan dari skor tertinggi
        usort($alternatif, function ($a, $b) {
            return $b['skor_saw'] <=> $a['skor_saw'];
        });

        return $alternatif;
    }

    private function normalisasi(float $nilai, float $max, float $min, string $sifat): float
    {
        if ($max == 0 || $min == 0) return 0;
        if ($sifat === 'benefit') return $nilai / $max;
        if ($sifat === 'cost') return $nilai == 0 ? 0 : ($min / $nilai);
        return 0;
    }
}
