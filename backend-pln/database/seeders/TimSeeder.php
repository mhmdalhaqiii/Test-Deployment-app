<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TimSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('tim')->insert([
            ['nama_tim' => 'Tim 1'],
            ['nama_tim' => 'Tim 2'],
        ]);
    }
}
