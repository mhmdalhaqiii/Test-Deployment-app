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
        $tarif = strtoupper(trim($this->tarif));

        $mapping = [
            'P3' => 1699.53,
            'P1' => 1699.53,
            'R3' => 1699.53,
            'L'  => 1644.52,
            'B2' => 1444.70,
            'LB2' => 1444.70,
            'I2' => 1444.70,
            'S1' => 562,
        ];

        return $mapping[$tarif] ?? 0;
    }
}
