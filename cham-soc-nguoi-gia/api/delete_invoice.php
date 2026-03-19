<?php
session_start();
require_once 'db.php';

// Check if user is admin
if (!isset($_SESSION['nguoi_dung_id']) || $_SESSION['vai_tro'] !== 'admin') {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

// Get POST data
$data = json_decode(file_get_contents('php://input'), true);

if (!$data) {
    echo json_encode(['success' => false, 'message' => 'Invalid request']);
    exit;
}

$invoiceId = isset($data['hoa_don_id']) ? intval($data['hoa_don_id']) : 0;

if ($invoiceId === 0) {
    echo json_encode(['success' => false, 'message' => 'Invalid invoice ID']);
    exit;
}

// Delete invoice (cascade will delete related records)
$sql = "DELETE FROM hoa_don WHERE id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param('i', $invoiceId);

if ($stmt->execute()) {
    echo json_encode([
        'success' => true,
        'message' => 'Đã xóa hóa đơn thành công'
    ]);
} else {
    echo json_encode(['success' => false, 'message' => 'Xóa hóa đơn thất bại: ' . $conn->error]);
}

$stmt->close();
$conn->close();
?>
