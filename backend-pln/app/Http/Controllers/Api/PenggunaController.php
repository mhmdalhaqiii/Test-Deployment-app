<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Petugas;
use App\Models\Tim;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class PenggunaController extends Controller
{
    public function index()
    {
        $users = User::with(['petugas.tim'])
            ->orderBy('id', 'asc')
            ->get();

        $tim = Tim::orderBy('nama_tim', 'asc')->get();

        return response()->json([
            'success' => true,
            'data' => $users,
            'tim_options' => $tim,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'role' => 'required|in:admin,manajer,petugas',

            'nama_petugas' => 'required_if:role,petugas|nullable|string|max:255',
            'nama_tim' => 'required_if:role,petugas|nullable|string|max:255',
        ]);

        DB::beginTransaction();

        try {
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
                'role' => $data['role'],
            ]);

            if ($data['role'] === 'petugas') {
                $tim = Tim::firstOrCreate([
                    'nama_tim' => $data['nama_tim'],
                ]);

                Petugas::create([
                    'user_id' => $user->id,
                    'tim_id' => $tim->id,
                    'nama_petugas' => $data['nama_petugas'],
                ]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Pengguna berhasil ditambahkan',
                'data' => $user->load(['petugas.tim']),
            ], 201);
        } catch (\Throwable $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Gagal menambahkan pengguna',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $user = User::with(['petugas.tim'])->findOrFail($id);

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => [
                'required',
                'email',
                Rule::unique('users', 'email')->ignore($user->id),
            ],
            'password' => 'nullable|string|min:6',
            'role' => 'required|in:admin,manajer,petugas',

            'nama_petugas' => 'required_if:role,petugas|nullable|string|max:255',
            'nama_tim' => 'required_if:role,petugas|nullable|string|max:255',
        ]);

        DB::beginTransaction();

        try {
            $payloadUser = [
                'name' => $data['name'],
                'email' => $data['email'],
                'role' => $data['role'],
            ];

            if (!empty($data['password'])) {
                $payloadUser['password'] = Hash::make($data['password']);
            }

            $user->update($payloadUser);

            if ($data['role'] === 'petugas') {
                $tim = Tim::firstOrCreate([
                    'nama_tim' => $data['nama_tim'],
                ]);

                Petugas::updateOrCreate(
                    ['user_id' => $user->id],
                    [
                        'tim_id' => $tim->id,
                        'nama_petugas' => $data['nama_petugas'],
                    ]
                );
            } else {
                Petugas::where('user_id', $user->id)->delete();
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Pengguna berhasil diperbarui',
                'data' => $user->fresh(['petugas.tim']),
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Gagal memperbarui pengguna',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function destroy(Request $request, $id)
    {
        $user = User::findOrFail($id);

        if ($request->user()->id === $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Akun yang sedang login tidak boleh dihapus.',
            ], 422);
        }

        DB::beginTransaction();

        try {
            Petugas::where('user_id', $user->id)->delete();

            $user->tokens()->delete();
            $user->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Pengguna berhasil dihapus',
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus pengguna',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
