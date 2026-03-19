<?php
session_start();
require_once 'db.php';

// Check if user is logged in
if (!isset($_SESSION['nguoi_dung_id'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$userId = $_SESSION['nguoi_dung_id'];

// Get user profile data
$sql = "SELECT id, ten, dien_thoai, email, dia_chi, ten_dang_nhap, anh_dai_dien, anh_cccd, vai_tro FROM nguoi_dung WHERE id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param('i', $userId);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode(['success' => false, 'message' => 'User not found']);
    exit;
}

$user = $result->fetch_assoc();

// If employee, get additional profile info
if ($user['vai_tro'] === 'nhan_vien') {
    $empSql = "SELECT so_cccd, trang_thai, danh_gia, kinh_nghiem FROM ho_so_nhan_vien WHERE nguoi_dung_id = ?";
    $empStmt = $conn->prepare($empSql);
    $empStmt->bind_param('i', $userId);
    $empStmt->execute();
    $empResult = $empStmt->get_result();
    
    if ($empResult->num_rows > 0) {
        $empProfile = $empResult->fetch_assoc();
        $user['employee_profile'] = $empProfile;
    }
    $empStmt->close();
}

echo json_encode([
    'success' => true,
    'user' => $user
]);

$stmt->close();
$conn->close();
?>
