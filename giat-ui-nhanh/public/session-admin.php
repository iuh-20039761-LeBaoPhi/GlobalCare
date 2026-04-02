<?php
declare(strict_types=1);

session_start();

header('Content-Type: application/json; charset=utf-8');

function respond(int $statusCode, array $payload): void
{
    http_response_code($statusCode);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

$action = isset($_GET['action']) ? (string) $_GET['action'] : 'set';

if (!in_array($action, ['get', 'set', 'logout'], true)) {
    respond(400, [
        'success' => false,
        'message' => 'Action không hợp lệ.',
    ]);
}

if ($action === 'get') {
    $admin = isset($_SESSION['admin']) && is_array($_SESSION['admin']) ? $_SESSION['admin'] : null;

    respond(200, [
        'success' => true,
        'hasAdmin' => $admin !== null,
        'admin' => $admin,
    ]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, [
        'success' => false,
        'message' => 'Phương thức không được hỗ trợ.',
    ]);
}

if ($action === 'logout') {
    unset($_SESSION['admin']);

    respond(200, [
        'success' => true,
        'message' => 'Đã đăng xuất admin.',
    ]);
}

$rawBody = file_get_contents('php://input');
$input = json_decode((string) $rawBody, true);

if (!is_array($input)) {
    respond(400, [
        'success' => false,
        'message' => 'Dữ liệu không hợp lệ.',
    ]);
}

$adminInput = [];
if (isset($input['admin']) && is_array($input['admin'])) {
    $adminInput = $input['admin'];
} else {
    $adminInput = $input;
}

$adminId = isset($adminInput['id']) ? (string) $adminInput['id'] : '';
$adminEmail = isset($adminInput['email']) ? trim((string) $adminInput['email']) : '';

if ($adminEmail === '') {
    respond(400, [
        'success' => false,
        'message' => 'Thiếu email admin để tạo phiên đăng nhập.',
    ]);
}

$_SESSION['admin'] = [
    'id' => $adminId,
    'email' => $adminEmail,
];

respond(200, [
    'success' => true,
    'message' => 'Đăng nhập admin thành công.',
    'admin' => $_SESSION['admin'],
]);