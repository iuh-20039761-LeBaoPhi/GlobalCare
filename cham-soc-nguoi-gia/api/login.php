<?php
session_start();
require_once 'db.php';

// Get POST data
$data = json_decode(file_get_contents('php://input'), true);

if (!$data) {
    echo json_encode(['success' => false, 'message' => 'Invalid request']);
    exit;
}

$ten_dang_nhap = isset($data['ten_dang_nhap']) ? sanitize($data['ten_dang_nhap']) : 
                  (isset($data['username']) ? sanitize($data['username']) : '');
$mat_khau = isset($data['mat_khau']) ? $data['mat_khau'] : 
             (isset($data['password']) ? $data['password'] : '');

// Validate inputs
if (empty($ten_dang_nhap) || empty($mat_khau)) {
    echo json_encode(['success' => false, 'message' => 'Vui lòng nhập đầy đủ thông tin']);
    exit;
}

// Query user
$sql = "SELECT * FROM nguoi_dung WHERE ten_dang_nhap = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param('s', $ten_dang_nhap);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode(['success' => false, 'message' => 'Tên đăng nhập hoặc mật khẩu không đúng']);
    exit;
}

$user = $result->fetch_assoc();

// Verify mat_khau
if (!password_verify($mat_khau, $user['mat_khau'])) {
    echo json_encode(['success' => false, 'message' => 'Tên đăng nhập hoặc mật khẩu không đúng']);
    exit;
}

// Check if employee is approved
if ($user['vai_tro'] === 'nhan_vien') {
    $empSql = "SELECT trang_thai FROM ho_so_nhan_vien WHERE nguoi_dung_id = ?";
    $empStmt = $conn->prepare($empSql);
    $empStmt->bind_param('i', $user['id']);
    $empStmt->execute();
    $empResult = $empStmt->get_result();
    
    if ($empResult->num_rows > 0) {
        $empProfile = $empResult->fetch_assoc();
        if ($empProfile['trang_thai'] !== 'da_duyet') {
            echo json_encode(['success' => false, 'message' => 'Tài khoản nhân viên chưa được duyệt']);
            exit;
        }
    }
}

// Set session
$_SESSION['nguoi_dung_id'] = $user['id'];
$_SESSION['ten_dang_nhap'] = $user['ten_dang_nhap'];
$_SESSION['vai_tro'] = $user['vai_tro'];
$_SESSION['ten'] = $user['ten'];

// Remove mat_khau from response
unset($user['mat_khau']);

echo json_encode([
    'success' => true,
    'message' => 'Đăng nhập thành công',
    'user' => $user,
    'redirect' => $user['vai_tro'] . '/dashboard.html'
]);

$stmt->close();
$conn->close();
?>
