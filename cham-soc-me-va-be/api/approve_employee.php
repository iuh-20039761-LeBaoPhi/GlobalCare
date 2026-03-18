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

$employeeId = isset($data['nhan_vien_id']) ? intval($data['nhan_vien_id']) : 0;
$trang_thai = isset($data['trang_thai']) ? sanitize($data['trang_thai']) : '';

if ($employeeId === 0 || empty($trang_thai)) {
    echo json_encode(['success' => false, 'message' => 'Invalid data']);
    exit;
}

// Validate trang_thai
if (!in_array($trang_thai, ['da_duyet', 'tu_choi', 'cho_duyet'])) {
    echo json_encode(['success' => false, 'message' => 'Invalid trang_thai']);
    exit;
}

// Update employee profile trang_thai
$sql = "UPDATE ho_so_nhan_vien SET trang_thai = ? WHERE nguoi_dung_id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param('si', $trang_thai, $employeeId);

if ($stmt->execute()) {
    $message = $trang_thai === 'da_duyet' ? 'Đã duyệt nhân viên' : ($trang_thai === 'tu_choi' ? 'Đã từ chối nhân viên' : 'Đã cập nhật trạng thái');
    echo json_encode([
        'success' => true,
        'message' => $message
    ]);
} else {
    echo json_encode(['success' => false, 'message' => 'Cập nhật thất bại: ' . $conn->error]);
}

$stmt->close();
$conn->close();
?>
