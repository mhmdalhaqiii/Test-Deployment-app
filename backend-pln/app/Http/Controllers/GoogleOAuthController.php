<?php

namespace App\Http\Controllers;

use Google\Client;
use Google\Service\Drive;
use Illuminate\Http\Request;

class GoogleOAuthController extends Controller
{
    private function makeClient(): Client
    {
        $client = new Client();

        $client->setClientId(config('google.client_id'));
        $client->setClientSecret(config('google.client_secret'));
        $client->setRedirectUri(config('google.redirect_uri'));

        $client->addScope(Drive::DRIVE);

        $client->setAccessType('offline');
        $client->setPrompt('consent');
        $client->setIncludeGrantedScopes(true);

        return $client;
    }

    public function redirect()
    {
        $client = $this->makeClient();

        return redirect()->away($client->createAuthUrl());
    }

    public function callback(Request $request)
{
    if (!$request->has('code')) {
        return response()->json([
            'success' => false,
            'message' => 'Authorization code tidak ditemukan.',
        ], 400);
    }

    $client = $this->makeClient();

    $token = $client->fetchAccessTokenWithAuthCode($request->code);

    if (isset($token['error'])) {
        return response()->json([
            'success' => false,
            'message' => 'Gagal mengambil token Google.',
            'error' => $token,
        ], 500);
    }

    $tokenPath = config('google.token_path');

    if (!is_string($tokenPath) || empty($tokenPath)) {
        return response()->json([
            'success' => false,
            'message' => 'Token path Google belum dikonfigurasi.',
        ], 500);
    }

    file_put_contents(
        $tokenPath,
        json_encode($token, JSON_PRETTY_PRINT)
    );

    return response()->json([
        'success' => true,
        'message' => 'Google Drive berhasil dihubungkan. Token sudah tersimpan.',
        'token_path' => $tokenPath,
    ]);
}
}
