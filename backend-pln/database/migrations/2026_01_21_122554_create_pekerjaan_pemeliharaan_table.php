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
        Schema::create('pekerjaan_pemeliharaan', function (Blueprint $table) {
            $table->id();

            // Relasi
            $table->foreignId('tiket_id')->constrained('tiket_pekerjaan');
            $table->foreignId('petugas_id')->constrained('petugas');
            $table->foreignId('tim_id')->constrained('tim');

            // Identitas Pemeriksaan
            $table->string('idpel');
            $table->enum('pemadaman', ['padam', 'tidak padam']);
            $table->enum('konstruksi_app', ['kubikel', 'non kubikel']);

            // Faktor
            $table->decimal('faktor_kali_dil', 15, 8)->nullable();
            $table->decimal('faktor_kali_real', 15, 8)->nullable();

            // Arus Primer
            $table->decimal('arus_primer_r_ukur', 15, 8)->nullable();
            $table->decimal('arus_primer_s_ukur', 15, 8)->nullable();
            $table->decimal('arus_primer_t_ukur', 15, 8)->nullable();

            // Tegangan Primer
            $table->decimal('tegangan_primer_r_ukur', 15, 8)->nullable();
            $table->decimal('tegangan_primer_s_ukur', 15, 8)->nullable();
            $table->decimal('tegangan_primer_t_ukur', 15, 8)->nullable();

            // Daya Primer
            $table->decimal('cos_phi_primer', 15, 8)->nullable();
            $table->decimal('p_primer_r', 15, 8)->nullable();
            $table->decimal('p_primer_s', 15, 8)->nullable();
            $table->decimal('p_primer_t', 15, 8)->nullable();
            $table->decimal('p_primer_total', 15, 8)->nullable();

            // Arus Sekunder Ukur
            $table->decimal('arus_sekunder_r_ukur', 15, 8)->nullable();
            $table->decimal('arus_sekunder_s_ukur', 15, 8)->nullable();
            $table->decimal('arus_sekunder_t_ukur', 15, 8)->nullable();

            // Arus Sekunder Meter
            $table->decimal('arus_sekunder_r_meter', 15, 8)->nullable();
            $table->decimal('arus_sekunder_s_meter', 15, 8)->nullable();
            $table->decimal('arus_sekunder_t_meter', 15, 8)->nullable();

            // Tegangan Meter
            $table->decimal('tegangan_meter_r', 15, 8)->nullable();
            $table->decimal('tegangan_meter_s', 15, 8)->nullable();
            $table->decimal('tegangan_meter_t', 15, 8)->nullable();

            // Daya Meter
            $table->decimal('cos_phi_sekunder', 15, 8)->nullable();
            $table->decimal('p_meter_r', 15, 8)->nullable();
            $table->decimal('p_meter_s', 15, 8)->nullable();
            $table->decimal('p_meter_t', 15, 8)->nullable();
            $table->decimal('p_meter_total', 15, 8)->nullable();

            // Error kWh
            // Disimpan dalam bentuk rasio, contoh -0.0212 = -2.12%
            $table->decimal('error_kwh_r', 15, 10)->nullable();
            $table->decimal('error_kwh_s', 15, 10)->nullable();
            $table->decimal('error_kwh_t', 15, 10)->nullable();
            $table->decimal('error_kwh_total', 15, 10)->nullable();

            // Error CT
            // Disimpan dalam bentuk rasio, contoh -0.0058 = -0.58%
            $table->decimal('error_ct_r', 15, 10)->nullable();
            $table->decimal('error_ct_s', 15, 10)->nullable();
            $table->decimal('error_ct_t', 15, 10)->nullable();
            $table->decimal('error_ct_total', 15, 10)->nullable();

            // Box & CT
            $table->text('catatan_ct')->nullable();
            $table->text('rekomendasi')->nullable();
            $table->string('merk_box')->nullable();
            $table->string('no_seri_box')->nullable();
            $table->year('tahun_box')->nullable();
            $table->string('kondisi_box_segel_kwh')->nullable();

            // Catatan & Lokasi
            $table->text('catatan')->nullable();
            $table->string('tikor_baru')->nullable();

            // Waktu
            $table->date('tanggal');
            $table->time('jam');
            $table->text('keterangan')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pekerjaan_pemeliharaan');
    }
};
