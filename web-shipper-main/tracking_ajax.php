<?php
require_once 'config/db.php';

header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $code = trim($_POST['code'] ?? '');
    $search_type = $_POST['search_type'] ?? 'standard'; // Loại tra cứu từ client

    if (empty($code)) {
        echo json_encode(['status' => 'error', 'message' => 'Vui lòng nhập mã đơn hàng.']);
        exit;
    }

    // Truy vấn đơn hàng theo mã (order_code)
    $stmt = $conn->prepare("SELECT id, order_code, package_type, service_type, cod_amount, status, created_at FROM orders WHERE order_code = ?");
    if (!$stmt) {
        echo json_encode(['status' => 'error', 'message' => 'Lỗi truy vấn SQL: ' . $conn->error]);
        exit;
    }

    $stmt->bind_param("s", $code);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        $order = $result->fetch_assoc();

        // --- LOGIC KIỂM TRA LOẠI DỊCH VỤ ---
        // 1. Nếu tra cứu "Số lượng lớn" (bulk) mà đơn hàng không phải bulk -> Báo lỗi
        if ($search_type === 'bulk' && $order['service_type'] !== 'bulk') {
            echo json_encode(['status' => 'error', 'message' => 'Đây không phải là đơn hàng số lượng lớn. Vui lòng tra cứu bên tab "Tiêu chuẩn".']);
            exit;
        }

        // 2. Nếu tra cứu "COD" mà đơn hàng không có tiền thu hộ -> Báo lỗi
        if ($search_type === 'cod' && $order['cod_amount'] <= 0) {
            echo json_encode(['status' => 'error', 'message' => 'Đơn hàng này không có dịch vụ COD.']);
            exit;
        }

        // 3. Nếu tra cứu "Tiêu chuẩn" mà đơn hàng là bulk -> Báo lỗi (tuỳ chọn)
        if ($search_type === 'standard' && $order['service_type'] === 'bulk') {
            echo json_encode(['status' => 'error', 'message' => 'Đây là đơn hàng số lượng lớn. Vui lòng tra cứu bên tab "Số lượng lớn".']);
            exit;
        }

        // Map trạng thái sang tiếng Việt và màu sắc hiển thị
        $status_map = [
            'pending' => ['text' => 'Chờ xử lý', 'icon' => '⏳', 'color' => '#ffc107'],   // Vàng
            'shipping' => ['text' => 'Đang giao', 'icon' => '🚚', 'color' => '#17a2b8'],  // Xanh dương
            'completed' => ['text' => 'Hoàn tất', 'icon' => '✅', 'color' => '#28a745'],  // Xanh lá
            'cancelled' => ['text' => 'Đã hủy', 'icon' => '❌', 'color' => '#dc3545']     // Đỏ
        ];

        $pkg_map = [
            'document' => 'Tài liệu',
            'food' => 'Đồ ăn',
            'clothes' => 'Quần áo',
            'electronic' => 'Điện tử',
            'other' => 'Khác'
        ];

        $st_key = $order['status'] ?? 'pending';
        $st_info = $status_map[$st_key] ?? $status_map['pending'];

        // --- XÂY DỰNG TIMELINE LỊCH SỬ ---
        $timeline = [];

        // 1. Sự kiện tạo đơn
        $timeline[] = [
            'text' => 'Đơn hàng đã được tạo',
            'time' => date('H:i d/m/Y', strtotime($order['created_at'])),
            'icon' => '📝'
        ];

        // 2. Lấy lịch sử thay đổi từ order_logs
        $log_stmt = $conn->prepare("SELECT new_status, changed_at FROM order_logs WHERE order_id = ? ORDER BY changed_at ASC");
        $log_stmt->bind_param("i", $order['id']);
        $log_stmt->execute();
        $log_res = $log_stmt->get_result();

        while ($log = $log_res->fetch_assoc()) {
            $s_key = $log['new_status'];
            $s_info = $status_map[$s_key] ?? ['text' => $s_key, 'icon' => '●'];

            $timeline[] = [
                'text' => 'Trạng thái: ' . $s_info['text'],
                'time' => date('H:i d/m/Y', strtotime($log['changed_at'])),
                'icon' => $s_info['icon']
            ];
        }
        $log_stmt->close();

        $response = [
            'status' => 'success',
            'data' => [
                'order_code' => $order['order_code'],
                'type' => $pkg_map[$order['package_type']] ?? $order['package_type'],
                'status_text' => $st_info['text'],
                'status_raw' => $order['status'],
                'icon' => $st_info['icon'],
                'color' => $st_info['color'],
                'created_at' => date('d/m/Y H:i', strtotime($order['created_at'])),
                'timeline' => $timeline
            ]
        ];
        echo json_encode($response);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Không tìm thấy đơn hàng này.']);
    }
    $stmt->close();
}
$conn->close();
?>