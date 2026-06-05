<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("
            ALTER TABLE tiket_pekerjaan
            MODIFY status ENUM(
                'tersedia',
                'berjalan',
                'dikerjakan',
                'inReview',
                'menungguValidasi',
                'revisiAdmin',
                'selesai'
            ) NOT NULL DEFAULT 'tersedia'
        ");

        Schema::table('tiket_pekerjaan', function (Blueprint $table) {
            if (!Schema::hasColumn('tiket_pekerjaan', 'catatan_validasi')) {
                $table->text('catatan_validasi')->nullable()->after('status');
            }
        });
    }

    public function down(): void
    {
        DB::table('tiket_pekerjaan')
            ->where('status', 'revisiAdmin')
            ->update(['status' => 'inReview']);

        Schema::table('tiket_pekerjaan', function (Blueprint $table) {
            if (Schema::hasColumn('tiket_pekerjaan', 'catatan_validasi')) {
                $table->dropColumn('catatan_validasi');
            }
        });

        DB::statement("
            ALTER TABLE tiket_pekerjaan
            MODIFY status ENUM(
                'tersedia',
                'berjalan',
                'dikerjakan',
                'inReview',
                'menungguValidasi',
                'selesai'
            ) NOT NULL DEFAULT 'tersedia'
        ");
    }
};
