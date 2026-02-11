<?php
session_start();
require_once 'config/db.php';
require_once 'config/settings_helper.php';

if (!isset($_SESSION['user_id'])) {
    header("Location: login.php");
    exit;
}

$id = $_GET['id'] ?? 0;
$user_id = $_SESSION['user_id'];

// Xử lý đánh giá
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['submit_rating'])) {
    $rating = intval($_POST['rating']);
    $feedback = trim($_POST['feedback']);

    $stmt = $conn->prepare("UPDATE orders SET rating = ?, feedback = ? WHERE id = ? AND user_id = ?");
    $stmt->bind_param("isii", $rating, $feedback, $id, $user_id);
    $stmt->execute();
    $msg = "Cảm ơn bạn đã đánh giá!";
}

// Lấy thông tin đơn hàng (Chỉ lấy nếu đúng user_id)
$stmt = $conn->prepare("SELECT * FROM orders WHERE id = ? AND user_id = ?");
$stmt->bind_param("ii", $id, $user_id);
$stmt->execute();
$order = $stmt->get_result()->fetch_assoc();

if (!$order) {
    die("Đơn hàng không tồn tại hoặc bạn không có quyền truy cập.");
}

// Lấy lịch sử trạng thái
$logs = [];
$log_res = $conn->query("SELECT old_status, new_status, changed_at FROM order_logs WHERE order_id = $id ORDER BY changed_at ASC");
if ($log_res)
    while ($r = $log_res->fetch_assoc())
        $logs[] = $r;

$pkg_map = ['document' => 'Tài liệu', 'food' => 'Đồ ăn', 'clothes' => 'Quần áo', 'electronic' => 'Điện tử', 'other' => 'Khác'];
$svc_map = ['standard' => 'Tiêu chuẩn', 'express' => 'Hỏa tốc', 'bulk' => 'Số lượng lớn'];
$status_map = [
    'pending' => 'Chờ xử lý',
    'shipping' => 'Đang giao hàng',
    'completed' => 'Hoàn tất',
    'cancelled' => 'Đã hủy',
    'unknown' => 'Không xác định'
];
?>
<!DOCTYPE html>
<html lang="vi">

<head>
    <meta charset="UTF-8">
    <title>Chi tiết đơn hàng #<?php echo $order['order_code']; ?></title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="assets/css/styles.css?v=<?php echo time(); ?>">
</head>

<body>
    <?php include 'includes/header_user.php'; ?>

    <main class="container" style="padding: 40px 20px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
            <h2 class="section-title" style="margin:0;">Đơn hàng: <span
                    style="color:#ff7a00"><?php echo $order['order_code']; ?></span></h2>
            <div>
                <a href="print_invoice.php?id=<?php echo $order['id']; ?>" target="_blank" class="btn-print">🖨️ In hóa
                    đơn</a>
                <?php if ($order['status'] === 'pending'): ?>
                    <button onclick="openCancelModal('<?php echo $order['order_code']; ?>')" class="btn-secondary"
                        style="color:#d9534f; border-color:#d9534f; padding: 8px 16px; margin-right: 5px;">Hủy đơn hàng</button>
                <?php endif; ?>
                <a href="order_history.php" class="btn-secondary"
                    style="color:#0a2a66; border-color:#0a2a66; padding: 8px 16px;">Quay lại</a>
            </div>
        </div>

        <?php if (isset($msg)): ?>
            <div style="padding:10px; background:#d4edda; color:#155724; margin-bottom:15px; border-radius:4px;">
                <?php echo $msg; ?>
            </div><?php endif; ?>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
            <!-- Cột 1: Thông tin vận chuyển -->
            <div class="detail-box">
                <h3 style="color:#0a2a66; border-bottom:2px solid #ff7a00; padding-bottom:10px; margin-bottom:15px;">
                    Thông tin vận chuyển</h3>
                <div class="info-row"><span class="info-label">Người gửi:</span> <span
                        class="info-val"><?php echo htmlspecialchars($order['name']); ?><br><small><?php echo $order['phone']; ?></small></span>
                </div>
                <div class="info-row"><span class="info-label">Địa chỉ lấy:</span> <span
                        class="info-val"><?php echo htmlspecialchars($order['pickup_address']); ?></span></div>
                <div class="info-row"><span class="info-label">Người nhận:</span> <span
                        class="info-val"><?php echo htmlspecialchars($order['receiver_name']); ?><br><small><?php echo $order['receiver_phone']; ?></small></span>
                </div>
                <div class="info-row"><span class="info-label">Địa chỉ giao:</span> <span
                        class="info-val"><?php echo htmlspecialchars($order['delivery_address']); ?></span></div>
            </div>

            <!-- Cột 2: Chi tiết & Thanh toán -->
            <div class="detail-box">
                <h3 style="color:#0a2a66; border-bottom:2px solid #ff7a00; padding-bottom:10px; margin-bottom:15px;">Chi
                    tiết & Thanh toán</h3>
                <div class="info-row"><span class="info-label">Dịch vụ:</span> <span
                        class="info-val"><?php echo $svc_map[$order['service_type']] ?? $order['service_type']; ?></span>
                </div>
                <div class="info-row"><span class="info-label">Loại hàng:</span> <span
                        class="info-val"><?php echo $pkg_map[$order['package_type']] ?? $order['package_type']; ?>
                        (<?php echo $order['weight']; ?>kg)</span></div>
                <div class="info-row"><span class="info-label">Phương thức:</span> <span class="info-val"><?php echo $order['payment_method'] === 'bank_transfer' ? 'Chuyển khoản' : 'COD'; ?></span></div>
                <div class="info-row"><span class="info-label">Phí vận chuyển:</span> <span class="info-val"
                        style="color:#d9534f"><?php echo number_format($order['shipping_fee']); ?>đ</span></div>
                <div class="info-row"><span class="info-label">Thu hộ (COD):</span> <span
                        class="info-val"><?php echo number_format($order['cod_amount']); ?>đ</span></div>
                <div class="info-row">
                    <span class="info-label">Tổng thanh toán:</span> 
                    <span class="info-val" style="font-size:18px; color:#0a2a66"><?php echo number_format($order['shipping_fee'] + $order['cod_amount']); ?>đ</span>
                    <?php if ($order['payment_method'] === 'bank_transfer'): ?>
                        <?php if ($order['payment_status'] === 'paid'): ?>
                            <span style="display:inline-block; margin-left:10px; padding:4px 12px; background:#28a745; color:white; border-radius:12px; font-size:12px; font-weight:600;">✓ Đã thanh toán</span>
                        <?php else: ?>
                            <span style="display:inline-block; margin-left:10px; padding:4px 12px; background:#dc3545; color:white; border-radius:12px; font-size:12px; font-weight:600;">⚠ Chưa thanh toán</span>
                        <?php endif; ?>
                    <?php endif; ?>
                </div>
                <?php if ($order['payment_method'] === 'bank_transfer' && $order['payment_status'] === 'unpaid' && $order['status'] !== 'cancelled'): ?>
                    <div style="margin-top:15px; padding-top:15px; border-top:1px solid #eee;">
                        <button onclick="openPaymentModal('<?php echo $order['order_code']; ?>', <?php echo $order['shipping_fee']; ?>)" 
                            class="btn-primary" style="width:100%; padding:12px; font-size:16px;">💳 Thanh toán ngay</button>
                    </div>
                <?php endif; ?>
            </div>
        </div>

        <!-- Bằng chứng giao hàng -->
        <?php if (!empty($order['pod_image'])): ?>
            <div class="detail-box">
                <h3 style="color:#0a2a66; margin-bottom:15px;">📸 Bằng chứng giao hàng</h3>
                <img src="uploads/<?php echo htmlspecialchars($order['pod_image']); ?>" alt="POD"
                    style="max-width: 100%; height: auto; border-radius: 8px; border: 1px solid #eee;">
            </div>
        <?php endif; ?>

        <!-- Lịch sử trạng thái -->
        <div class="detail-box">
            <h3 style="color:#0a2a66; margin-bottom:15px;">Lịch sử trạng thái</h3>

            <?php
            // Chuẩn bị dữ liệu Timeline
            $timeline_data = [];

            // 1. Sự kiện tạo đơn
            $timeline_data[] = [
                'time' => $order['created_at'],
                'status' => 'Đơn hàng được tạo',
                'desc' => 'Đơn hàng đã được khởi tạo trên hệ thống.',
                'code' => 'created'
            ];

            // 2. Các sự kiện thay đổi trạng thái
            foreach ($logs as $log) {
                $st_key = $log['new_status'];
                $status_text = $status_map[$st_key] ?? $st_key;
                $desc = '';

                if ($st_key == 'shipping') {
                    $status_text = "Đang giao hàng";
                    $desc = "Tài xế đã nhận đơn và đang di chuyển đến địa chỉ giao.";
                } elseif ($st_key == 'completed') {
                    $status_text = "Giao hàng thành công";
                    $desc = "Kiện hàng đã được giao tận tay người nhận.";
                } elseif ($st_key == 'cancelled') {
                    $status_text = "Đã hủy";
                    $desc = "Đơn hàng đã bị hủy bỏ.";
                } elseif ($st_key == 'pending') {
                    $status_text = "Chờ xử lý";
                    $desc = "Đang chờ tài xế tiếp nhận đơn hàng.";
                }

                $timeline_data[] = [
                    'time' => $log['changed_at'],
                    'status' => $status_text,
                    'desc' => $desc,
                    'code' => $st_key
                ];
            }
            ?>

            <div class="modern-timeline">
                <?php
                $total_events = count($timeline_data);
                foreach ($timeline_data as $index => $event):
                    // Kiểm tra nếu là phần tử cuối cùng (mới nhất)
                    $is_latest = ($index === $total_events - 1);
                    ?>
                    <div
                        class="timeline-item <?php echo $is_latest ? 'latest' : ''; ?> status-<?php echo $event['code']; ?>">
                        <div class="timeline-marker"></div>
                        <div class="timeline-content">
                            <div class="time"><?php echo date('H:i - d/m/Y', strtotime($event['time'])); ?></div>
                            <div class="status"><?php echo $event['status']; ?></div>
                            <?php if ($event['desc']): ?>
                                <div class="desc"><?php echo $event['desc']; ?></div>
                            <?php endif; ?>
                        </div>
                    </div>
                <?php endforeach; ?>
            </div>
        </div>

        <!-- Đánh giá (Chỉ hiện khi hoàn tất) -->
        <?php if ($order['status'] == 'completed'): ?>
            <div class="detail-box">
                <h3 style="color:#0a2a66; margin-bottom:15px;">Đánh giá dịch vụ</h3>
                <?php if ($order['rating']): ?>
                    <div style="text-align:center;">
                        <div style="font-size:30px; color:#ffcc00;">
                            <?php echo str_repeat('★', $order['rating']) . str_repeat('☆', 5 - $order['rating']); ?>
                        </div>
                        <p><em>"<?php echo htmlspecialchars($order['feedback']); ?>"</em></p>
                    </div>
                <?php else: ?>
                    <form method="POST">
                        <div class="rating-stars" id="star-container" style="text-align:center; margin-bottom:10px;">
                            <span data-val="1">★</span><span data-val="2">★</span><span data-val="3">★</span><span
                                data-val="4">★</span><span data-val="5">★</span>
                        </div>
                        <input type="hidden" name="rating" id="rating-input" value="5">
                        <textarea name="feedback" placeholder="Nhập nhận xét của bạn..."
                            style="width:100%; padding:10px; border:1px solid #ddd; border-radius:4px; margin-bottom:10px;"></textarea>
                        <button type="submit" name="submit_rating" class="btn-primary" style="width:100%;">Gửi đánh giá</button>
                    </form>
                <?php endif; ?>
            </div>
        <?php endif; ?>

    </main>
    
    <!-- Modal Thanh toán QR -->
    <div id="payment-modal" class="modal" style="display:none; position:fixed; z-index:9999; left:0; top:0; width:100%; height:100%; overflow:auto; background-color:rgba(0,0,0,0.5);">
        <div class="modal-content" style="background-color:#fff; margin:5% auto; padding:30px; border:1px solid #888; width:90%; max-width:500px; border-radius:12px; box-shadow:0 4px 20px rgba(0,0,0,0.3);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <h3 style="margin:0; color:#0a2a66;">💳 Thanh toán đơn hàng</h3>
                <span class="close" onclick="closePaymentModal()" style="color:#aaa; font-size:28px; font-weight:bold; cursor:pointer;">&times;</span>
            </div>
            
            <div id="payment-content" style="text-align:center;">
                <p style="margin-bottom:15px; color:#666;">Quét mã QR bên dưới để thanh toán</p>
                <div id="qr-container" style="margin:20px 0;">
                    <!-- QR Code will be inserted here -->
                </div>
                <div style="background:#f8f9fa; padding:15px; border-radius:8px; margin-top:20px;">
                    <p style="margin:5px 0;"><strong>Ngân hàng:</strong> <?php echo htmlspecialchars(getSetting($conn, 'bank_name', 'MB Bank')); ?></p>
                    <p style="margin:5px 0;"><strong>Số TK:</strong> <?php echo htmlspecialchars(getSetting($conn, 'bank_account_no', '0333666999')); ?></p>
                    <p style="margin:5px 0;"><strong>Chủ TK:</strong> <?php echo htmlspecialchars(getSetting($conn, 'bank_account_name', 'FASTGO LOGISTICS')); ?></p>
                    <p style="margin:5px 0; color:#d9534f; font-weight:600;"><strong>Số tiền:</strong> <span id="payment-amount"></span>đ</p>
                    <p style="margin:5px 0; font-size:13px; color:#666;"><strong>Nội dung:</strong> <span id="payment-note"></span></p>
                </div>
                <p style="margin-top:15px; font-size:13px; color:#999;">Sau khi chuyển khoản, hệ thống sẽ tự động xác nhận trong vòng 1-2 phút.</p>
            </div>
        </div>
    </div>
    
    <!-- Modal Hủy Đơn Hàng -->
    <div id="cancel-modal" class="modal" style="display:none; position:fixed; z-index:9999; left:0; top:0; width:100%; height:100%; overflow:auto; background-color:rgba(0,0,0,0.5);">
        <div class="modal-content" style="background-color:#fff; margin:10% auto; padding:20px; border:1px solid #888; width:90%; max-width:400px; border-radius:8px; box-shadow:0 4px 8px rgba(0,0,0,0.2);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                <h3 style="margin:0; color:#d9534f;">⚠️ Hủy Đơn Hàng</h3>
                <span class="close" onclick="closeCancelModal()" style="color:#aaa; font-size:28px; font-weight:bold; cursor:pointer;">&times;</span>
            </div>
            
            <p style="margin-bottom:15px;">Bạn có chắc chắn muốn hủy đơn hàng này? Thao tác này không thể hoàn tác.</p>
            
            <label for="cancel-reason" style="display:block; margin-bottom:8px; font-weight:600;">Lý do hủy:</label>
            <select id="cancel-reason" onchange="handleReasonChange(this)" style="width:100%; padding:10px; margin-bottom:10px; border:1px solid #ddd; border-radius:4px;">
                <option value="" disabled selected>-- Chọn lý do --</option>
                <option value="Thay đổi kế hoạch">Thay đổi kế hoạch</option>
                <option value="Tìm đước đơn vị vận chuyển khác">Tìm được đơn vị vận chuyển khác</option>
                <option value="Sai thông tin người nhận/địa chỉ">Sai thông tin người nhận/địa chỉ</option>
                <option value="other">Lý do khác...</option>
            </select>
            
            <input type="text" id="other-reason-input" placeholder="Nhập lý do của bạn..." style="display:none; width:100%; padding:10px; margin-bottom:15px; border:1px solid #ddd; border-radius:4px;">
            
            <div style="text-align:right; margin-top:20px;">
                <button onclick="closeCancelModal()" class="btn-secondary" style="margin-right:10px; padding:8px 16px;">Đóng</button>
                <button id="confirm-cancel-btn" onclick="confirmCancelOrder()" class="btn-primary" style="background-color:#d9534f; border:none; padding:8px 16px;">Xác nhận hủy đơn</button>
            </div>
        </div>
    </div>

    <?php include 'includes/footer.php'; ?>
    
    <script>
        // Bank settings from database
        window.bankSettings = {
            bankId: "<?php echo getSetting($conn, 'bank_id', 'MB'); ?>",
            accountNo: "<?php echo getSetting($conn, 'bank_account_no', '0333666999'); ?>",
            accountName: "<?php echo getSetting($conn, 'bank_account_name', 'FASTGO LOGISTICS'); ?>",
            template: "<?php echo getSetting($conn, 'qr_template', 'compact'); ?>"
        };
    </script>

    <script>
        // Script chọn sao đánh giá
        const stars = document.querySelectorAll('#star-container span');
        const input = document.getElementById('rating-input');
        if (stars.length > 0) {
            stars.forEach((star, idx) => {
                star.addEventListener('click', () => {
                    input.value = idx + 1;
                    stars.forEach((s, i) => {
                        s.style.color = i <= idx ? '#ffcc00' : '#ddd';
                    });
                });
            });
            // Init active all
            stars.forEach(s => s.style.color = '#ffcc00');
        }
    </script>
</body>

</html>