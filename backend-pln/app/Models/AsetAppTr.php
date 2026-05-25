<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AsetAppTr extends Model
{
    protected $table = 'aset_app_tr';

    protected $fillable = [
        'pelanggan_id',
        'nomor_kwh',
        'merek_kwh',
        'thtera_kwh',
        'faktor_kali_dil',
        'tikor_baru',
    ];

    // Relasi
    public function pelanggan()
    {
        return $this->belongsTo(Pelanggan::class);
    }

    public function tiket()
    {
        return $this->hasMany(TiketPekerjaan::class, 'aset_id');
    }

    public function getSelisihTahunTeraAttribute()
    {
        if(empty($this->thtera_kwh)){
            return 0;
        }

        $tahun_tera = (int) substr(trim($this->thtera_kwh), 0, 4);

        $selisih = (int) date('Y') - $tahun_tera;

        return $selisih < 0 ? 0 : $selisih;
    }
}
