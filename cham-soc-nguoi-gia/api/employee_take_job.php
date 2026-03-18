<?php
session_start();
require_once 'db.php';

// Check if user is logged in and is employee
if (!isset($_SESSION['nguoi_dung_id']) || $_SESSION['vai_tro'] !== 'nhan_vien') {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

// Get POST data
$data = json_decode(file_get_contents('php://input'), true);

if (!$data) {
    echo json_encode(['success' => false, 'message' => 'Invalid request']);
    exit;
}

$employeeId = $_SESSION['nguoi_dung_id'];
$invoiceId = isset($data['hoa_don_id']) ? intval($data['hoa_don_id']) : 0;

if ($invoiceId === 0) {
    echo json_encode(['success' => false, 'message' => 'Invalid invoice ID']);
    exit;
}

// Check if invoice exists and is available
$checkSql = "SELECT id, nhan_vien_id, trang_thai FROM hoa_don WHERE id = ?";
$checkStmt = $conn->prepare($checkSql);
$checkStmt->bind_param('i', $invoiceId);
$checkStmt->execute();
$checkResult = $checkStmt->get_result();

if ($checkResult->num_rows === 0) {
    echo json_encode(['success' => false, 'message' => 'Không tìm thấy hóa đơn']);
    exit;
}

$invoice = $checkResult->fetch_assoc();

if ($invoice['nhan_vien_id'] !== null && $invoice['nhan_vien_id'] != $employeeId) {
    echo json_encode(['success' => false, 'message' => 'Hóa đơn đã được nhận bởi nhân viên khác']);
    exit;
}

// Start transaction
$conn->begin_transaction();

try {
    // Update invoice
    $updateSql = "UPDATE hoa_don SET nhan_vien_id = ?, trang_thai = 'da_duyet' WHERE id = ?";
    $updateStmt = $conn->prepare($updateSql);
    $updateStmt->bind_param('ii', $employeeId, $invoiceId);
    $updateStmt->execute();
    
    // Insert or UPDATE cong_viec_nhan_vien
    $jobSql = "INSERT INTO cong_viec_nhan_vien (nhan_vien_id, hoa_don_id, trang_thai, ngay_nhan) 
               VALUES (?, ?, 'da_duyet', NOW()) 
               ON DUPLICATE KEY UPDATE trang_thai = 'da_duyet', ngay_nhan = NOW()";
    $jobStmt = $conn->prepare($jobSql);
    $jobStmt->bind_param('ii', $employeeId, $invoiceId);
    $jobStmt->execute();
    
    $conn->commit();
    
    echo json_encode([
        'success' => true,
        'message' => 'Đã nhận việc thành công'
    ]);
} catch (Exception $e) {
    $conn->rollback();
    echo json_encode(['success' => false, 'message' => 'Nhận việc thất bại: ' . $e->getMessage()]);
}

$conn->close();
?>
