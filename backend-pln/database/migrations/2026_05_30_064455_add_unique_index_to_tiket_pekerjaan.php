<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private function indexExists(string $table, string $indexName): bool
    {
        $database = DB::getDatabaseName();

        $result = DB::select(
            "SELECT COUNT(1) AS total
             FROM information_schema.statistics
             WHERE table_schema = ?
             AND table_name = ?
             AND index_name = ?",
            [$database, $table, $indexName]
        );

        return (int) ($result[0]->total ?? 0) > 0;
    }

    public function up(): void
    {
        if (!$this->indexExists('tiket_pekerjaan', 'tiket_aset_tanggal_index')) {
            Schema::table('tiket_pekerjaan', function (Blueprint $table) {
                $table->index(['aset_id', 'tanggal_tiket'], 'tiket_aset_tanggal_index');
            });
        }
    }

    public function down(): void
    {
        if ($this->indexExists('tiket_pekerjaan', 'tiket_aset_tanggal_index')) {
            Schema::table('tiket_pekerjaan', function (Blueprint $table) {
                $table->dropIndex('tiket_aset_tanggal_index');
            });
        }
    }
};
