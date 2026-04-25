<?php
require_once __DIR__ . '/../includes/bootstrap.php';
moving_admin_require_login();

$orderCodeTitle = moving_admin_escape((string) ($_GET['madonhang'] ?? ''));

/**
 * Trang Chi tiết Đơn hàng "Siêu Nhúng" (Master Standalone)
 * - Tái tạo 100% giao diện dự án gốc.
 * - Không có Header Admin để tạo cảm giác "Trang riêng".
 * - Có nút quay lại Dashboard.
 */
?>
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chi tiết đơn hàng #<?php echo $orderCodeTitle; ?> | Admin Chuyển Dọn</title>
    
    <!-- Shared Project Styles (Bắt buộc) -->
    <link rel="stylesheet" href="../../public/assets/css/styles.css">
    <link rel="stylesheet" href="assets/css/order-detail-admin.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body class="standalone-order-page admin-order-detail-page" data-page="provider-order-detail">
    
    <!-- Thanh điều hướng Admin tối giản -->
    <div class="admin-back-bar">
        <span><i class="fas fa-user-shield me-2"></i> Chế độ Xem Admin</span>
        <a href="orders_manage.php" class="admin-back-btn">
            <i class="fas fa-arrow-left me-2"></i> Quay lại Admin Dashboard
        </a>
    </div>

    <main class="standalone-order-shell">
        <div id="provider-order-detail-root" class="standalone-order-state">
            <div class="standalone-order-loader">
                <i class="fa-solid fa-spinner fa-spin"></i>
                <span>Đang nạp file gốc của hệ thống...</span>
            </div>
        </div>
    </main>

    <!-- Dependencies -->
    <script src="https://api.dvqt.vn/js/krud.js"></script>
    
    <!-- Master Logic for Admin (No Redirects) -->
    <script type="module" src="assets/js/admin-order-detail-master.js"></script>
</body>
</html>
