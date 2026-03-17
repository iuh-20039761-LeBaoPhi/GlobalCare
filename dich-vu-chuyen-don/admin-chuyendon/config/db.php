<?php
// Tùy chỉnh thông số kết nối Database ở đây
$host = "localhost";
$username = "root";       // Thay user Database của bạn
$password = "";           // Thay password Database của bạn
$dbname = "chuyendon"; // Tạo sẵn Database này trong phpMyAdmin

try {
    $conn = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    // Thiết lập chế độ báo lỗi
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    die(json_encode([
        "status" => "error",
        "message" => "Lỗi kết nối cơ sở dữ liệu: " . $e->getMessage()
    ]));
}
?>
