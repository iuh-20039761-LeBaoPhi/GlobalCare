<?php
session_start();
require_once 'config/db.php';

// Kiểm tra quyền Admin
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    header("Location: index.php");
    exit;
}

$msg = "";

// Xử lý Khóa/Mở khóa nhanh
if (isset($_GET['action']) && isset($_GET['id'])) {
    $action = $_GET['action'];
    $uid = intval($_GET['id']);

    // Không cho phép tự khóa chính mình
    if ($uid == $_SESSION['user_id']) {
        $msg = "Không thể khóa tài khoản đang đăng nhập.";
    } else {
        if ($action === 'approve') {
            $conn->query("UPDATE users SET is_approved = 1 WHERE id = $uid AND role = 'shipper'");
            $msg = "Đã duyệt tài khoản shipper ID $uid.";
        }
        if ($action === 'lock') {
            $reason = isset($_GET['reason']) ? trim($_GET['reason']) : 'Vi phạm chính sách';
            $stmt = $conn->prepare("UPDATE users SET is_locked = 1, lock_reason = ? WHERE id = ?");
            $stmt->bind_param("si", $reason, $uid);
            $stmt->execute();
            $msg = "Đã khóa tài khoản ID $uid.";
        } elseif ($action === 'unlock') {
            $conn->query("UPDATE users SET is_locked = 0, lock_reason = NULL WHERE id = $uid");
            $msg = "Đã mở khóa tài khoản ID $uid.";
        } elseif ($action === 'delete') {
            // Xóa mềm hoặc xóa cứng (ở đây demo xóa cứng, cần cẩn thận ràng buộc khóa ngoại)
            // Do có ràng buộc khóa ngoại với orders, order_logs... nên ta chỉ nên Xóa nếu user chưa có dữ liệu,
            // hoặc chuyển sang trạng thái 'deleted' (soft delete). Ở đây ta dùng Lock thay cho Delete an toàn.
            // Code dưới đây chỉ xóa nếu không có ràng buộc, nếu có sẽ báo lỗi DB.
            $del = $conn->query("DELETE FROM users WHERE id = $uid");
            if ($del)
                $msg = "Đã xóa tài khoản ID $uid.";
            else
                $msg = "Không thể xóa (User này đã có dữ liệu đơn hàng). Hãy dùng chức năng Khóa.";
        }
    }
}

// Bộ lọc & Phân trang
$search = trim($_GET['search'] ?? '');
$role = $_GET['role'] ?? '';
$approval_status = $_GET['approval_status'] ?? '';
$page = isset($_GET['page']) ? (int) $_GET['page'] : 1;
$limit = 10;
$offset = ($page - 1) * $limit;
if ($page < 1)
    $page = 1;

$where = "WHERE 1=1";
if ($search)
    $where .= " AND (username LIKE '%$search%' OR fullname LIKE '%$search%' OR email LIKE '%$search%' OR phone LIKE '%$search%')";
if ($role)
    $where .= " AND role = '$role'";
if ($approval_status === 'pending')
    $where .= " AND is_approved = 0 AND role = 'shipper'";

// Đếm tổng
$total_res = $conn->query("SELECT COUNT(*) as total FROM users $where");
$total_records = $total_res->fetch_assoc()['total'];
$total_pages = ceil($total_records / $limit);

// Lấy dữ liệu
$sql = "SELECT * FROM users $where ORDER BY id DESC LIMIT $offset, $limit";
$result = $conn->query($sql);
?>
<!DOCTYPE html>
<html lang="vi">

<head>
    <meta charset="UTF-8">
    <title>Quản lý người dùng | Admin</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="assets/css/admin.css?v=<?php echo time(); ?>">
    <link rel="stylesheet" href="assets/css/admin-pages.css?v=<?php echo time(); ?>">
</head>

<body>
    <?php include 'includes/header_admin.php'; ?>

    <main class="admin-container">
        <div class="page-header">
            <h2 class="page-title">Quản lý người dùng</h2>
            <a href="user_form.php" class="btn-primary">+ Thêm người dùng</a>
        </div>

        <?php if ($msg): ?>
        <div style="padding:10px; background:#d4edda; color:#155724; margin-bottom:15px; border-radius:4px;">
            <?php echo $msg; ?>
        </div>
        <?php endif; ?>

        <!-- Filter -->
        <form method="GET"
            style="background:#fff; padding:15px; border-radius:8px; margin-bottom:20px; display:flex; gap:10px; flex-wrap:wrap;">
            <input type="text" name="search" value="<?php echo htmlspecialchars($search); ?>"
                placeholder="Tên, Email, SĐT..."
                style="padding:8px; border:1px solid #ddd; border-radius:4px; min-width:200px;">
            <select name="role" style="padding:8px; border:1px solid #ddd; border-radius:4px;">
                <option value="">-- Tất cả vai trò --</option>
                <option value="customer" <?php if ($role == 'customer')
                    echo 'selected'; ?>>Khách hàng</option>
                <option value="shipper" <?php if ($role == 'shipper')
                    echo 'selected'; ?>>Shipper</option>
                <option value="admin" <?php if ($role == 'admin')
                    echo 'selected'; ?>>Admin</option>
            </select>
            <select name="approval_status" style="padding:8px; border:1px solid #ddd; border-radius:4px;">
                <option value="">-- Trạng thái duyệt --</option>
                <option value="pending" <?php if ($approval_status == 'pending')
                    echo 'selected'; ?>>Chờ duyệt</option>
            </select>
            <button type="submit" class="btn-primary" style="padding:8px 15px;">Lọc</button>
            <a href="users_manage.php" class="btn-secondary"
                style="padding:8px 15px; color:#333; border-color:#ccc;">Đặt lại</a>
        </form>

        <div style="overflow-x:auto;">
            <table class="user-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Tài khoản</th>
                        <th>Họ tên / Liên hệ</th>
                        <th>Vai trò</th>
                        <th>Trạng thái</th>
                        <th>Ngày tạo</th>
                        <th>Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    <?php if ($result->num_rows > 0): ?>
                    <?php while ($row = $result->fetch_assoc()): ?>
                    <tr>
                        <td><?php echo $row['id']; ?></td>
                        <td>
                            <strong><?php echo htmlspecialchars($row['username']); ?></strong>
                        </td>
                        <td>
                            <?php echo htmlspecialchars($row['fullname']); ?><br>
                            <small style="color:#666"><?php echo $row['email']; ?> -
                                <?php echo $row['phone']; ?></small>
                        </td>
                        <td><span
                                class="role-badge role-<?php echo $row['role']; ?>"><?php echo ucfirst($row['role']); ?></span>
                        </td>
                        <td>
                            <?php if ($row['role'] === 'shipper' && !$row['is_approved']): ?>
                            <span class="status-pending-approval">Chờ duyệt</span>
                            <?php elseif ($row['is_locked']): ?>
                            <span class="status-locked">Đã khóa</span>
                            <?php else: ?>
                            <span class="status-active">Hoạt động</span>
                            <?php endif; ?>
                        </td>
                        <td><?php echo date('d/m/Y', strtotime($row['created_at'])); ?></td>
                        <td>
                            <a href="user_history.php?id=<?php echo $row['id']; ?>" class="btn-sm btn-history"
                                title="Lịch sử hoạt động">🕒</a>
                            <a href="user_form.php?id=<?php echo $row['id']; ?>" class="btn-sm btn-edit"
                                title="Sửa">✏️</a>
                            <?php if ($row['role'] === 'shipper'): ?>
                            <a href="admin_shipper_detail.php?id=<?php echo $row['id']; ?>" class="btn-sm"
                                style="background:#6610f2; color:#fff;" title="Hồ sơ hiệu suất">📊</a>
                            <?php endif; ?>
                            <?php if ($row['role'] === 'shipper' && !$row['is_approved']): ?>
                            <a href="?action=approve&id=<?php echo $row['id']; ?>" class="btn-sm btn-approve"
                                onclick="return confirm('Duyệt tài khoản shipper này?')" title="Duyệt">✔️</a>
                            <?php endif; ?>
                            <?php if ($row['id'] != $_SESSION['user_id']): ?>
                            <?php if ($row['is_locked']): ?>
                            <a href="?action=unlock&id=<?php echo $row['id']; ?>" class="btn-sm btn-unlock"
                                onclick="return confirm('Mở khóa tài khoản này?')" title="Mở khóa">🔓</a>
                            <?php else: ?>
                            <a href="#" class="btn-sm btn-lock"
                                onclick="lockUser(<?php echo $row['id']; ?>); return false;" title="Khóa">🔒</a>
                            <?php endif; ?>
                            <a href="?action=delete&id=<?php echo $row['id']; ?>" class="btn-sm"
                                style="background:#333; color:#fff;"
                                onclick="return confirm('Xóa tài khoản này? Hành động không thể hoàn tác!')"
                                title="Xóa">🗑️</a>
                            <?php endif; ?>
                        </td>
                    </tr>
                    <?php endwhile; ?>
                    <?php else: ?>
                    <tr>
                        <td colspan="7" style="text-align:center; padding:20px;">Không tìm thấy người dùng nào.</td>
                    </tr>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>

        <!-- Pagination -->
        <?php if ($total_pages > 1): ?>
        <div style="margin-top:20px; text-align:center;">
            <?php for ($i = 1; $i <= $total_pages; $i++):
                    $page_query = http_build_query(array_merge($_GET, ['page' => $i])); ?>
            <a href="?<?php echo $page_query; ?>" class="btn-sm"
                style="padding:8px 12px; font-size:14px; <?php echo ($i == $page) ? 'background:#0a2a66; color:#fff;' : 'background:#eee; color:#333;'; ?>">
                <?php echo $i; ?>
            </a>
            <?php endfor; ?>
        </div>
        <?php endif; ?>
    </main>

    <?php include 'includes/footer.php'; ?>
    <script>
    function lockUser(id) {
        let reason = prompt("Nhập lý do khóa tài khoản này:", "Vi phạm quy định");
        if (reason !== null) {
            window.location.href = "?action=lock&id=" + id + "&reason=" + encodeURIComponent(reason);
        }
    }
    </script>
</body>

</html>
