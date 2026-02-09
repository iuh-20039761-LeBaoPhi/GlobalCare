<?php
require_once "auth.php";
require_once "../main/db.php";

$result = $conn->query("SELECT * FROM bookings ORDER BY id DESC");
?>
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>Quản lý đơn</title>
    <link rel="stylesheet" href="../admin/layout/orders.css">
</head>
<body class="admin-page">

<div class="admin-layout">
   <?php require_once "../admin/layout/sidebar.php"; ?>


    <main class="main-content">
        <h1>Danh sách đơn hàng</h1>

        <table>
    <tr>
        <th>ID</th>
        <th>Khách</th>
        <th>SĐT</th>
        <th>Dịch vụ</th>
        <th>Ngày</th>
        <th>Ghi chú</th>
        <th>Trạng thái</th>
        <th>Hành động</th>
    </tr>

    <?php while ($row = $result->fetch_assoc()): ?>
    <tr>
        <td><?= $row['id'] ?></td>

        <td><?= htmlspecialchars($row['customer_name']) ?></td>

        <td><?= htmlspecialchars($row['phone']) ?></td>

        <td><?= htmlspecialchars($row['service_type']) ?></td>

        <td><?= $row['booking_date'] ?></td>

        <td style="max-width:250px; text-align:left;">
            <?= nl2br(htmlspecialchars($row['note'])) ?>
        </td>

        <td class="<?= $row['status'] ?>">
            <?= strtoupper($row['status']) ?>
        </td>

        <td>
            <?php if ($row['status'] == 'pending'): ?>
                <a class="btn approve"
                   href="order_action.php?id=<?= $row['id'] ?>&action=approve">
                   ✔ Duyệt
                </a>

                <a class="btn cancel"
                   href="order_action.php?id=<?= $row['id'] ?>&action=cancel"
                   onclick="return confirm('Huỷ đơn này?')">
                   ✖ Huỷ
                </a>
            <?php else: ?>
                —
            <?php endif; ?>
        </td>
    </tr>
    <?php endwhile; ?>
</table>

    </main>
</div>

</body>
</html>
