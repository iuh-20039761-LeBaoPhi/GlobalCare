<?php
session_start();
require_once 'db.php';

// Check if user is logged in
if (!isset($_SESSION['nguoi_dung_id'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

// Get POST data
$data = json_decode(file_get_contents('php://input'), true);

if (!$data) {
    echo json_encode(['success' => false, 'message' => 'Invalid request']);
    exit;
}

$userId = $_SESSION['nguoi_dung_id'];
$userRole = $_SESSION['vai_tro'];
$invoiceId = isset($data['hoa_don_id']) ? intval($data['hoa_don_id']) : 0;
$trang_thai = isset($data['trang_thai']) ? sanitize($data['trang_thai']) : '';

if ($invoiceId === 0 || empty($trang_thai)) {
    echo json_encode(['success' => false, 'message' => 'Invalid data']);
    exit;
}

// Validate trang_thai
$validStatuses = ['cho_duyet', 'da_duyet', 'dang_thuc_hien', 'hoan_thanh', 'da_huy'];
if (!in_array($trang_thai, $validStatuses)) {
    echo json_encode(['success' => false, 'message' => 'Invalid trang_thai']);
    exit;
}

// Check permissions
if ($userRole === 'nhan_vien') {
    // Employee can only update their own cong_viec
    $checkSql = "SELECT id FROM hoa_don WHERE id = ? AND nhan_vien_id = ?";
    $checkStmt = $conn->prepare($checkSql);
    $checkStmt->bind_param('ii', $invoiceId, $userId);
} else if ($userRole === 'admin') {
    // Admin can update any invoice
    $checkSql = "SELECT id FROM hoa_don WHERE id = ?";
    $checkStmt = $conn->prepare($checkSql);
    $checkStmt->bind_param('i', $invoiceId);
} else {
    echo json_encode(['success' => false, 'message' => 'Permission denied']);
    exit;
}

$checkStmt->execute();
$checkResult = $checkStmt->get_result();

if ($checkResult->num_rows === 0) {
    echo json_encode(['success' => false, 'message' => 'Không tìm thấy hóa đơn hoặc bạn không có quyền cập nhật']);
    exit;
}

// Update invoice trang_thai
$updateSql = "UPDATE hoa_don SET trang_thai = ? WHERE id = ?";
$updateStmt = $conn->prepare($updateSql);
$updateStmt->bind_param('si', $trang_thai, $invoiceId);

if ($updateStmt->execute()) {
    // UPDATE cong_viec_nhan_vien if employee
    if ($userRole === 'nhan_vien') {
        $jobUpdateSql = "UPDATE cong_viec_nhan_vien SET trang_thai = ?, ngay_hoan_thanh = IF(? = 'hoan_thanh', NOW(), NULL) WHERE hoa_don_id = ? AND nhan_vien_id = ?";
        $jobUpdateStmt = $conn->prepare($jobUpdateSql);
        $jobUpdateStmt->bind_param('ssii', $trang_thai, $trang_thai, $invoiceId, $userId);
        $jobUpdateStmt->execute();
        $jobUpdateStmt->close();
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Cập nhật trạng thái thành công'
    ]);
} else {
    echo json_encode(['success' => false, 'message' => 'Cập nhật thất bại: ' . $conn->error]);
}

$updateStmt->close();
$conn->close();
?>
