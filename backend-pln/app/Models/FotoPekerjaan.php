<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FotoPekerjaan extends Model
{
    protected $table = 'foto_pekerjaan';

    protected $fillable = [
        'pekerjaan_id',

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

    public function pekerjaan()
    {
        return $this->belongsTo(PekerjaanPemeliharaan::class);
    }
}
