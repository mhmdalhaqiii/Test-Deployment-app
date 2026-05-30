<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('aset_app_tr', function (Blueprint $table) {
            $table->unique('pelanggan_id', 'aset_app_tr_pelanggan_id_unique');
            $table->index('nomor_kwh', 'aset_app_tr_nomor_kwh_index');
        });
    }

    public function down(): void
    {
        Schema::table('aset_app_tr', function (Blueprint $table) {
            $table->dropUnique('aset_app_tr_pelanggan_id_unique');
            $table->dropIndex('aset_app_tr_nomor_kwh_index');
        });
    }
};
