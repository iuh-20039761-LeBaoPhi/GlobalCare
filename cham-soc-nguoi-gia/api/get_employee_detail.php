<?php
session_start();
require_once 'db.php';

// Check if user is logged in
if (!isset($_SESSION['nguoi_dung_id'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$employeeId = isset($_GET['id']) ? intval($_GET['id']) : 0;
$invoiceId = isset($_GET['hoa_don_id']) ? intval($_GET['hoa_don_id']) : 0;

if ($employeeId === 0) {
    echo json_encode(['success' => false, 'message' => 'Invalid employee ID']);
    exit;
}

// Get employee info WITHOUT CCCD (phân quyền)
$sql = "SELECT u.id, u.ten, u.dien_thoai, u.email, u.anh_dai_dien, ep.danh_gia, ep.kinh_nghiem 
        FROM nguoi_dung u 
        LEFT JOIN ho_so_nhan_vien ep ON u.id = ep.nguoi_dung_id 
        WHERE u.id = ? AND u.vai_tro = 'nhan_vien'";
$stmt = $conn->prepare($sql);
$stmt->bind_param('i', $employeeId);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode(['success' => false, 'message' => 'Không tìm thấy nhân viên']);
    exit;
}

$employee = $result->fetch_assoc();

// Get media list for this employee on this invoice
$media = [];
if ($invoiceId > 0) {
    $mediaSql = "SELECT loai_file, duong_dan_file, mo_ta, ngay_tao 
                 FROM media_hoa_don 
                 WHERE hoa_don_id = ? AND nguoi_dung_id = ? 
                 ORDER BY ngay_tao DESC";
    $mediaStmt = $conn->prepare($mediaSql);
    $mediaStmt->bind_param('ii', $invoiceId, $employeeId);
    $mediaStmt->execute();
    $mediaResult = $mediaStmt->get_result();
    
    while ($row = $mediaResult->fetch_assoc()) {
        $media[] = $row;
    }
    $mediaStmt->close();
}

echo json_encode([
    'success' => true,
    'nhan_vien' => $employee,
    'media' => $media
]);

$stmt->close();
$conn->close();
?>
