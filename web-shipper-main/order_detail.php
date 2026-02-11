<?php
session_start();
require_once 'config/db.php';

// Kiểm tra quyền Admin
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    header("Location: index.php");
    exit;
}

$id = $_GET['id'] ?? 0;
$msg = "";

// Xử lý phân công Shipper
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['assign_shipper'])) {
    $shipper_id = intval($_POST['shipper_id']);
    $stmt = $conn->prepare("UPDATE orders SET shipper_id = ? WHERE id = ?");
    $stmt->bind_param("ii", $shipper_id, $id);
    if ($stmt->execute()) {
        $msg = "Đã phân công shipper thành công!";
        // Refresh lại trang để lấy dữ liệu mới
        header("Refresh:0");
    } else {
        $msg = "Lỗi: " . $conn->error;
    }
}

// Xử lý "Đưa lên trang chủ"
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['promote_testimonial'])) {
    $order_id_to_promote = intval($_POST['order_id']);

    // Lấy thông tin từ đơn hàng
    $promo_stmt = $conn->prepare("SELECT o.name, o.rating, o.feedback, u.fullname FROM orders o LEFT JOIN users u ON o.user_id = u.id WHERE o.id = ? AND o.rating > 0 AND o.feedback != ''");
    $promo_stmt->bind_param("i", $order_id_to_promote);
    $promo_stmt->execute();
    $promo_order = $promo_stmt->get_result()->fetch_assoc();

    if ($promo_order) {
        // Chèn vào bảng testimonials
        $insert_stmt = $conn->prepare("INSERT INTO testimonials (customer_name, customer_role, rating, content) VALUES (?, ?, ?, ?)");
        $customer_name = !empty($promo_order['fullname']) ? $promo_order['fullname'] : $promo_order['name']; // Ưu tiên tên tài khoản
        $customer_role = 'Khách hàng'; // Default role
        $insert_stmt->bind_param("ssis", $customer_name, $customer_role, $promo_order['rating'], $promo_order['feedback']);

        if ($insert_stmt->execute()) {
            $msg = "Đã đưa đánh giá lên trang chủ thành công!";
        } else {
            $msg = "Lỗi khi thêm testimonial: " . $conn->error;
        }
    } else {
        $msg = "Không thể thực hiện. Đơn hàng này chưa có đánh giá hoặc nội dung trống.";
    }
}

// Xử lý Cập nhật trạng thái thanh toán
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['update_payment_status'])) {
    $new_payment_status = $_POST['payment_status'];
    $stmt = $conn->prepare("UPDATE orders SET payment_status = ? WHERE id = ?");
    $stmt->bind_param("si", $new_payment_status, $id);
    if ($stmt->execute()) {
        $msg = "Cập nhật trạng thái thanh toán thành công!";
    } else {
        $msg = "Lỗi khi cập nhật thanh toán: " . $conn->error;
    }
}

// --- TÍNH NĂNG MỚI: HOÀN TIỀN (REFUND) ---
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['refund_order'])) {
    // Chỉ cho phép hoàn tiền nếu trạng thái hiện tại là 'paid'
    $stmt_check = $conn->prepare("SELECT payment_status FROM orders WHERE id = ?");
    $stmt_check->bind_param("i", $id);
    $stmt_check->execute();
    $curr_pay = $stmt_check->get_result()->fetch_assoc();

    if ($curr_pay['payment_status'] === 'paid') {
        $stmt = $conn->prepare("UPDATE orders SET payment_status = 'refunded' WHERE id = ?");
        $stmt->bind_param("i", $id);
        if ($stmt->execute()) {
            $msg = "Đã hoàn tiền đơn hàng thành công!";
            // Ghi log
            $admin_id = $_SESSION['user_id'];
            $conn->query("INSERT INTO order_logs (order_id, user_id, old_status, new_status) VALUES ($id, $admin_id, 'Paid', 'Refunded')");
            header("Refresh:0"); // Refresh để cập nhật UI
        } else {
            $msg = "Lỗi: " . $conn->error;
        }
    } else {
        $msg = "Chỉ có thể hoàn tiền cho đơn hàng đã thanh toán.";
    }
}

// --- TÍNH NĂNG MỚI: GHI CHÚ NỘI BỘ (ADMIN NOTE) ---
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['save_admin_note'])) {
    $admin_note = trim($_POST['admin_note']);
    $stmt = $conn->prepare("UPDATE orders SET admin_note = ? WHERE id = ?");
    $stmt->bind_param("si", $admin_note, $id);
    if ($stmt->execute()) {
        $msg = "Đã lưu ghi chú nội bộ.";
        header("Refresh:0");
    } else {
        $msg = "Lỗi: " . $conn->error;
    }
}

// Xử lý Cập nhật trạng thái
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['update_status'])) {
    $new_status = $_POST['status'];
    $override = isset($_POST['override_status']); // Checkbox override

    // 1. Lấy trạng thái hiện tại để kiểm tra
    $check_stmt = $conn->prepare("SELECT status FROM orders WHERE id = ?");
    $check_stmt->bind_param("i", $id);
    $check_stmt->execute();
    $curr = $check_stmt->get_result()->fetch_assoc();
    $old_status = $curr['status'];
    $check_stmt->close();

    // 2. Kiểm tra Workflow (Quy trình chặt chẽ)
    $allowed = false;
    if ($override || $old_status === $new_status) {
        $allowed = true;
    } else {
        // Quy tắc chuyển đổi hợp lệ
        switch ($old_status) {
            case 'pending': // Chờ xử lý -> Chỉ được sang Đang giao hoặc Hủy
                if (in_array($new_status, ['shipping', 'cancelled']))
                    $allowed = true;
                break;
            case 'shipping': // Đang giao -> Chỉ được sang Hoàn tất hoặc Hủy
                if (in_array($new_status, ['completed', 'cancelled']))
                    $allowed = true;
                break;
            default: // completed, cancelled -> Không được đổi tiếp nếu không tick Override
                $allowed = false;
                break;
        }
    }

    if ($allowed) {
        $stmt = $conn->prepare("UPDATE orders SET status = ? WHERE id = ?");
        $stmt->bind_param("si", $new_status, $id);
        if ($stmt->execute()) {
            $msg = "Cập nhật trạng thái thành công!";
            // 3. Ghi Log thay đổi
            $admin_id = $_SESSION['user_id'];
            $conn->query("INSERT INTO order_logs (order_id, user_id, old_status, new_status) VALUES ($id, $admin_id, '$old_status', '$new_status')");
        } else {
            $msg = "Lỗi hệ thống: " . $conn->error;
        }

        // TẠO THÔNG BÁO CHO KHÁCH HÀNG
        $order_user_id_res = $conn->query("SELECT user_id, order_code FROM orders WHERE id = $id");
        $order_info = $order_user_id_res->fetch_assoc();
        if ($order_info && $order_info['user_id']) {
            $status_map_vietnamese = ['shipping' => 'đang được giao', 'completed' => 'đã hoàn tất', 'cancelled' => 'đã bị hủy'];
            $status_text = $status_map_vietnamese[$new_status] ?? 'đã được cập nhật';
            $notification_message = "Đơn hàng #{$order_info['order_code']} của bạn {$status_text}.";
            $notification_link = "customer_order_detail.php?id={$id}";

            $notify_stmt = $conn->prepare("INSERT INTO notifications (user_id, order_id, message, link) VALUES (?, ?, ?, ?)");
            $notify_stmt->bind_param("iiss", $order_info['user_id'], $id, $notification_message, $notification_link);
            $notify_stmt->execute();
            $notify_stmt->close();
        }

    } else {
        $msg = "Không thể chuyển từ <b>$old_status</b> sang <b>$new_status</b> theo quy trình. Vui lòng chọn 'Cho phép sửa trạng thái bất kỳ' nếu cần thiết.";
    }
}

// Lấy thông tin đơn hàng
$stmt = $conn->prepare("SELECT * FROM orders WHERE id = ?");
$stmt->bind_param("i", $id);
$stmt->execute();
$result = $stmt->get_result();
$order = $result->fetch_assoc();

if (!$order) {
    die("Đơn hàng không tồn tại.");
}

// Lấy lịch sử thay đổi (Log)
$logs = [];
$log_res = $conn->query("SELECT l.*, u.fullname FROM order_logs l LEFT JOIN users u ON l.user_id = u.id WHERE l.order_id = $id ORDER BY l.changed_at DESC");
if ($log_res)
    while ($r = $log_res->fetch_assoc())
        $logs[] = $r;

// Lấy danh sách Shipper
$shippers = [];
$s_res = $conn->query("SELECT id, fullname, phone FROM users WHERE role = 'shipper'");
if ($s_res)
    while ($r = $s_res->fetch_assoc())
        $shippers[] = $r;

// Helper maps (dùng chung logic hiển thị)
$pkg_map = [
    'document' => 'Tài liệu',
    'food' => 'Đồ ăn',
    'clothes' => 'Quần áo',
    'electronic' => 'Điện tử',
    'other' => 'Khác'
];
$svc_map = [
    'standard' => 'Tiêu chuẩn',
    'express' => 'Hỏa tốc',
    'bulk' => 'Số lượng lớn'
];
?>
<!DOCTYPE html>
<html lang="vi">

<head>
    <meta charset="UTF-8">
    <title>Chi tiết đơn hàng #
        <?php echo $order['order_code']; ?>
    </title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="assets/css/admin.css?v=<?php echo time(); ?>">
    <link rel="stylesheet" href="assets/css/admin-pages.css?v=<?php echo time(); ?>">
</head>

<body>
    <?php include 'includes/header_admin.php'; ?>

    <main class="admin-container">
        <a href="orders_manage.php" class="back-link">← Quay lại danh sách</a>

        <div class="page-header">
            <h2 class="page-title">Chi tiết đơn hàng: <span style="color:#ff7a00">
                    <?php echo $order['order_code']; ?>
                </span></h2>
        </div>

        <?php if ($msg): ?>
            <div
                style="padding: 15px; background: #d4edda; color: #155724; border-radius: 8px; margin-bottom: 20px; border: 1px solid #c3e6cb;">
                <?php echo $msg; ?>
            </div>
        <?php endif; ?>

        <div class="detail-container">
            <!-- Row 1: Thông tin chung & Cập nhật trạng thái -->
            <div class="detail-row">
                <div class="detail-col">
                    <h3>Thông tin chung</h3>
                    <div class="info-group"><span class="info-label">Mã đơn:</span> <strong>
                            <?php echo $order['order_code']; ?>
                        </strong></div>
                    <div class="info-group"><span class="info-label">Ngày tạo:</span>
                        <?php echo date('d/m/Y H:i', strtotime($order['created_at'])); ?>
                    </div>
                    <div class="info-group"><span class="info-label">Loại dịch vụ:</span>
                        <?php echo $svc_map[$order['service_type']] ?? $order['service_type']; ?>
                    </div>

                    <!-- Form Phân công Shipper -->
                    <div style="margin-top: 15px; padding-top: 15px; border-top: 1px dashed #ccc;">
                        <form method="POST" style="display:flex; gap:10px; align-items:center;">
                            <span class="info-label">Shipper:</span>
                            <select name="shipper_id"
                                style="padding: 6px; border-radius: 4px; border: 1px solid #ccc; flex:1;">
                                <option value="0">-- Chưa phân công --</option>
                                <?php foreach ($shippers as $s): ?>
                                    <option value="<?php echo $s['id']; ?>" <?php echo $order['shipper_id'] == $s['id'] ? 'selected' : ''; ?>>
                                        <?php echo $s['fullname']; ?> (<?php echo $s['phone']; ?>)
                                    </option>
                                <?php endforeach; ?>
                            </select>
                            <button type="submit" name="assign_shipper" class="btn-primary"
                                style="padding: 6px 12px; font-size: 13px;">Lưu</button>
                        </form>
                    </div>
                </div>
                <div class="detail-col">
                    <h3>Cập nhật trạng thái</h3>
                    <form method="POST" class="status-form"
                        onsubmit="return confirm('Bạn có chắc chắn muốn cập nhật trạng thái đơn hàng này?');">
                        <select name="status"
                            style="padding: 10px; border-radius: 6px; border: 1px solid #ccc; flex: 1; font-size: 15px;">
                            <option value="pending" <?php echo $order['status'] == 'pending' ? 'selected' : ''; ?>>⏳ Chờ
                                xử lý</option>
                            <option value="shipping" <?php echo $order['status'] == 'shipping' ? 'selected' : ''; ?>>🚚
                                Đang giao hàng</option>
                            <option value="completed" <?php echo $order['status'] == 'completed' ? 'selected' : ''; ?>>✅
                                Hoàn tất</option>
                            <option value="cancelled" <?php echo $order['status'] == 'cancelled' ? 'selected' : ''; ?>>❌
                                Đã hủy</option>
                        </select>
                        <div style="flex:1">
                            <button type="submit" name="update_status" class="btn-primary"
                                style="padding: 10px 20px; border: none; cursor: pointer; width:100%">Cập nhật</button>
                            <label class="checkbox-override">
                                <input type="checkbox" name="override_status"> Cho phép sửa trạng thái bất kỳ
                            </label>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Row 2: Người gửi & Người nhận -->
            <div class="detail-row">
                <div class="detail-col">
                    <h3>Người gửi</h3>
                    <div class="info-group"><span class="info-label">Họ tên:</span>
                        <?php echo htmlspecialchars($order['name']); ?>
                    </div>
                    <div class="info-group"><span class="info-label">SĐT:</span>
                        <?php echo htmlspecialchars($order['phone']); ?>
                    </div>
                    <div class="info-group"><span class="info-label">Địa chỉ lấy:</span>
                        <?php echo htmlspecialchars($order['pickup_address']); ?>
                    </div>
                </div>
                <div class="detail-col">
                    <h3>Người nhận</h3>
                    <div class="info-group"><span class="info-label">Họ tên:</span>
                        <?php echo htmlspecialchars($order['receiver_name']); ?>
                    </div>
                    <div class="info-group"><span class="info-label">SĐT:</span>
                        <?php echo htmlspecialchars($order['receiver_phone']); ?>
                    </div>
                    <div class="info-group"><span class="info-label">Địa chỉ giao:</span>
                        <?php echo htmlspecialchars($order['delivery_address']); ?>
                    </div>
                </div>
            </div>

            <!-- Row 3: Hàng hóa & Thanh toán -->
            <div class="detail-row" style="border-bottom: none;">
                <div class="detail-col">
                    <h3>Thông tin hàng hóa</h3>
                    <div class="info-group"><span class="info-label">Loại hàng:</span>
                        <?php echo $pkg_map[$order['package_type']] ?? $order['package_type']; ?>
                    </div>
                    <div class="info-group"><span class="info-label">Khối lượng:</span>
                        <?php echo $order['weight']; ?> kg
                    </div>
                    <div class="info-group"><span class="info-label">Ghi chú:</span>
                        <?php echo nl2br(htmlspecialchars($order['note'])); ?>
                    </div>
                    <?php if ($order['shipper_note']): ?>
                        <div class="info-group"
                            style="margin-top:10px; padding:10px; background:#fff3cd; border-radius:4px;"><span
                                class="info-label">💬 Shipper Note:</span>
                            <strong><?php echo nl2br(htmlspecialchars($order['shipper_note'])); ?></strong>
                        </div>
                    <?php endif; ?>
                </div>
                <div class="detail-col">
                    <h3>Thanh toán</h3>
                    <div class="info-group"><span class="info-label">Phương thức:</span> <strong>
                            <?php echo ($order['payment_method'] == 'bank_transfer') ? 'Chuyển khoản' : 'Tiền mặt (COD)'; ?>
                        </strong></div>
                    <div class="info-group"><span class="info-label">Phí ship:</span> <strong style="color:#d9534f">
                            <?php echo number_format($order['shipping_fee']); ?>đ
                        </strong></div>
                    <div class="info-group"><span class="info-label">Thu hộ (COD):</span>
                        <?php echo number_format($order['cod_amount']); ?>đ
                    </div>

                    <!-- Form cập nhật trạng thái thanh toán -->
                    <?php if ($order['payment_method'] == 'bank_transfer' && $order['payment_status'] != 'refunded'): ?>
                        <div style="margin-top: 15px; padding-top: 15px; border-top: 1px dashed #ccc;">
                            <form method="POST" style="display:flex; gap:10px; align-items:center;"
                                onsubmit="return confirm('Xác nhận thay đổi trạng thái thanh toán?')">
                                <span class="info-label">Trạng thái TT:</span>
                                <select name="payment_status"
                                    style="padding: 6px; border-radius: 4px; border: 1px solid #ccc; flex:1;">
                                    <option value="unpaid" <?php echo $order['payment_status'] == 'unpaid' ? 'selected' : ''; ?>>Chưa thanh
                                        toán</option>
                                    <option value="paid" <?php echo $order['payment_status'] == 'paid' ? 'selected' : ''; ?>>
                                        Đã thanh toán
                                    </option>
                                </select>
                                <button type="submit" name="update_payment_status" class="btn-primary"
                                    style="padding: 6px 12px; font-size: 13px; background-color: #28a745;">Lưu</button>
                            </form>
                        </div>
                    <?php endif; ?>

                    <!-- Nút Hoàn tiền (Chỉ hiện khi đã thanh toán) -->
                    <?php if ($order['payment_status'] == 'paid'): ?>
                        <form method="POST"
                            onsubmit="return confirm('⚠️ CẢNH BÁO: Bạn có chắc chắn muốn hoàn tiền cho đơn hàng này? Hành động này sẽ được ghi lại.')"
                            style="margin-top:10px;">
                            <button type="submit" name="refund_order" class="btn-action"
                                style="width:100%; background-color:#6f42c1; border-color:#6f42c1; color:white;">
                                💸 Hoàn tiền
                            </button>
                        </form>
                    <?php elseif ($order['payment_status'] == 'refunded'): ?>
                        <div
                            style="margin-top:10px; padding:10px; background:#e2e3e5; color:#383d41; border-radius:4px; text-align:center; font-weight:bold;">
                            ↩️ Đã hoàn tiền
                        </div>
                    <?php endif; ?>

                    <div class="info-group"><span class="info-label">Tổng thu:</span> <strong
                            style="font-size:18px; color:#0a2a66">
                            <?php echo number_format($order['shipping_fee'] + $order['cod_amount']); ?>đ
                        </strong></div>
                </div>
            </div>

            <!-- Row MỚI: Xử lý sự cố & Ghi chú nội bộ -->
            <div class="detail-row"
                style="background-color: #fff3cd; border: 1px solid #ffeeba; border-radius: 8px; padding: 15px;">
                <div class="detail-col" style="flex: 0 0 100%; padding-right: 0;">
                    <h3 style="color:#856404; border-bottom-color:#856404;">🛡️ Xử lý & Ghi chú nội bộ (Admin Only)</h3>
                    <p style="font-size:13px; color:#666; margin-bottom:10px;">Ghi lại các vấn đề phát sinh, lý do hoàn
                        tiền hoặc thông tin xử lý khiếu nại. Khách hàng và Shipper sẽ <strong>không</strong> thấy nội
                        dung này.</p>
                    <form method="POST">
                        <textarea name="admin_note" rows="3"
                            style="width:100%; padding:10px; border:1px solid #ccc; border-radius:4px; font-family:inherit;"
                            placeholder="Nhập ghi chú xử lý..."><?php echo htmlspecialchars($order['admin_note'] ?? ''); ?></textarea>
                        <button type="submit" name="save_admin_note" class="btn-primary"
                            style="margin-top:10px; background-color:#856404; border-color:#856404;">Lưu ghi
                            chú</button>
                    </form>
                </div>
            </div>

            <!-- Row 4: Hóa đơn công ty -->
            <?php if ($order['is_corporate']): ?>
                <div class="detail-row">
                    <div class="detail-col" style="flex: 0 0 100%;">
                        <h3>Thông tin xuất hóa đơn</h3>
                        <div class="info-group"><span class="info-label">Tên công ty:</span>
                            <strong><?php echo htmlspecialchars($order['company_name']); ?></strong>
                        </div>
                        <div class="info-group"><span class="info-label">Mã số thuế:</span>
                            <?php echo htmlspecialchars($order['company_tax_code']); ?>
                        </div>
                        <div class="info-group"><span class="info-label">Địa chỉ công ty:</span>
                            <?php echo htmlspecialchars($order['company_address']); ?>
                        </div>
                        <?php if (!empty($order['company_bank_info'])): ?>
                            <div class="info-group"><span class="info-label">Thông tin TK:</span>
                                <?php echo nl2br(htmlspecialchars($order['company_bank_info'])); ?>
                            </div>
                        <?php endif; ?>
                    </div>
                </div>
            <?php endif; ?>

            <!-- Row 4: Đánh giá từ khách hàng -->
            <?php if ($order['rating'] > 0): ?>
                <div class="detail-row">
                    <div class="detail-col">
                        <h3>⭐ Đánh giá từ khách hàng</h3>
                        <div class="info-group"><span class="info-label">Điểm:</span> <strong
                                style="color:#ffc107; font-size:18px;"><?php echo str_repeat('★', $order['rating']) . str_repeat('☆', 5 - $order['rating']); ?></strong>
                        </div>
                        <div class="info-group"><span class="info-label">Nhận xét:</span> <em
                                style="background:#f9f9f9; padding:5px; border-radius:4px; display:inline-block;">"<?php echo htmlspecialchars($order['feedback']); ?>"</em>
                        </div>

                        <form method="POST"
                            onsubmit="return confirm('Bạn có chắc muốn đưa đánh giá này lên trang chủ không?');"
                            style="margin-top: 15px;">
                            <input type="hidden" name="order_id" value="<?php echo $order['id']; ?>">
                            <button type="submit" name="promote_testimonial" class="btn-primary"
                                style="background-color: #28a745; border-color:#28a745;">🌟 Đưa lên trang chủ</button>
                        </form>
                    </div>
                </div>
            <?php endif; ?>

            <!-- Row 4: Lịch sử thay đổi -->
            <div class="log-section">
                <h3>📜 Lịch sử thay đổi trạng thái</h3>
                <?php if (!empty($logs)): ?>
                    <table class="log-table">
                        <thead>
                            <tr>
                                <th>Thời gian</th>
                                <th>Người thực hiện</th>
                                <th>Thay đổi</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($logs as $log): ?>
                                <tr>
                                    <td><?php echo date('d/m/Y H:i', strtotime($log['changed_at'])); ?></td>
                                    <td><?php echo htmlspecialchars($log['fullname']); ?></td>
                                    <td>
                                        <span
                                            class="status-badge status-<?php echo $log['old_status']; ?>"><?php echo $log['old_status']; ?></span>
                                        ➔
                                        <span
                                            class="status-badge status-<?php echo $log['new_status']; ?>"><?php echo $log['new_status']; ?></span>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                <?php else: ?>
                    <p style="color:#999; font-style:italic;">Chưa có lịch sử thay đổi nào.</p>
                <?php endif; ?>
            </div>
        </div>
    </main>

    <?php include 'includes/footer.php'; ?>
</body>