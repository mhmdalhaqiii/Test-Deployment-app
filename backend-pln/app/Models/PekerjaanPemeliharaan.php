<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PekerjaanPemeliharaan extends Model
{
    protected $table = 'pekerjaan_pemeliharaan';

    protected $fillable = [
        'tiket_id',
        'petugas_id',
        'tim_id',
        'idpel',
        'pemadaman',
        'konstruksi_app',
        'faktor_kali_dil',
        'faktor_kali_real',

        // primer
        'arus_primer_r_ukur','arus_primer_s_ukur','arus_primer_t_ukur',
        'tegangan_primer_r_ukur','tegangan_primer_s_ukur','tegangan_primer_t_ukur',
        'cos_phi_primer','p_primer_r','p_primer_s','p_primer_t','p_primer_total',

        // sekunder
        'arus_sekunder_r_ukur','arus_sekunder_s_ukur','arus_sekunder_t_ukur',
        'arus_sekunder_r_meter','arus_sekunder_s_meter','arus_sekunder_t_meter',
        'tegangan_meter_r','tegangan_meter_s','tegangan_meter_t',
        'cos_phi_sekunder','p_meter_r','p_meter_s','p_meter_t','p_meter_total',

        // error
        'error_kwh_r','error_kwh_s','error_kwh_t','error_kwh_total',
        'error_ct_r','error_ct_s','error_ct_t','error_ct_total',

        // lainnya
        'catatan_ct','rekomendasi',
        'merk_box','no_seri_box','tahun_box','kondisi_box_segel_kwh',
        'catatan','tikor_baru',
        'tanggal','jam','keterangan'
    ];

    public function foto(){
        return $this->hasOne(FotoPekerjaan::class, 'pekerjaan_id');
    }

    public function tiket()
{
    return $this->belongsTo(TiketPekerjaan::class, 'tiket_id');
}

public function petugas()
{
    return $this->belongsTo(Petugas::class, 'petugas_id');
}

public function tim()
{
    return $this->belongsTo(Tim::class, 'tim_id');
}

}
