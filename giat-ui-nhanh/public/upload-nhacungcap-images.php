<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

function respond(int $statusCode, array $payload): void
{
    http_response_code($statusCode);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, [
        'success' => false,
        'message' => 'Phương thức không được hỗ trợ.',
    ]);
}

$targetDir = __DIR__ . '/asset/image/upload/nhacungcap';
if (!is_dir($targetDir) && !mkdir($targetDir, 0777, true) && !is_dir($targetDir)) {
    respond(500, [
        'success' => false,
        'message' => 'Không thể tạo thư mục upload.',
    ]);
}

$maxSize = 5 * 1024 * 1024;
$allowedMimes = [
    'image/jpeg' => 'jpg',
    'image/png' => 'png',
];

function saveImageFile(string $field, string $prefix, int $maxSize, array $allowedMimes, string $targetDir): ?string
{
    if (!isset($_FILES[$field])) {
        return null;
    }

    $file = $_FILES[$field];

    if (!is_array($file) || is_array($file['name'])) {
        throw new RuntimeException('Mỗi mục chỉ được tải lên 1 ảnh.');
    }

    if ((int) $file['error'] === UPLOAD_ERR_NO_FILE) {
        return null;
    }

    if ((int) $file['error'] !== UPLOAD_ERR_OK) {
        throw new RuntimeException('Tải ảnh thất bại.');
    }

    if ((int) $file['size'] <= 0 || (int) $file['size'] > $maxSize) {
        throw new RuntimeException('Ảnh vượt quá dung lượng cho phép (5MB).');
    }

    $tmpName = (string) $file['tmp_name'];
    if (!is_uploaded_file($tmpName)) {
        throw new RuntimeException('File upload không hợp lệ.');
    }

    $mime = (string) (mime_content_type($tmpName) ?: '');
    if (!isset($allowedMimes[$mime])) {
        throw new RuntimeException('Chỉ chấp nhận ảnh JPG hoặc PNG.');
    }

    $ext = $allowedMimes[$mime];
    $fileName = sprintf('%s_%s_%s.%s', $prefix, date('YmdHis'), bin2hex(random_bytes(4)), $ext);
    $destination = $targetDir . DIRECTORY_SEPARATOR . $fileName;

    if (!move_uploaded_file($tmpName, $destination)) {
        throw new RuntimeException('Không thể lưu ảnh lên máy chủ.');
    }

    return $fileName;
}

try {
    $avatar = saveImageFile('avatar', 'avatar', $maxSize, $allowedMimes, $targetDir);
    $cccdFront = saveImageFile('cccdFront', 'cccd_front', $maxSize, $allowedMimes, $targetDir);
    $cccdBack = saveImageFile('cccdBack', 'cccd_back', $maxSize, $allowedMimes, $targetDir);

    respond(200, [
        'success' => true,
        'files' => [
            'avatar' => $avatar,
            'cccdFront' => $cccdFront,
            'cccdBack' => $cccdBack,
        ],
    ]);
} catch (Throwable $e) {
    respond(400, [
        'success' => false,
        'message' => $e->getMessage(),
    ]);
}
