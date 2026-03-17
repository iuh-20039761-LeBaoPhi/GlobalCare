<?php
require_once dirname(__DIR__) . '/session.php';
header('Content-Type: application/json; charset=utf-8');
require_once '../../config/database.php';

if (!isset($_SESSION['user_id']) || $_SESSION['user_role'] !== 'customer') {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Chưa đăng nhập']);
    exit;
}

$action  = $_GET['action'] ?? '';
$user_id = (int)$_SESSION['user_id'];

try {
    $db   = new Database();
    $conn = $db->getConnection();

    if ($action === 'getMyBookings') {
        // JOIN với users để lấy thông tin nhà cung cấp thực hiện đơn
        $stmt = $conn->prepare(
            "SELECT
                b.id, b.car_id, b.car_name,
                b.pickup_date, b.return_date, b.total_days,
                b.total_price, b.addon_total, b.pickup_location,
                b.status, b.created_at,
                p.id            AS provider_id,
                p.full_name     AS provider_name,
                p.phone         AS provider_phone,
                p.company_name  AS provider_company
             FROM bookings b
             LEFT JOIN users p ON p.id = b.provider_id AND p.role = 'provider'
             WHERE b.user_id = ?
             ORDER BY b.created_at DESC"
        );
        $stmt->execute([$user_id]);
        echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
        exit;
    }

    echo json_encode(['success' => false, 'message' => 'Invalid action']);

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Lỗi hệ thống']);
}
