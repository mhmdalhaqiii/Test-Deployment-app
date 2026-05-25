<?php

namespace App\Console\Commands;

use App\Models\TiketPekerjaan;
use Illuminate\Console\Command;

class ResetTiketBerjalan extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:reset-tiket-berjalan';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Command description';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $tiketDiambil = TiketPekerjaan::where('status', 'berjalan');
        $jumlah = $tiketDiambil->count();

        if($jumlah > 0){
            $tiketDiambil->update([
                'status' => 'tersedia',
                'tim_id' => null
            ]);

            $this->info("Berhasil mereset {$jumlah} tiket kembali ke 'tersedia'.");
        } else{
            $this->info("Tidak ada tiket yang masih berjalan hari ini");
        }
    }
}
