<?php
session_start();
require_once 'db.php';

// Get POST data
$data = json_decode(file_get_contents('php://input'), true);

if (!$data) {
    echo json_encode(['success' => false, 'message' => 'Invalid request']);
    exit;
}

$ten = isset($data['ten']) ? sanitize($data['ten']) : 
             (isset($data['name']) ? sanitize($data['name']) : '');
$dien_thoai = isset($data['dien_thoai']) ? sanitize($data['dien_thoai']) : 
             (isset($data['phone']) ? sanitize($data['phone']) : '');
$email = isset($data['email']) ? sanitize($data['email']) : 
             (isset($data['email']) ? sanitize($data['email']) : '');
$dia_chi = isset($data['dia_chi']) ? sanitize($data['dia_chi']) : 
             (isset($data['address']) ? sanitize($data['address']) : '');
$vai_tro = isset($data['vai_tro']) ? sanitize($data['vai_tro']) : 'khach_hang';
$ten_dang_nhap = isset($data['ten_dang_nhap']) ? sanitize($data['ten_dang_nhap']) : 
             (isset($data['username']) ? sanitize($data['username']) : '');
$mat_khau = isset($data['mat_khau']) ? $data['mat_khau'] : 
             (isset($data['password']) ? $data['password'] : '');
$kinh_nghiem = isset($data['kinh_nghiem']) ? sanitize($data['kinh_nghiem']) : '';
$so_cccd = isset($data['so_cccd']) ? sanitize($data['so_cccd']) : '';

// Validate inputs
if (empty($ten) || empty($dien_thoai) || empty($ten_dang_nhap) || empty($mat_khau)) {
    echo json_encode(['success' => false, 'message' => 'Vui lòng nhập đầy đủ thông tin bắt buộc']);
    exit;
}

if (!isValidPhone($dien_thoai)) {
    echo json_encode(['success' => false, 'message' => 'Số điện thoại không hợp lệ']);
    exit;
}

if (!empty($email) && !isValidEmail($email)) {
    echo json_encode(['success' => false, 'message' => 'Email không hợp lệ']);
    exit;
}

// Check if ten_dang_nhap exists
$checkSql = "SELECT id FROM nguoi_dung WHERE ten_dang_nhap = ?";
$checkStmt = $conn->prepare($checkSql);
$checkStmt->bind_param('s', $ten_dang_nhap);
$checkStmt->execute();
$checkResult = $checkStmt->get_result();

if ($checkResult->num_rows > 0) {
    echo json_encode(['success' => false, 'message' => 'Tên đăng nhập đã tồn tại']);
    exit;
}

// Check if dien_thoai exists
$checkPhoneSql = "SELECT id FROM nguoi_dung WHERE dien_thoai = ?";
$checkPhoneStmt = $conn->prepare($checkPhoneSql);
$checkPhoneStmt->bind_param('s', $dien_thoai);
$checkPhoneStmt->execute();
$checkPhoneResult = $checkPhoneStmt->get_result();

if ($checkPhoneResult->num_rows > 0) {
    echo json_encode(['success' => false, 'message' => 'Số điện thoại đã được đăng ký']);
    exit;
}

// Hash mat_khau
$hashedPassword = password_hash($mat_khau, PASSWORD_DEFAULT);

// Insert user
$sql = "INSERT INTO nguoi_dung (ten, dien_thoai, email, dia_chi, vai_tro, ten_dang_nhap, mat_khau) VALUES (?, ?, ?, ?, ?, ?, ?)";
$stmt = $conn->prepare($sql);
$stmt->bind_param('sssssss', $ten, $dien_thoai, $email, $dia_chi, $vai_tro, $ten_dang_nhap, $hashedPassword);

if ($stmt->execute()) {
    $userId = $conn->insert_id;
    
    // If employee, create profile
    if ($vai_tro === 'nhan_vien') {
        $empSql = "INSERT INTO ho_so_nhan_vien (nguoi_dung_id, so_cccd, trang_thai, kinh_nghiem) VALUES (?, ?, 'cho_duyet', ?)";
        $empStmt = $conn->prepare($empSql);
        $empStmt->bind_param('iss', $userId, $so_cccd, $kinh_nghiem);
        $empStmt->execute();
        $empStmt->close();
    }
    
    echo json_encode([
        'success' => true,
        'message' => $vai_tro === 'nhan_vien' ? 'Đăng ký thành công. Vui lòng chờ admin duyệt tài khoản.' : 'Đăng ký thành công',
        'nguoi_dung_id' => $userId
    ]);
} else {
    echo json_encode(['success' => false, 'message' => 'Đăng ký thất bại: ' . $conn->error]);
}

$stmt->close();
$conn->close();
?>
