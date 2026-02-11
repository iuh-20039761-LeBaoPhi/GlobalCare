<?php
session_start();
require_once 'config/db.php';

$error_msg = "";

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $username = trim($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';

    if (empty($username) || empty($password)) {
        $error_msg = "Vui lòng nhập tên đăng nhập và mật khẩu.";
    } else {
        $stmt = $conn->prepare("SELECT id, username, password, role, is_locked, lock_reason, is_approved FROM users WHERE username = ?");
        $stmt->bind_param("s", $username);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows === 1) {
            $user = $result->fetch_assoc();
            if ($user['is_locked'] == 1) {
                $reason = $user['lock_reason'] ? $user['lock_reason'] : "Vi phạm chính sách";
                $error_msg = "Tài khoản bị khóa. Lý do: " . htmlspecialchars($reason);
            } elseif ($user['role'] === 'shipper' && $user['is_approved'] == 0) {
                $error_msg = "Tài khoản shipper của bạn đang chờ quản trị viên duyệt.";
            } elseif (password_verify($password, $user['password'])) {
                // Đăng nhập thành công
                $_SESSION['user_id'] = $user['id'];
                $_SESSION['username'] = $user['username'];
                $_SESSION['role'] = $user['role'];

                // Phân quyền chuyển hướng
                if ($user['role'] === 'admin') {
                    header("Location: admin_stats.php");
                } elseif ($user['role'] === 'shipper') {
                    header("Location: shipper_dashboard.php");
                } else {
                    header("Location: dashboard.php");
                }
                exit;
            } else {
                $error_msg = "Mật khẩu không chính xác.";
            }
        } else {
            $error_msg = "Tên đăng nhập không tồn tại.";
        }
        $stmt->close();
    }
}
$conn->close();
?>
<!DOCTYPE html>
<html lang="vi">

<head>
    <meta charset="UTF-8">
    <title>Đăng nhập | FastGo</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="assets/css/styles.css?v=<?php echo time(); ?>">
</head>

<body class="auth-page-body">
    <div class="auth-card">
        <h2 class="auth-title">Đăng Nhập FastGo</h2>
        <?php if (!empty($error_msg)): ?>
            <div class="error-box">
                <?php echo $error_msg; ?>
            </div>
        <?php endif; ?>

        <form method="POST" action="">
            <div class="form-group">
                <label>Tên đăng nhập</label>
                <input type="text" name="username" required
                    value="<?php echo htmlspecialchars($_POST['username'] ?? ''); ?>">
            </div>
            <div class="form-group">
                <label>Mật khẩu</label>
                <input type="password" name="password" required>
            </div>
            <button type="submit" class="btn-primary" style="width: 100%;">Đăng Nhập</button>
        </form>
        <div class="auth-link">Chưa có tài khoản? <a href="register.php">Đăng ký ngay</a></div>
    </div>
</body>

</html>