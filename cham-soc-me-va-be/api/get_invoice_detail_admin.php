<?php
session_start();
require_once 'db.php';

// Check if user is admin
if (!isset($_SESSION['nguoi_dung_id']) || $_SESSION['vai_tro'] !== 'admin') {
    echo json_encode(['success' => false, 'message' => 'Unauthorized - Admin only']);
    exit;
}

$invoiceId = isset($_GET['hoa_don_id']) ? intval($_GET['hoa_don_id']) : 0;

if ($invoiceId === 0) {
    echo json_encode(['success' => false, 'message' => 'Invalid invoice ID']);
    exit;
}

// Get full invoice info
$invoiceSql = "SELECT * FROM hoa_don WHERE id = ?";
$invoiceStmt = $conn->prepare($invoiceSql);
$invoiceStmt->bind_param('i', $invoiceId);
$invoiceStmt->execute();
$invoiceResult = $invoiceStmt->get_result();

if ($invoiceResult->num_rows === 0) {
    echo json_encode(['success' => false, 'message' => 'Không tìm thấy hóa đơn']);
    exit;
}

$invoice = $invoiceResult->fetch_assoc();

// Get FULL customer info (including CCCD - admin privilege)
$customer = null;
if ($invoice['khach_hang_id']) {
    $customerSql = "SELECT id, ten, dien_thoai, email, dia_chi, anh_dai_dien, anh_cccd FROM nguoi_dung WHERE id = ?";
    $customerStmt = $conn->prepare($customerSql);
    $customerStmt->bind_param('i', $invoice['khach_hang_id']);
    $customerStmt->execute();
    $customerResult = $customerStmt->get_result();
    if ($customerResult->num_rows > 0) {
        $customer = $customerResult->fetch_assoc();
    }
    $customerStmt->close();
}

// Get FULL employee info (including CCCD - admin privilege)
$employee = null;
if ($invoice['nhan_vien_id']) {
    $employeeSql = "SELECT u.id, u.ten, u.dien_thoai, u.email, u.dia_chi, u.anh_dai_dien, u.anh_cccd, 
                           ep.danh_gia, ep.kinh_nghiem, ep.so_cccd 
                    FROM nguoi_dung u 
                    LEFT JOIN ho_so_nhan_vien ep ON u.id = ep.nguoi_dung_id 
                    WHERE u.id = ?";
    $employeeStmt = $conn->prepare($employeeSql);
    $employeeStmt->bind_param('i', $invoice['nhan_vien_id']);
    $employeeStmt->execute();
    $employeeResult = $employeeStmt->get_result();
    if ($employeeResult->num_rows > 0) {
        $employee = $employeeResult->fetch_assoc();
    }
    $employeeStmt->close();
}

// Get all media (images and videos)
$mediaSql = "SELECT im.*, u.ten as uploader_name, u.vai_tro as uploader_role 
             FROM media_hoa_don im 
             LEFT JOIN nguoi_dung u ON im.nguoi_dung_id = u.id 
             WHERE im.hoa_don_id = ? 
             ORDER BY im.ngay_tao DESC";
$mediaStmt = $conn->prepare($mediaSql);
$mediaStmt->bind_param('i', $invoiceId);
$mediaStmt->execute();
$mediaResult = $mediaStmt->get_result();

$media = [];
while ($row = $mediaResult->fetch_assoc()) {
    $media[] = $row;
}

echo json_encode([
    'success' => true,
    'invoice' => $invoice,
    'khach_hang' => $customer,
    'nhan_vien' => $employee,
    'media' => $media
]);

$invoiceStmt->close();
$mediaStmt->close();
$conn->close();
?>
