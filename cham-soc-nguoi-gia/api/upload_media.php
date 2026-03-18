<?php
session_start();
require_once 'db.php';

if (!isset($_SESSION['nguoi_dung_id'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$userId = $_SESSION['nguoi_dung_id'];
$invoiceId = isset($_POST['hoa_don_id']) ? intval($_POST['hoa_don_id']) : 0;
$mo_ta = isset($_POST['mo_ta']) ? sanitize($_POST['mo_ta']) : '';

if ($invoiceId === 0) {
    echo json_encode(['success' => false, 'message' => 'Mã hóa đơn không hợp lệ']);
    exit;
}

if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(['success' => false, 'message' => 'Vui lòng chọn file hợp lệ']);
    exit;
}

$file = $_FILES['file'];
$fileName = $file['name']; // Lưu ý: Dùng 'name' thay vì 'ten' để tránh lỗi biến hệ thống
$fileTmpName = $file['tmp_name'];
$fileType = $file['type'];

// 1. Phân loại và định nghĩa thư mục con
$subDir = '';
$fileTypeDb = '';

if (strpos($fileType, 'image/') === 0) {
    $fileTypeDb = 'hinh_anh';
    $subDir = 'images/'; 
} elseif (strpos($fileType, 'video/') === 0) {
    $fileTypeDb = 'video';
    $subDir = 'videos/';
} else {
    echo json_encode(['success' => false, 'message' => 'Định dạng file không hỗ trợ']);
    exit;
}

// 2. Thiết lập đường dẫn đầy đủ
$baseDir = '../uploads/';
$targetDir = $baseDir . $subDir;

// Tự động tạo thư mục nếu chưa tồn tại
if (!file_exists($targetDir)) {
    mkdir($targetDir, 0777, true);
}

// 3. Tạo tên file duy nhất để tránh ghi đè
$extension = pathinfo($fileName, PATHINFO_EXTENSION);
$newFileName = uniqid() . '_' . time() . '.' . $extension;
$uploadPath = $targetDir . $newFileName;

// 4. Di chuyển file và lưu vào Database
if (move_uploaded_file($fileTmpName, $uploadPath)) {
    // Đường dẫn lưu vào DB (bỏ dấu ../ để hiển thị được trên web)
    $dbPath = 'uploads/' . $subDir . $newFileName;
    
    $sql = "INSERT INTO media_hoa_don (hoa_don_id, nguoi_dung_id, loai_file, duong_dan_file, mo_ta) VALUES (?, ?, ?, ?, ?)";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('iisss', $invoiceId, $userId, $fileTypeDb, $dbPath, $mo_ta);
    
    if ($stmt->execute()) {
        echo json_encode([
            'success' => true,
            'message' => 'Tải lên ' . ($fileTypeDb == 'video' ? 'video' : 'ảnh') . ' thành công',
            'path' => $dbPath
        ]);
    } else {
        unlink($uploadPath); // Xóa file vật lý nếu lưu DB thất bại
        echo json_encode(['success' => false, 'message' => 'Lỗi lưu dữ liệu vào database']);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Không thể di chuyển file vào thư mục ' . $subDir]);
}
?>