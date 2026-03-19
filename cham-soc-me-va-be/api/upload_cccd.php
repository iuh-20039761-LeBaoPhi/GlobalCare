<?php
session_start();
require_once 'db.php';

// Check if user is logged in and is employee
if (!isset($_SESSION['nguoi_dung_id']) || $_SESSION['vai_tro'] !== 'nhan_vien') {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$userId = $_SESSION['nguoi_dung_id'];

// Check if file was uploaded
if (!isset($_FILES['anh_cccd']) || $_FILES['anh_cccd']['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(['success' => false, 'message' => 'Vui lòng chọn ảnh CCCD']);
    exit;
}

$file = $_FILES['anh_cccd'];
$fileName = $file['ten'];
$fileTmpName = $file['tmp_name'];
$fileSize = $file['size'];
$fileType = $file['type'];

// Validate file type
$imageTypes = ['image/jpeg', 'image/jpg', 'image/png'];
if (!in_array($fileType, $imageTypes)) {
    echo json_encode(['success' => false, 'message' => 'Định dạng ảnh không hợp lệ. Chỉ chấp nhận JPG, JPEG, PNG']);
    exit;
}

// Validate file size (5MB max)
if ($fileSize > 5 * 1024 * 1024) {
    echo json_encode(['success' => false, 'message' => 'Ảnh quá lớn. Kích thước tối đa 5MB']);
    exit;
}

// Create upload directory if not exists
$uploadDir = '../uploads/cccd/';
if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

// Generate unique filename
$extension = pathinfo($fileName, PATHINFO_EXTENSION);
$newFileName = 'cccd_' . $userId . '_' . time() . '.' . $extension;
$uploadPath = $uploadDir . $newFileName;

// Move uploaded file
if (move_uploaded_file($fileTmpName, $uploadPath)) {
    $filePath = 'uploads/cccd/' . $newFileName;
    
    // UPDATE nguoi_dung table
    $updateUserSql = "UPDATE nguoi_dung SET anh_cccd = ? WHERE id = ?";
    $updateUserStmt = $conn->prepare($updateUserSql);
    $updateUserStmt->bind_param('si', $filePath, $userId);
    $updateUserStmt->execute();
    
    // UPDATE ho_so_nhan_vien table
    $updateProfileSql = "UPDATE ho_so_nhan_vien SET anh_cccd = ? WHERE nguoi_dung_id = ?";
    $updateProfileStmt = $conn->prepare($updateProfileSql);
    $updateProfileStmt->bind_param('si', $filePath, $userId);
    $updateProfileStmt->execute();
    
    echo json_encode([
        'success' => true,
        'message' => 'Upload ảnh CCCD thành công',
        'duong_dan_file' => $filePath
    ]);
} else {
    echo json_encode(['success' => false, 'message' => 'Upload ảnh thất bại']);
}

$conn->close();
?>
