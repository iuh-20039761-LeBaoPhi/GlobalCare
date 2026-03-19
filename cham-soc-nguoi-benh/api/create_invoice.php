<?php
session_start();
require_once 'db.php';

// Get POST data
$data = json_decode(file_get_contents('php://input'), true);

if (!$data) {
    echo json_encode(['success' => false, 'message' => 'Invalid request']);
    exit;
}

$customerId = isset($_SESSION['nguoi_dung_id']) ? $_SESSION['nguoi_dung_id'] : null;
$customerName = isset($data['ten_khach_hang']) ? sanitize($data['ten_khach_hang']) : '';
$dien_thoai = isset($data['dien_thoai']) ? sanitize($data['dien_thoai']) : 
             (isset($data['phone']) ? sanitize($data['phone']) : '');
$email = isset($data['email']) ? sanitize($data['email']) : 
             (isset($data['email']) ? sanitize($data['email']) : '');
$dia_chi = isset($data['dia_chi']) ? sanitize($data['dia_chi']) : 
             (isset($data['address']) ? sanitize($data['address']) : '');
$dich_vu = isset($data['dich_vu']) ? sanitize($data['dich_vu']) : 
             (isset($data['service']) ? sanitize($data['service']) : '');
$goi_dich_vu = isset($data['goi_dich_vu']) ? sanitize($data['goi_dich_vu']) : 
             (isset($data['package']) ? sanitize($data['package']) : '');
$cong_viec = isset($data['cong_viec']) ? sanitize($data['cong_viec']) : 
             (isset($data['jobs']) ? sanitize($data['jobs']) : '');
$startDate = isset($data['ngay_bat_dau']) ? sanitize($data['ngay_bat_dau']) : '';
$endDate = isset($data['ngay_ket_thuc']) ? sanitize($data['ngay_ket_thuc']) : null;
$startTime = isset($data['gio_bat_dau']) ? sanitize($data['gio_bat_dau']) : '';
$endTime = isset($data['gio_ket_thuc']) ? sanitize($data['gio_ket_thuc']) : null;
$totalHours = isset($data['tong_gio']) ? floatval($data['tong_gio']) : 0;
$totalDays = isset($data['tong_ngay']) ? intval($data['tong_ngay']) : 0;
$gia_tien = isset($data['gia_tien']) ? floatval($data['gia_tien']) : 0;
$ghi_chu = isset($data['ghi_chu']) ? sanitize($data['ghi_chu']) : 
             (isset($data['note']) ? sanitize($data['note']) : '');

// Validate inputs
if (empty($customerName) || empty($dien_thoai) || empty($dich_vu) || empty($goi_dich_vu) || empty($startDate) || empty($gia_tien)) {
    echo json_encode(['success' => false, 'message' => 'Vui lòng nhập đầy đủ thông tin bắt buộc']);
    exit;
}

if (!isValidPhone($dien_thoai)) {
    echo json_encode(['success' => false, 'message' => 'Số điện thoại không hợp lệ']);
    exit;
}

// Insert invoice
$sql = "INSERT INTO hoa_don (khach_hang_id, ten_khach_hang, dien_thoai, email, dia_chi, dich_vu, goi_dich_vu, cong_viec, ngay_bat_dau, ngay_ket_thuc, gio_bat_dau, gio_ket_thuc, tong_gio, tong_ngay, gia_tien, ghi_chu, trang_thai) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'cho_duyet')";
$stmt = $conn->prepare($sql);
$stmt->bind_param('isssssssssssdids', $customerId, $customerName, $dien_thoai, $email, $dia_chi, $dich_vu, $goi_dich_vu, $cong_viec, $startDate, $endDate, $startTime, $endTime, $totalHours, $totalDays, $gia_tien, $ghi_chu);

if ($stmt->execute()) {
    echo json_encode([
        'success' => true,
        'message' => 'Tạo hóa đơn thành công',
        'hoa_don_id' => $conn->insert_id
    ]);
} else {
    echo json_encode(['success' => false, 'message' => 'Tạo hóa đơn thất bại: ' . $conn->error]);
}

$stmt->close();
$conn->close();
?>
