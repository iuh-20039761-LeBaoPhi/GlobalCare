<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

require_once __DIR__ . '/../config/db.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

$json = file_get_contents('php://input');
$data = json_decode($json, true) ?: $_POST;

$order_code = 'GH' . strtoupper(substr(md5(time()), 0, 8));

// Thu thập đầy đủ các trường từ Frontend để lưu vào bảng orders bản đầy đủ
$fields = [
    'user_id'          => $data['user_id'] ?? null,
    'pickup_address'   => $data['pickup'] ?? '',
    'name'             => $data['name'] ?? '',
    'phone'            => $data['phone'] ?? '',
    'receiver_name'    => $data['receiver_name'] ?? '',
    'receiver_phone'   => $data['receiver_phone'] ?? '',
    'delivery_address' => $data['delivery'] ?? '',
    'is_corporate'     => (int)($data['is_corporate'] ?? 0),
    'company_name'     => $data['company_name'] ?? null,
    'company_email'    => $data['company_email'] ?? null,
    'company_tax_code' => $data['company_tax_code'] ?? null,
    'company_address'  => $data['company_address'] ?? null,
    'company_bank_info'=> $data['company_bank_info'] ?? null,
    'package_type'     => $data['package_type'] ?? 'other',
    'service_type'     => $data['service_type'] ?? 'standard',
    'weight'           => (float)($data['weight'] ?? 0),
    'cod_amount'       => (float)($data['cod_amount'] ?? 0),
    'shipping_fee'     => (float)($data['shipping_fee'] ?? 0),
    'note'             => $data['note'] ?? '',
    'payment_method'   => $data['payment_method'] ?? 'cod',
    'payment_status'   => $data['payment_status'] ?? 'unpaid'
];

if (empty($fields['name']) || empty($fields['phone']) || empty($fields['delivery_address'])) {
    echo json_encode(['status' => 'error', 'message' => 'Lỗi: Thiếu thông tin bắt buộc (Tên, SĐT hoặc địa chỉ giao)']);
    exit;
}

$sql = "INSERT INTO orders (
    order_code, user_id, pickup_address, name, phone, 
    receiver_name, receiver_phone, delivery_address, 
    is_corporate, company_name, company_email, company_tax_code, company_address, company_bank_info,
    package_type, service_type, weight, cod_amount, shipping_fee, 
    note, payment_method, payment_status, status
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')";

$stmt = $conn->prepare($sql);
$stmt->bind_param("sissssssisssssssdddssss", 
    $order_code, $fields['user_id'], $fields['pickup_address'], $fields['name'], $fields['phone'],
    $fields['receiver_name'], $fields['receiver_phone'], $fields['delivery_address'],
    $fields['is_corporate'], $fields['company_name'], $fields['company_email'], $fields['company_tax_code'], $fields['company_address'], $fields['company_bank_info'],
    $fields['package_type'], $fields['service_type'], $fields['weight'], $fields['cod_amount'], $fields['shipping_fee'], 
    $fields['note'], $fields['payment_method'], $fields['payment_status']
);

if ($stmt->execute()) {
    echo json_encode(['status' => 'success', 'order_code' => $order_code, 'message' => 'Đã lưu đơn hàng lên hệ thống!']);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Lỗi DB: ' . $stmt->error]);
}
?>
