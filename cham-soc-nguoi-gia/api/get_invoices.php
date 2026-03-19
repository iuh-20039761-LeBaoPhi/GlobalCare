<?php
session_start();
require_once 'db.php';

// Check if user is logged in
if (!isset($_SESSION['nguoi_dung_id'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$userId = $_SESSION['nguoi_dung_id'];
$userRole = $_SESSION['vai_tro'];

if ($userRole === 'admin') {
    // Admin sees all invoices
    $sql = "SELECT i.*, u.ten as employee_name, u.dien_thoai as employee_phone 
            FROM hoa_don i 
            LEFT JOIN nguoi_dung u ON i.nhan_vien_id = u.id 
            ORDER BY i.ngay_tao DESC";
    $stmt = $conn->prepare($sql);
} else if ($userRole === 'nhan_vien') {
    // Employee sees cong_viec assigned to them or available cong_viec
    $sql = "SELECT i.*, ej.trang_thai as job_status, ej.ngay_nhan, ej.ngay_hoan_thanh 
            FROM hoa_don i 
            LEFT JOIN cong_viec_nhan_vien ej ON i.id = ej.hoa_don_id AND ej.nhan_vien_id = ?
            WHERE i.nhan_vien_id IS NULL OR i.nhan_vien_id = ?
            ORDER BY i.ngay_tao DESC";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('ii', $userId, $userId);
} else if ($userRole === 'khach_hang') {
    // Customer sees only their invoices
    $sql = "SELECT i.*, u.ten as employee_name, u.dien_thoai as employee_phone 
            FROM hoa_don i 
            LEFT JOIN nguoi_dung u ON i.nhan_vien_id = u.id 
            WHERE i.khach_hang_id = ? 
            ORDER BY i.ngay_tao DESC";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('i', $userId);
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid vai_tro']);
    exit;
}

$stmt->execute();
$result = $stmt->get_result();

$invoices = [];
while ($row = $result->fetch_assoc()) {
    $invoices[] = $row;
}

echo json_encode([
    'success' => true,
    'invoices' => $invoices
]);

$stmt->close();
$conn->close();
?>
