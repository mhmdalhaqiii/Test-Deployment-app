<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('aset_app_tr', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pelanggan_id')->constrained('pelanggan')->cascadeOnDelete();
            $table->string('nomor_kwh')->nullable();
            $table->string('merek_kwh')->nullable();
            $table->year('thtera_kwh')->nullable();
            $table->decimal('faktor_kali_dil', 8, 2);
            $table->string('tikor_baru')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('aset_app_tr');
    }
};
