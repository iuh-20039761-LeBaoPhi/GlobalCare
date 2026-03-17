<?php
require_once dirname(__DIR__) . '/session.php';
header('Content-Type: application/json; charset=utf-8');

if (!isset($_SESSION['admin_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

require_once '../../config/database.php';

$action = $_GET['action'] ?? '';
$db     = new Database();
$conn   = $db->getConnection();

// ─── LIST ─────────────────────────────────────────────────────────────────────
if ($action === 'list') {
    $filter_status  = $_GET['status'] ?? '';
    $allowed        = ['pending', 'active', 'rejected', 'blocked'];

    if ($filter_status && in_array($filter_status, $allowed)) {
        $stmt = $conn->prepare(
            "SELECT id, full_name, email, phone, company_name, license_number, address,
                    description, status, rejection_reason, created_at
             FROM users WHERE role = 'provider' AND status = ?
             ORDER BY created_at DESC"
        );
        $stmt->execute([$filter_status]);
    } else {
        $stmt = $conn->prepare(
            "SELECT id, full_name, email, phone, company_name, license_number, address,
                    description, status, rejection_reason, created_at
             FROM users WHERE role = 'provider'
             ORDER BY FIELD(status,'pending','active','blocked','rejected'), created_at DESC"
        );
        $stmt->execute();
    }
    echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
    exit;
}

// ─── COUNTS ───────────────────────────────────────────────────────────────────
if ($action === 'counts') {
    $stmt = $conn->prepare(
        "SELECT status, COUNT(*) as cnt FROM users WHERE role = 'provider' GROUP BY status"
    );
    $stmt->execute();
    $counts = ['pending' => 0, 'active' => 0, 'rejected' => 0, 'blocked' => 0];
    foreach ($stmt->fetchAll() as $row) {
        if (isset($counts[$row['status']])) {
            $counts[$row['status']] = (int)$row['cnt'];
        }
    }
    echo json_encode(['success' => true, 'data' => $counts]);
    exit;
}

// ─── APPROVE / REJECT / BLOCK / UNBLOCK ──────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $body        = json_decode(file_get_contents('php://input'), true);
    $provider_id = (int)($body['provider_id'] ?? 0);
    $reason      = trim($body['reason'] ?? '');

    if (!$provider_id) {
        echo json_encode(['success' => false, 'message' => 'Thiếu provider_id']);
        exit;
    }

    // Verify provider exists
    $stmt = $conn->prepare("SELECT id, status FROM users WHERE id = ? AND role = 'provider' LIMIT 1");
    $stmt->execute([$provider_id]);
    $provider = $stmt->fetch();

    if (!$provider) {
        echo json_encode(['success' => false, 'message' => 'Không tìm thấy nhà cung cấp']);
        exit;
    }

    $new_status = null;

    switch ($action) {
        case 'approve':
            $new_status = 'active';
            $reason     = null;
            break;
        case 'reject':
            if (!$reason) {
                echo json_encode(['success' => false, 'message' => 'Vui lòng nhập lý do từ chối']);
                exit;
            }
            $new_status = 'rejected';
            break;
        case 'block':
            if (!$reason) $reason = 'Vi phạm điều khoản dịch vụ';
            $new_status = 'blocked';
            break;
        case 'unblock':
            $new_status = 'active';
            $reason     = null;
            break;
        default:
            echo json_encode(['success' => false, 'message' => 'Hành động không hợp lệ']);
            exit;
    }

    $stmt = $conn->prepare(
        "UPDATE users SET status = ?, rejection_reason = ? WHERE id = ? AND role = 'provider'"
    );
    $stmt->execute([$new_status, $reason, $provider_id]);

    $msgs = [
        'approve' => 'Đã duyệt tài khoản nhà cung cấp',
        'reject'  => 'Đã từ chối tài khoản nhà cung cấp',
        'block'   => 'Đã khóa tài khoản nhà cung cấp',
        'unblock' => 'Đã mở khóa tài khoản nhà cung cấp',
    ];
    echo json_encode(['success' => true, 'message' => $msgs[$action] ?? 'Thành công']);
    exit;
}

echo json_encode(['success' => false, 'message' => 'Invalid request']);
