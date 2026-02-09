<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>Đặt lịch | Vệ sinh Care</title>
      <link rel="stylesheet" href="../css/style.css">
    <link rel="stylesheet" href="../css/header.css">
</head>
<body>

<!-- ===== HEADER ===== -->
<?php require_once "header.php"; ?>

<!-- ===== TITLE ===== -->
<section class="container page-title">
    <h2>Đặt lịch dịch vụ</h2>
    <p>Vui lòng chọn dịch vụ và điền thông tin bên dưới</p>
</section>

<!-- ===== FORM ===== -->
<section class="booking-bg">
    <div class="container">
        <form id="bookingForm" class="booking-form"
      action="booking_process.php" method="POST">

    <!-- THÔNG TIN KHÁCH -->
    <h3 class="form-title">Thông tin khách hàng</h3>

    <input type="text" id="name" name="customer_name"
           placeholder="Họ và tên" required>

    <input type="text" id="phone" name="phone"
           placeholder="Số điện thoại" required>

    <!-- ĐỊA CHỈ -->
    <h3 class="form-title">Địa chỉ thực hiện</h3>

    <input type="text" id="address" name="address"
           placeholder="Số nhà, tên đường">

    <div class="address-row">
        <input type="text" id="district" name="district"
               placeholder="Quận / Huyện">
        <input type="text" id="city" name="city"
               placeholder="Tỉnh / Thành phố">
    </div>

    <!-- CHỌN DỊCH VỤ -->
    <section class="service-bg">
        <h3 class="form-title">Chọn dịch vụ</h3>

        <div class="service-options">
            <div class="service-card" data-value="Vệ sinh nhà ở">
                🏠
                <h4>Vệ sinh nhà ở</h4>
                <p>Lau dọn theo yêu cầu</p>
            </div>

            <div class="service-card" data-value="Vệ sinh văn phòng">
                🏢
                <h4>Vệ sinh văn phòng</h4>
                <p>Sạch sẽ – gọn gàng</p>
            </div>

            <div class="service-card" data-value="Tổng vệ sinh sau xây dựng">
                🧹
                <h4>Tổng vệ sinh</h4>
                <p>Sau xây dựng</p>
            </div>
        </div>

        <!-- hidden bắt buộc -->
        <input type="hidden" id="service"
               name="service_type">
    </section>

    <!-- THỜI GIAN -->
    <h3 class="form-title">Thời gian & ghi chú</h3>

    <input type="date" id="date"
           name="booking_date" required>

    <textarea id="note" name="note"
        placeholder="Ghi chú thêm (nếu có)"></textarea>

    <button type="submit" class="submit-btn">
        Gửi yêu cầu
    </button>
</form>

</section>

<!-- ===== MODAL SUCCESS ===== -->
<div id="successModal" class="modal">
    <div class="modal-content">
        <span class="close-btn">&times;</span>
        <h2>🎉 Gửi yêu cầu thành công!</h2>
        <p>
            Chúng tôi đã nhận được thông tin.<br>
            Nhân viên sẽ liên hệ xác nhận trong thời gian sớm nhất.
        </p>
        <button id="closeModalBtn">Đóng</button>
    </div>
</div>

<!-- ===== FOOTER ===== -->
<footer class="footer">
    <div class="container footer-content">

        <!-- CỘT 1 -->
        <div class="footer-col">
            <h3>VỆ SINH CARE</h3>
            <p>
                Dịch vụ vệ sinh chuyên nghiệp cho nhà ở, văn phòng
                và công trình sau xây dựng.
            </p>
        </div>

        <!-- CỘT 2 -->
        <div class="footer-col">
            <h4>Liên kết nhanh</h4>
            <ul>
                <li><a href="index.php">Trang chủ</a></li>
                <li><a href="about.php">Giới thiệu</a></li>
                <li><a href="services.php">Dịch vụ</a></li>
                <li><a href="booking.php">Đặt lịch</a></li>
                <li><a href="contact.php">Liên hệ</a></li>
            </ul>
        </div>

        <!-- CỘT 3 -->
        <div class="footer-col">
            <h4>Thông tin liên hệ</h4>
            <p>📍 273 Trần Thủ Độ, Tân Phú, TP.HCM</p>
            <p>📞 <a href="tel:0966223312">0966 223 312</a></p>
            <p>✉ <a href="mailto:info@vesinhcare.com">info@vesinhcare.com</a></p>
        </div>

    </div>

    <div class="footer-bottom">
        <p>© 2026 Vệ sinh Care. All rights reserved.</p>
    </div>
</footer>


<script src="../js/main.js"></script>
</body>
</html>
