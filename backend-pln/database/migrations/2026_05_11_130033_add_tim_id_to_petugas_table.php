<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('petugas', function (Blueprint $table) {
            $table->foreignId('tim_id')->nullable()->after('user_id')->constrained('tim')->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::table('petugas', function (Blueprint $table) {
            $table->dropForeign(['tim_id']);
            $table->dropColumn('tim_id');
        });
    }
};
