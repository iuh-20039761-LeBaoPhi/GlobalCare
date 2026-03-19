<?php
session_start();
require_once 'db.php';

// Check if user is admin
if (!isset($_SESSION['nguoi_dung_id']) || $_SESSION['vai_tro'] !== 'admin') {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

// Get all employees with their profile
$sql = "SELECT u.*, ep.so_cccd, ep.trang_thai as employee_status, ep.danh_gia, ep.kinh_nghiem, ep.ngay_tao as profile_created_at 
        FROM nguoi_dung u 
        LEFT JOIN ho_so_nhan_vien ep ON u.id = ep.nguoi_dung_id 
        WHERE u.vai_tro = 'nhan_vien' 
        ORDER BY u.ngay_tao DESC";

$result = $conn->query($sql);

$employees = [];
while ($row = $result->fetch_assoc()) {
    // Remove mat_khau from response
    unset($row['mat_khau']);
    $employees[] = $row;
}

echo json_encode([
    'success' => true,
    'employees' => $employees
]);

$conn->close();
?>
