<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'db.php';

// Get JSON data from request body
$json = file_get_contents('php://input');
$data = json_decode($json, true);

if (!$data) {
    echo json_encode([
        'success' => false,
        'message' => 'Dữ liệu không hợp lệ'
    ]);
    exit;
}

// Extract data from booking modal
$customerName    = isset($data['ten']) ? trim($data['ten']) : '';
$dien_thoai           = isset($data['dien_thoai']) ? trim($data['dien_thoai']) : '';
$email           = isset($data['email']) ? trim($data['email']) : '';
$dia_chi         = isset($data['dia_chi']) ? trim($data['dia_chi']) : '';
$dich_vu         = isset($data['dich_vu']) ? trim($data['dich_vu']) : '';
$goi_dich_vu         = isset($data['goi_dich_vu']) ? trim($data['goi_dich_vu']) : '';
$cong_viec            = isset($data['cong_viec']) ? trim($data['cong_viec']) : '';
$startDate       = isset($data['startDate']) ? $data['startDate'] : null;
$endDate         = isset($data['endDate']) ? $data['endDate'] : null;
$durationUnit    = isset($data['durationUnit']) ? $data['durationUnit'] : null;
$durationAmount  = isset($data['durationAmount']) ? intval($data['durationAmount']) : null;
$totalDays       = isset($data['totalDays']) ? intval($data['totalDays']) : null;
$startTime       = isset($data['startTime']) ? $data['startTime'] : null;
$endTime         = isset($data['endTime']) ? $data['endTime'] : null;
$totalHours      = isset($data['totalHours']) ? floatval($data['totalHours']) : null;
$extraRequest    = isset($data['extraRequest']) ? trim($data['extraRequest']) : '';
$ghi_chu            = isset($data['ghi_chu']) ? trim($data['ghi_chu']) : '';

// Check if khach_hang_id is provided (from logged in user)
$providedCustomerId = isset($data['khach_hang_id']) ? intval($data['khach_hang_id']) : null;

// Extract gia_tien (remove formatting)
$priceStr = isset($data['gia_tien']) ? $data['gia_tien'] : '0';
$priceStr = str_replace([' đ', ',', '.'], '', $priceStr);
$gia_tien    = floatval($priceStr);

// Validation
if (empty($customerName)) {
    echo json_encode([
        'success' => false,
        'message' => 'Vui lòng nhập họ tên'
    ]);
    exit;
}

if (empty($dien_thoai)) {
    echo json_encode([
        'success' => false,
        'message' => 'Vui lòng nhập số điện thoại'
    ]);
    exit;
}

if (empty($dich_vu)) {
    echo json_encode([
        'success' => false,
        'message' => 'Vui lòng chọn dịch vụ'
    ]);
    exit;
}

if (empty($goi_dich_vu)) {
    echo json_encode([
        'success' => false,
        'message' => 'Vui lòng chọn gói dịch vụ'
    ]);
    exit;
}

if (empty($startDate)) {
    echo json_encode([
        'success' => false,
        'message' => 'Vui lòng chọn ngày bắt đầu'
    ]);
    exit;
}

// Find or create customer
$khach_hang_id = null;

// If khach_hang_id is provided (logged in user), use it directly
if ($providedCustomerId) {
    // Verify the khach_hang_id exists
    $verifySql = "SELECT id, ten, dien_thoai, email, dia_chi FROM nguoi_dung WHERE id = ? AND vai_tro = 'khach_hang' LIMIT 1";
    $stmt = $conn->prepare($verifySql);
    $stmt->bind_param('i', $providedCustomerId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        $customer = $result->fetch_assoc();
        $khach_hang_id = $customer['id'];
        
        // Update customer info if different
        if ($customerName != $customer['ten'] || $email != $customer['email'] || $dia_chi != $customer['dia_chi']) {
            $updateSql = "UPDATE nguoi_dung SET ten = ?, email = ?, dia_chi = ? WHERE id = ?";
            $updateStmt = $conn->prepare($updateSql);
            $updateStmt->bind_param('sssi', $customerName, $email, $dia_chi, $khach_hang_id);
            $updateStmt->execute();
            $updateStmt->close();
        }
    }
    $stmt->close();
} else {
    // Guest booking - try to find existing customer by dien_thoai or create new
    $findCustomerSql = "SELECT id FROM nguoi_dung WHERE dien_thoai = ? AND vai_tro = 'khach_hang' LIMIT 1";
    $stmt = $conn->prepare($findCustomerSql);
    $stmt->bind_param('s', $dien_thoai);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        $customer = $result->fetch_assoc();
        $khach_hang_id = $customer['id'];
    } else {
        // Create new customer account
        $ten_dang_nhap = 'customer_' . $dien_thoai;
        $randomPassword = bin2hex(random_bytes(8));
        $hashedPassword = password_hash($randomPassword, PASSWORD_DEFAULT);
        $defaultAvatar = 'uploads/avatars/default.jpg';
        $defaultCccd = 'uploads/cccd/default.jpg';
        
        $createUserSql = "INSERT INTO nguoi_dung (ten, dien_thoai, email, dia_chi, vai_tro, ten_dang_nhap, mat_khau, anh_dai_dien, anh_cccd) 
                          VALUES (?, ?, ?, ?, 'khach_hang', ?, ?, ?, ?)";
        $stmt2 = $conn->prepare($createUserSql);
        $stmt2->bind_param('ssssssss', $customerName, $dien_thoai, $email, $dia_chi, $ten_dang_nhap, $hashedPassword, $defaultAvatar, $defaultCccd);
        
        if ($stmt2->execute()) {
            $khach_hang_id = $conn->insert_id;
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Lỗi khi tạo tài khoản khách hàng: ' . $conn->error
            ]);
            exit;
        }
        $stmt2->close();
    }
    $stmt->close();
}

// Insert invoice
$insertSql = "INSERT INTO hoa_don (
    khach_hang_id, 
    ten_khach_hang, 
    dien_thoai, 
    email, 
    dia_chi, 
    dich_vu, 
    goi_dich_vu, 
    cong_viec, 
    ngay_bat_dau, 
    ngay_ket_thuc, 
    gio_bat_dau, 
    gio_ket_thuc, 
    tong_gio, 
    tong_ngay,
    don_vi_thoi_gian,
    so_luong_thoi_gian,
    gia_tien, 
    trang_thai, 
    ghi_chu,
    yeu_cau_them
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'cho_duyet', ?, ?)";

$stmt = $conn->prepare($insertSql);
$stmt->bind_param(
    'isssssssssssdisidss',
    $khach_hang_id,
    $customerName,
    $dien_thoai,
    $email,
    $dia_chi,
    $dich_vu,
    $goi_dich_vu,
    $cong_viec,
    $startDate,
    $endDate,
    $startTime,
    $endTime,
    $totalHours,
    $totalDays,
    $durationUnit,
    $durationAmount,
    $gia_tien,
    $ghi_chu,
    $extraRequest
);

if ($stmt->execute()) {
    $invoiceId = $conn->insert_id;
    
    echo json_encode([
        'success' => true,
        'result' => 'success',
        'message' => 'Đặt lịch thành công! Chúng tôi sẽ liên hệ với bạn sớm nhất.',
        'hoa_don_id' => $invoiceId
    ]);
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Lỗi khi lưu đặt lịch: ' . $conn->error
    ]);
}

$stmt->close();
$conn->close();
?>
