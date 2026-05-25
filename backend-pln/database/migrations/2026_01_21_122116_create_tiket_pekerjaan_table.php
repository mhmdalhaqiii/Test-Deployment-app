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
        Schema::create('tiket_pekerjaan', function (Blueprint $table) {
            $table->id();
            $table->foreignId('aset_id')->constrained('aset_app_tr');
            $table->string('nomor_tiket')->unique()->nullable();
            $table->date('tanggal_tiket');
            $table->enum('status', ['tersedia', 'dikerjakan', 'inReview', 'selesai'])->default('tersedia');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tiket_pekerjaan');
    }
};
