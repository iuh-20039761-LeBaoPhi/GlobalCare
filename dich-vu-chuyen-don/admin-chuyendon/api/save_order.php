<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *'); 
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method Not Allowed']);
    exit;
}

require_once '../config/db.php';

// Tạo mã đơn hàng tự động ngẫu nhiên (VD: MVS-20231024-XXXX)
$order_code = 'MVS-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -4));

try {
    // Thu thập dữ liệu chung từ POST
    $service_type = isset($_POST['service_type']) ? trim($_POST['service_type']) : '';
    $customer_name = isset($_POST['name']) ? trim($_POST['name']) : '';
    $customer_phone = isset($_POST['phone']) ? trim($_POST['phone']) : '';
    $pickup_address = isset($_POST['pickup']) ? trim($_POST['pickup']) : '';
    $delivery_address = isset($_POST['delivery']) ? trim($_POST['delivery']) : '';
    
    // Ghi chú & Chi tiết được JS nối vào trường note
    $note = isset($_POST['note']) ? trim($_POST['note']) : '';

    // Lịch hẹn khảo sát
    $survey_date = isset($_POST['moving_survey_date']) ? trim($_POST['moving_survey_date']) : NULL;
    $survey_time_slot = isset($_POST['moving_survey_time_slot']) ? trim($_POST['moving_survey_time_slot']) : NULL;
    $survey_fee = isset($_POST['survey_fee']) ? floatval($_POST['survey_fee']) : 0;

    // Validate backend cơ bản (Front-end cũng đã chặn)
    if(empty($customer_name) || empty($customer_phone) || empty($pickup_address) || empty($delivery_address) || empty($service_type)) {
        echo json_encode(['status' => 'error', 'message' => 'Vui lòng điền đầy đủ các thông tin bắt buộc (*).']);
        exit;
    }

    // Câu SQL Prepare an toàn chống SQL Injection (Sử dụng PDO)
    $stmt = $conn->prepare("INSERT INTO chuyen_don_orders 
        (order_code, service_type, customer_name, customer_phone, pickup_address, delivery_address, survey_date, survey_time_slot, survey_fee, note, status) 
        VALUES 
        (:order_code, :service_type, :customer_name, :customer_phone, :pickup_address, :delivery_address, :survey_date, :survey_time_slot, :survey_fee, :note, 'pending_survey')");

    $stmt->bindParam(':order_code', $order_code);
    $stmt->bindParam(':service_type', $service_type);
    $stmt->bindParam(':customer_name', $customer_name);
    $stmt->bindParam(':customer_phone', $customer_phone);
    $stmt->bindParam(':pickup_address', $pickup_address);
    $stmt->bindParam(':delivery_address', $delivery_address);
    $stmt->bindParam(':survey_date', $survey_date);
    $stmt->bindParam(':survey_time_slot', $survey_time_slot);
    $stmt->bindParam(':survey_fee', $survey_fee);
    $stmt->bindParam(':note', $note);

    if ($stmt->execute()) {
        // Trả kết quả thành công cho frontend
        echo json_encode([
            'status' => 'success',
            'message' => 'Đặt lịch khảo sát thành công!',
            'order_code' => $order_code
        ]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Có lỗi xảy ra khi lưu vào Database.']);
    }

} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Lỗi hệ thống: ' . $e->getMessage()]);
}
?>
