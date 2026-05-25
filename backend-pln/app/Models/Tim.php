<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Tim extends Model
{
    protected $table = 'tim';

    protected $fillable = ['nama_tim'];

    public function petugas(){
        return $this->hasMany(Petugas::class, 'tim_id');
    }
}
