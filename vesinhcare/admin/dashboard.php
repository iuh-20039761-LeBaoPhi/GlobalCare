<?php
require_once "auth.php";
require_once "../main/db.php";

// thống kê nhanh
$totalOrders = $conn->query("SELECT COUNT(*) FROM bookings")->fetch_row()[0];
$pending = $conn->query("SELECT COUNT(*) FROM bookings WHERE status='pending'")->fetch_row()[0];
$approved = $conn->query("SELECT COUNT(*) FROM bookings WHERE status='approved'")->fetch_row()[0];
$cancelled = $conn->query("SELECT COUNT(*) FROM bookings WHERE status='cancelled'")->fetch_row()[0];

$latestOrders = $conn->query("
    SELECT customer_name, service_type, booking_date, status
    FROM bookings
    ORDER BY id DESC
    LIMIT 5
");

?>
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>Admin Dashboard</title>
    <link rel="stylesheet" href="../admin/layout/admin.css">
</head>
<body class="admin-page">

<!-- ===== SIDEBAR ===== -->
<div class="admin-layout">

    <?php require_once "../admin/layout/sidebar.php"; ?>


    <!-- ===== MAIN ===== -->
    <main class="main-content">
        <h1>Dashboard</h1>

        <div class="stats">

    <div class="stat-card">
        <div class="stat-icon">📦</div>
        <div class="stat-info">
            <h3><?= $totalOrders ?></h3>
            <p>Tổng đơn hàng</p>
            <span>Tất cả đơn đã ghi nhận</span>
        </div>
    </div>

    <div class="stat-card pending">
        <div class="stat-icon">⏳</div>
        <div class="stat-info">
            <h3><?= $pending ?></h3>
            <p>Chờ duyệt</p>
            <span>Cần xử lý ngay</span>
        </div>
    </div>

    <div class="stat-card approved">
        <div class="stat-icon">✅</div>
        <div class="stat-info">
            <h3><?= $approved ?></h3>
            <p>Đã duyệt</p>
            <span>Đang thực hiện</span>
        </div>
    </div>

    <div class="stat-card cancelled">
        <div class="stat-icon">❌</div>
        <div class="stat-info">
            <h3><?= $cancelled ?></h3>
            <p>Đã huỷ</p>
            <span>Không xử lý</span>
        </div>
    </div>

</div>

 <div class="table-card">
    <h2>🆕 Đơn mới nhất</h2>

    <table>
        <tr>
            <th>Khách</th>
            <th>Dịch vụ</th>
            <th>Ngày</th>
            <th>Trạng thái</th>
        </tr>

        <?php while ($row = $latestOrders->fetch_assoc()): ?>
        <tr>
            <td><?= htmlspecialchars($row['customer_name']) ?></td>
            <td><?= htmlspecialchars($row['service_type']) ?></td>
            <td><?= $row['booking_date'] ?></td>
            <td class="<?= $row['status'] ?>">
                <?= strtoupper($row['status']) ?>
            </td>
        </tr>
        <?php endwhile; ?>
    </table>
</div>


    </main>
</div>

</body>
</html>
