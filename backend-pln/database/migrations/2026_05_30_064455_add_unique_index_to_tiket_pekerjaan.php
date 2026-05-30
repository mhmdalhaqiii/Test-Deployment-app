<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tiket_pekerjaan', function (Blueprint $table) {
            $table->unique('nomor_tiket', 'tiket_pekerjaan_nomor_tiket_unique');
            $table->index(['aset_id', 'tanggal_tiket'], 'tiket_aset_tanggal_index');
        });
    }

    public function down(): void
    {
        Schema::table('tiket_pekerjaan', function (Blueprint $table) {
            $table->dropUnique('tiket_pekerjaan_nomor_tiket_unique');
            $table->dropIndex('tiket_aset_tanggal_index');
        });
    }
};
