<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
$customer = $_SESSION['customer'] ?? null;
?>
<header class="site-header">
  <div class="container site-header-content">

    <h1 class="site-logo">VỆ SINH CARE</h1>

    <nav class="site-nav">
      <a href="index.php">Trang chủ</a>
      <a href="about.php">Giới thiệu</a>
      <a href="services.php">Dịch vụ</a>
      <a href="booking.php">Đặt lịch</a>
      <a href="pricing.php">Bảng giá</a>
      <a href="faq.php">FAQ</a>
      <a href="contact.php">Liên hệ</a>
    </nav>

    <!-- USER AREA -->
    <div class="site-user-area">

      <?php if ($customer): ?>

        <span class="site-user">
          xin chào👋 <?= htmlspecialchars($customer['phone']) ?>
        </span>

        <a href="customer_dashboard.php">Đơn hàng</a>
        <a href="logout.php" class="site-btn">Đăng xuất</a>

      <?php else: ?>

        <a href="login_customer.php" class="site-btn">Đăng nhập</a>

      <?php endif; ?>

    </div>

  </div>
</header>


