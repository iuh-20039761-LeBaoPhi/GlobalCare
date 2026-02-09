<?php
session_start();

$conn = new mysqli("localhost", "root", "", "cleaning_service");
if ($conn->connect_error) {
    die("Kết nối thất bại");
}

// ===== LẤY DỮ LIỆU =====
$service_type = $_POST['service_type'];
$name         = $_POST['customer_name'];
$phone        = $_POST['phone'];
$address      = $_POST['address'] ?? '';
$district     = $_POST['district'] ?? '';
$city         = $_POST['city'] ?? '';
$booking_date = $_POST['booking_date'];
$note         = $_POST['note'] ?? '';

// ===== LẤY CUSTOMER_ID NẾU ĐÃ LOGIN =====
$customer_id = $_SESSION['customer']['id'] ?? null;

// ===== INSERT =====
$sql = "INSERT INTO bookings
(customer_id, service_type, customer_name, phone, address, district, city, booking_date, note)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";

$stmt = $conn->prepare($sql);
$stmt->bind_param(
    "issssssss",
    $customer_id,
    $service_type,
    $name,
    $phone,
    $address,
    $district,
    $city,
    $booking_date,
    $note
);

$stmt->execute();

// ===== PHẢN HỒI =====
echo "Đặt dịch vụ thành công!";
?>
