<?php
session_start();
require_once 'db.php';

if (!isset($_SESSION['nguoi_dung_id'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$userId = $_SESSION['nguoi_dung_id'];

// Lấy dữ liệu từ $_POST (vì Frontend gửi FormData)
$ten = isset($_POST['name']) ? sanitize($_POST['name']) : '';
$dien_thoai = isset($_POST['phone']) ? sanitize($_POST['phone']) : '';
$email = isset($_POST['email']) ? sanitize($_POST['email']) : '';
$dia_chi = isset($_POST['address']) ? sanitize($_POST['address']) : '';
$ten_dang_nhap = isset($_POST['username']) ? sanitize($_POST['username']) : '';
$mat_khau = isset($_POST['password']) ? $_POST['password'] : '';

if (empty($ten) || empty($dien_thoai) || empty($ten_dang_nhap)) {
    echo json_encode(['success' => false, 'message' => 'Vui lòng nhập đầy đủ thông tin bắt buộc']);
    exit;
}

// Kiểm tra trùng tên đăng nhập
$checkStmt = $conn->prepare("SELECT id FROM nguoi_dung WHERE ten_dang_nhap = ? AND id != ?");
$checkStmt->bind_param('si', $ten_dang_nhap, $userId);
$checkStmt->execute();
if ($checkStmt->get_result()->num_rows > 0) {
    echo json_encode(['success' => false, 'message' => 'Tên đăng nhập đã được sử dụng']);
    exit;
}
// --- XỬ LÝ UPLOAD ẢNH ---
// Định nghĩa thư mục gốc
$baseUploadDir = '../uploads/';

/**
 * Hàm xử lý upload file phân loại theo thư mục
 * @param string $fileKey Tên name của input file
 * @param string $subFolder Thư mục con (avatars hoặc cccd)
 * @param string $prefix Tiền tố tên file
 * @return string|null Đường dẫn tương đối để lưu vào DB
 */
function handleUpload($fileKey, $subFolder, $prefix) {
    $baseUploadDir = '../uploads/';
    $targetDir = $baseUploadDir . $subFolder . '/';
    
    // Tự động tạo thư mục con nếu chưa có (ví dụ: ../uploads/avatars/)
    if (!is_dir($targetDir)) {
        mkdir($targetDir, 0777, true);
    }

    if (isset($_FILES[$fileKey]) && $_FILES[$fileKey]['error'] === UPLOAD_ERR_OK) {
        $ext = pathinfo($_FILES[$fileKey]['name'], PATHINFO_EXTENSION);
        // Tạo tên file duy nhất để tránh trùng lặp
        $fileName = $prefix . '_' . time() . '_' . uniqid() . '.' . $ext;
        $targetFile = $targetDir . $fileName;
        
        if (move_uploaded_file($_FILES[$fileKey]['tmp_name'], $targetFile)) {
            // Trả về đường dẫn lưu vào DB: uploads/avatars/file.jpg hoặc uploads/cccd/file.jpg
            return 'uploads/' . $subFolder . '/' . $fileName; 
        }
    }
    return null;
}

// Gọi hàm và truyền đúng thư mục đích
$avatarPath = handleUpload('avatar', 'avatars', 'avatar');
$cccdPath = handleUpload('cccd_image', 'cccd', 'cccd');
// --- CẬP NHẬT CƠ SỞ DỮ LIỆU ---
$params = [$ten, $dien_thoai, $email, $dia_chi, $ten_dang_nhap];
$types = "sssss";
$sql = "UPDATE nguoi_dung SET ten = ?, dien_thoai = ?, email = ?, dia_chi = ?, ten_dang_nhap = ?";

if (!empty($mat_khau)) {
    $sql .= ", mat_khau = ?";
    $params[] = password_hash($mat_khau, PASSWORD_DEFAULT);
    $types .= "s";
}

if ($avatarPath) {
    $sql .= ", anh_dai_dien = ?";
    $params[] = $avatarPath;
    $types .= "s";
}

if ($cccdPath) {
    $sql .= ", anh_cccd = ?";
    $params[] = $cccdPath;
    $types .= "s";
}

$sql .= " WHERE id = ?";
$params[] = $userId;
$types .= "i";

$stmt = $conn->prepare($sql);
$stmt->bind_param($types, ...$params);

if ($stmt->execute()) {
    $_SESSION['ten'] = $ten;
    echo json_encode(['success' => true, 'message' => 'Cập nhật thành công']);
} else {
    echo json_encode(['success' => false, 'message' => 'Lỗi DB: ' . $conn->error]);
}