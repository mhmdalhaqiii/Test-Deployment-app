<?php

namespace App\Services;

use Google\Client;
use Google\Service\Drive;
use Google\Service\Drive\DriveFile;
use Google\Service\Drive\Permission;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;

class GoogleDriveService
{
    protected Drive $drive;
    protected ImageManager $imageManager;

    public function __construct()
    {
        $client = new Client();

        $client->setClientId(config('google.client_id'));
        $client->setClientSecret(config('google.client_secret'));
        $client->setRedirectUri(config('google.redirect_uri'));
        $client->addScope(Drive::DRIVE);

        $tokenPath = config('google.token_path');

        if (!is_string($tokenPath) || empty($tokenPath)) {
            throw new \Exception('Token path Google Drive belum dikonfigurasi.');
        }

        if (!file_exists($tokenPath)) {
            throw new \Exception('Token Google Drive belum ada. Buka /google/auth dulu untuk login Google.');
        }

        $token = json_decode(file_get_contents($tokenPath), true);

        if (!$token) {
            throw new \Exception('Token Google Drive tidak valid.');
        }

        $client->setAccessToken($token);

        if ($client->isAccessTokenExpired()) {
            $refreshToken = $token['refresh_token'] ?? null;

            if (!$refreshToken) {
                throw new \Exception('Refresh token tidak ditemukan. Ulangi login Google lewat /google/auth.');
            }

            $newToken = $client->fetchAccessTokenWithRefreshToken($refreshToken);

            if (isset($newToken['error'])) {
                throw new \Exception('Gagal refresh token Google: ' . json_encode($newToken));
            }

            $newToken['refresh_token'] = $refreshToken;

            file_put_contents($tokenPath, json_encode($newToken, JSON_PRETTY_PRINT));

            $client->setAccessToken($newToken);
        }

        $this->drive = new Drive($client);
        $this->imageManager = new ImageManager(new Driver());
    }

    public function upload($file, string $fileName, string $parentFolderId): string
    {
        $maxSize = 5 * 1024 * 1024;
        $data = file_get_contents($file->getRealPath());
        $mime = $file->getMimeType();

        if (strlen($data) > $maxSize) {
            $image = $this->imageManager->read($file->getRealPath());

            $image->scaleDown(width: 1920);

            $quality = 85;

            do {
                $encoded = $image->toJpeg($quality);

                $data = $encoded->toString();
                $mime = 'image/jpeg';

                $quality -= 10;
            } while (strlen($data) > $maxSize && $quality >= 50);
        }

        if (strlen($data) > $maxSize) {
            throw new \Exception("Ukuran foto {$fileName} tetap melebihi 5MB setelah dikompresi.");
        }

        $driveFile = new DriveFile([
            'name' => $fileName,
            'parents' => [$parentFolderId],
        ]);

        $result = $this->drive->files->create($driveFile, [
            'data' => $data,
            'mimeType' => $mime,
            'uploadType' => 'multipart',
            'fields' => 'id',
        ]);

        $permission = new Permission([
            'type' => 'anyone',
            'role' => 'reader',
        ]);

        $this->drive->permissions->create($result->id, $permission);

        return $result->id;
    }
}
