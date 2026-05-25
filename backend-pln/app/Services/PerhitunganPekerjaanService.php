<?php

namespace App\Services;

class PerhitunganPekerjaanService
{
    public function hitung(array $d): array
    {
        $num = function ($key, $default = 0) use ($d) {
            return isset($d[$key]) && $d[$key] !== '' && $d[$key] !== null
                ? (float) $d[$key]
                : $default;
        };

        $safeDiv = function ($atas, $bawah) {
            return $bawah != 0 ? $atas / $bawah : 0;
        };

        $faktorKaliDil = $num('faktor_kali_dil');
        $faktorKaliReal = $num('faktor_kali_real', $faktorKaliDil);

        // =========================
        // DATA PRIMER
        // =========================
        $arusPrimerR = $num('arus_primer_r_ukur');
        $arusPrimerS = $num('arus_primer_s_ukur');
        $arusPrimerT = $num('arus_primer_t_ukur');

        $arusPrimerTotal = $arusPrimerR + $arusPrimerS + $arusPrimerT;

        $pPrimerR = $num('p_primer_r');
        $pPrimerS = $num('p_primer_s');
        $pPrimerT = $num('p_primer_t');
        $pPrimerTotal = $num('p_primer_total');

        // =========================
        // DATA SEKUNDER UKUR
        // untuk error CT R/S/T
        // =========================
        $arusSekunderRUkur = $num('arus_sekunder_r_ukur');
        $arusSekunderSUkur = $num('arus_sekunder_s_ukur');
        $arusSekunderTUkur = $num('arus_sekunder_t_ukur');

        // =========================
        // DATA SEKUNDER METER
        // untuk P Meter dan error CT Total
        // =========================
        $arusSekunderRMeter = $num('arus_sekunder_r_meter');
        $arusSekunderSMeter = $num('arus_sekunder_s_meter');
        $arusSekunderTMeter = $num('arus_sekunder_t_meter');

        $arusSekunderMeterTotal =
            $arusSekunderRMeter +
            $arusSekunderSMeter +
            $arusSekunderTMeter;

        $teganganMeterR = $num('tegangan_meter_r');
        $teganganMeterS = $num('tegangan_meter_s');
        $teganganMeterT = $num('tegangan_meter_t');

        $cosPhiSekunder = $num('cos_phi_sekunder');

        // =========================
        // P METER
        // =========================
        $pMeterR = ($arusSekunderRMeter * $teganganMeterR * $cosPhiSekunder) / 1000;
        $pMeterS = ($arusSekunderSMeter * $teganganMeterS * $cosPhiSekunder) / 1000;
        $pMeterT = ($arusSekunderTMeter * $teganganMeterT * $cosPhiSekunder) / 1000;

        $pMeterTotal = $pMeterR + $pMeterS + $pMeterT;

        // =========================
        // ERROR KWH
        // =========================
        $errorKwhR = $safeDiv((($pMeterR * $faktorKaliDil) - $pPrimerR), $pPrimerR);
        $errorKwhS = $safeDiv((($pMeterS * $faktorKaliDil) - $pPrimerS), $pPrimerS);
        $errorKwhT = $safeDiv((($pMeterT * $faktorKaliDil) - $pPrimerT), $pPrimerT);

        $errorKwhTotal = $safeDiv(
            (($pMeterTotal * $faktorKaliDil) - $pPrimerTotal),
            $pPrimerTotal
        );

        // =========================
        // ERROR CT PER FASA
        // Tetap pakai arus sekunder UKUR
        // =========================
        $errorCtR = $safeDiv(
            (($arusSekunderRUkur * $faktorKaliDil) - $arusPrimerR),
            $arusPrimerR
        );

        $errorCtS = $safeDiv(
            (($arusSekunderSUkur * $faktorKaliDil) - $arusPrimerS),
            $arusPrimerS
        );

        $errorCtT = $safeDiv(
            (($arusSekunderTUkur * $faktorKaliDil) - $arusPrimerT),
            $arusPrimerT
        );

        // =========================
        // ERROR CT TOTAL
        // Khusus total pakai arus sekunder METER
        // agar hasil contoh menjadi -0,58%
        // =========================
        $errorCtTotal = $safeDiv(
            (($arusSekunderMeterTotal * $faktorKaliReal) - $arusPrimerTotal),
            $arusPrimerTotal
        );

        // =========================
        // CATATAN CT
        // =========================
        $catatanCt = ($faktorKaliReal != $faktorKaliDil)
            ? 'CEK CT'
            : 'NORMAL';

        // =========================
        // REKOMENDASI
        // =========================
        if ($errorCtTotal > 0.02 && $errorKwhTotal > 0.02) {
            $rekomendasi = 'GANTI CT';
        } elseif ($errorKwhTotal > 0.02) {
            $rekomendasi = 'GANTI METER';
        } elseif ($errorCtTotal > 0.02) {
            $rekomendasi = 'GANTI METER DAN CT';
        } else {
            $rekomendasi = 'NORMAL';
        }

        return compact(
            'pMeterR',
            'pMeterS',
            'pMeterT',
            'pMeterTotal',
            'errorKwhR',
            'errorKwhS',
            'errorKwhT',
            'errorKwhTotal',
            'errorCtR',
            'errorCtS',
            'errorCtT',
            'errorCtTotal',
            'catatanCt',
            'rekomendasi'
        );
    }
}
