<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Pelanggan extends Model
{
    protected $table = 'pelanggan';

    protected $fillable = [
        'unitup',
        'idpel',
        'nama_pelanggan',
        'alamat_pelanggan',
        'tarif',
        'daya',
        'tikor'
    ];

    public function aset()
    {
        return $this->hasMany(AsetAppTr::class);
    }

    public function getTarifScoreAttribute()
    {
        $tarif = trim(strtoupper($this->tarif));

        return match (true){
            str_starts_with($tarif, 'P3'),
            str_starts_with($tarif, 'P1'),
            str_starts_with($tarif, 'R3') => 5,

            $tarif === 'L' => 4,

            str_starts_with($tarif, 'B2'),
            str_starts_with($tarif, 'LB2'),
            str_starts_with($tarif, 'I2') => 3,

            str_starts_with($tarif, 'S1') => 1,

            default => 1,

        };
    }
}
