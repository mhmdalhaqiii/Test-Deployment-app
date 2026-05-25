<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TiketPekerjaan extends Model
{
    protected $table = 'tiket_pekerjaan';

    protected $fillable = [
        'aset_id',
        'nomor_tiket',
        'tanggal_tiket',
        'status',
        'tim_id'
    ];

    public function aset()
    {
        return $this->belongsTo(AsetAppTr::class, 'aset_id');
    }

    public function pekerjaan()
    {
        return $this->hasOne(PekerjaanPemeliharaan::class, 'tiket_id')->latestOfMany();
    }

    public function tim()
    {
        return $this->belongsTo(Tim::class, 'tim_id');
    }
}
