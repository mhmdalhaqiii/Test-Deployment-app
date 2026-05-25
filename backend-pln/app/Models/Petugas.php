<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
class Petugas extends Model
{
    protected $table = 'petugas';

    protected $fillable = [
        'user_id',
        'tim_id',
        'nama_petugas',
    ];

    public function tim(){
        return $this->belongsTo(Tim::class);
    }

    public function user(){
        return $this->belongsTo(User::class, 'user_id');
    }
}
