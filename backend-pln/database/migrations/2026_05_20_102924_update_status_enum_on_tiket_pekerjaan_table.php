<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

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
                'selesai'
            ) DEFAULT 'tersedia'
        ");
    }

    public function down(): void
    {
        DB::statement("
            ALTER TABLE tiket_pekerjaan
            MODIFY status ENUM(
                'tersedia',
                'berjalan',
                'dikerjakan',
                'inReview',
                'selesai'
            ) DEFAULT 'tersedia'
        ");
    }
};
