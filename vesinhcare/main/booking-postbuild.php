<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>Đặt tổng vệ sinh sau xây dựng | Vệ sinh Care</title>
      <link rel="stylesheet" href="../css/style.css">
    <link rel="stylesheet" href="../css/header.css">
    <!-- Style riêng cho trang dịch vụ -->
    <style>
        .service-options {
            display: none;
        }

        .service-banner {
            background: url("images/postbuild-bg.jpg") center/cover no-repeat;
            padding: 80px 20px;
            color: white;
            text-align: center;
            position: relative;
        }

        .service-banner::before {
            content: "";
            position: absolute;
            inset: 0;
            background: rgba(0,0,0,0.6);
        }

        .service-banner .content {
            position: relative;
            max-width: 850px;
            margin: auto;
        }
    </style>
</head>
<body>

<!-- ===== HEADER ===== -->
<?php require_once "header.php"; ?>

<!-- ===== BANNER ===== -->
<section class="service-banner">
    <div class="content">
        <h2>Tổng vệ sinh sau xây dựng</h2>
        <p>
            Làm sạch toàn diện bụi bẩn, xi măng, sơn thừa<br>
            Bàn giao không gian sạch – sẵn sàng sử dụng
        </p>
    </div>
</section>

<!-- ===== FORM BOOKING ===== -->
<section class="container">
    <form id="bookingForm" class="booking-form"
      action="booking_process.php" method="POST">

    <h3 class="form-title">Thông tin khách hàng</h3>

    <input type="text" id="name" name="customer_name"
           placeholder="Họ và tên" required>

    <input type="text" id="phone" name="phone"
           placeholder="Số điện thoại" required>

    <h3 class="form-title">Địa chỉ công trình</h3>

    <input type="text" id="address" name="address"
           placeholder="Tên công trình / Số nhà, tên đường">

    <div class="address-row">
        <input type="text" id="district" name="district"
               placeholder="Quận / Huyện">

        <input type="text" id="city" name="city"
               placeholder="Tỉnh / Thành phố">
    </div>

    <h3 class="form-title">Dịch vụ đã chọn</h3>

    <div class="service-card active" data-value="Tổng vệ sinh sau xây dựng">
        🧹
        <h4>Tổng vệ sinh sau xây dựng</h4>
        <p>Vệ sinh sàn, kính, trần, bụi sơn, xi măng sau thi công</p>
    </div>

    <!-- service cố định -->
    <input type="hidden" id="service" name="service_type"
           value="Tổng vệ sinh sau xây dựng">

    <h3 class="form-title">Thời gian & ghi chú</h3>

    <input type="date" id="date" name="booking_date" required>

    <textarea id="note" name="note"
        placeholder="Ghi chú thêm (diện tích, số tầng, tình trạng công trình...)"></textarea>

    <button type="submit" class="submit-btn">Gửi yêu cầu</button>
</form>

</section>

<!-- ===== MODAL SUCCESS ===== -->
<div id="successModal" class="modal">
    <div class="modal-content">
        <span class="close-btn">&times;</span>
        <h2>🎉 Gửi yêu cầu thành công!</h2>
        <p>
            Chúng tôi đã nhận được yêu cầu tổng vệ sinh sau xây dựng.<br>
            Nhân viên sẽ liên hệ xác nhận trong thời gian sớm nhất.
        </p>
        <button id="closeModalBtn">Đóng</button>
    </div>
</div>

<!-- ===== FOOTER ===== -->
<footer class="footer">
    <div class="container footer-content">

        <div class="footer-col">
            <h3>VỆ SINH CARE</h3>
            <p>
                Dịch vụ vệ sinh chuyên nghiệp cho nhà ở, văn phòng
                và công trình sau xây dựng.
            </p>
        </div>

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
