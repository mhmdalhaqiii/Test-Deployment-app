<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('foto_pekerjaan', function (Blueprint $table) {
            $table->id();

            $table->foreignId('pekerjaan_id')
                ->constrained('pekerjaan_pemeliharaan')
                ->onDelete('cascade');

            // Arus Primer
            $table->string('foto_arus_primer_r')->nullable();
            $table->string('foto_arus_primer_s')->nullable();
            $table->string('foto_arus_primer_t')->nullable();

            // Tegangan Primer
            $table->string('foto_tegangan_primer_r')->nullable();
            $table->string('foto_tegangan_primer_s')->nullable();
            $table->string('foto_tegangan_primer_t')->nullable();

            // Arus Sekunder Ukur
            $table->string('foto_arus_sekunder_r_ukur')->nullable();
            $table->string('foto_arus_sekunder_s_ukur')->nullable();
            $table->string('foto_arus_sekunder_t_ukur')->nullable();

            // Arus Sekunder Meter
            $table->string('foto_arus_sekunder_r_meter')->nullable();
            $table->string('foto_arus_sekunder_s_meter')->nullable();
            $table->string('foto_arus_sekunder_t_meter')->nullable();

            // Tegangan kWh Meter
            $table->string('foto_tegangan_kwh_r')->nullable();
            $table->string('foto_tegangan_kwh_s')->nullable();
            $table->string('foto_tegangan_kwh_t')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('foto_pekerjaan');
    }
};
