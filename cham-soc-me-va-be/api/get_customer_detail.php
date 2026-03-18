<?php
session_start();
require_once 'db.php';

// Check if user is logged in
if (!isset($_SESSION['nguoi_dung_id'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$customerId = isset($_GET['id']) ? intval($_GET['id']) : 0;

if ($customerId === 0) {
    echo json_encode(['success' => false, 'message' => 'Invalid customer ID']);
    exit;
}

// Get customer info WITHOUT CCCD (phân quyền)
$sql = "SELECT id, ten, dien_thoai, email, dia_chi, anh_dai_dien 
        FROM nguoi_dung 
        WHERE id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param('i', $customerId);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode(['success' => false, 'message' => 'Không tìm thấy khách hàng']);
    exit;
}

$customer = $result->fetch_assoc();

echo json_encode([
    'success' => true,
    'khach_hang' => $customer
]);

$stmt->close();
$conn->close();
?>
