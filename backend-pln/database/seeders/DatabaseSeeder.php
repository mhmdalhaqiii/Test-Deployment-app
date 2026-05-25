<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Tim;
use App\Models\Petugas;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run()
    {

        // Admin TE
        User::updateOrCreate(
            ['email' => 'admin@pln.co.id'],
            [
                'name' => 'Admin TE',
                'password' => Hash::make('adminTE'),
                'role' => 'admin'
            ]
        );

        // Asisten Manajer TE
        User::updateOrCreate(
            ['email' => 'asmanajer@pln.co.id'],
            [
                'name' => 'Asisten Manajer TE',
                'password' => Hash::make('asmenTE'), //
                'role' => 'manajer'
            ]
        );

        // TL Meter Transaksi
        User::updateOrCreate(
            ['email' => 'tlmeter@pln.co.id'],
            [
                'name' => 'TL Meter Transaksi',
                'password' => Hash::make('tlmeterTE'),
                'role' => 'manajer'
            ]
        );

        // Data Tim
        $tim1 = Tim::updateOrCreate(['id' => 1], ['nama_tim' => 'Tim 1']);
        $tim2 = Tim::updateOrCreate(['id' => 2], ['nama_tim' => 'Tim 2']);

        // Petugas Tim 1
        $akunPetugas1 = User::updateOrCreate(
            ['email' => 'petugas1@pln.co.id'],
            [
                'name' => 'Petugas 1',
                'password' => Hash::make('petugas1TE'),
                'role' => 'petugas'
            ]
        );
        Petugas::updateOrCreate(
            ['user_id' => $akunPetugas1->id],
            ['tim_id' => $tim1->id, 'nama_petugas' => 'Petugas 1']
        );

        $akunPetugas2 = User::updateOrCreate(
            ['email' => 'petugas2@pln.co.id'],
            [
                'name' => 'Petugas 2',
                'password' => Hash::make('petugas2TE'),
                'role' => 'petugas'
            ]
        );
        Petugas::updateOrCreate(
            ['user_id' => $akunPetugas2->id],
            ['tim_id' => $tim1->id, 'nama_petugas' => 'Petugas 2']
        );

        // Petugas Tim 2
        $akunPetugas3 = User::updateOrCreate(
            ['email' => 'petugas3@pln.co.id'],
            [
                'name' => 'Petugas 3',
                'password' => Hash::make('petugas3TE'),
                'role' => 'petugas'
            ]
        );
        Petugas::updateOrCreate(
            ['user_id' => $akunPetugas3->id],
            ['tim_id' => $tim2->id, 'nama_petugas' => 'Petugas 3']
        );

        $akunPetugas4 = User::updateOrCreate(
            ['email' => 'petugas4@pln.co.id'],
            [
                'name' => 'Petugas 4',
                'password' => Hash::make('petugas4TE'),
                'role' => 'petugas'
            ]
        );
        Petugas::updateOrCreate(
            ['user_id' => $akunPetugas4->id],
            ['tim_id' => $tim2->id, 'nama_petugas' => 'Petugas 4']
        );

        $this->command->info('Sinkronisasi akun berhasil!');
    }
}
