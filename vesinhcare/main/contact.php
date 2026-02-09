<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>Liên hệ | Vệ sinh Care</title>
     <link rel="stylesheet" href="../css/style.css">
    <link rel="stylesheet" href="../css/header.css">
</head>
<body>

<!-- ===== HEADER ===== -->
<?php require_once "header.php"; ?>

<!-- ===== TITLE ===== -->
<section class="container page-title">
    <h2>Liên hệ với chúng tôi</h2>
    <p>Chúng tôi luôn sẵn sàng hỗ trợ bạn</p>
</section>

<!-- ===== CONTACT CONTENT ===== -->
<section class="container contact-wrapper">

    <!-- THÔNG TIN -->
    <div class="contact-box">
        <h3>Thông tin liên hệ</h3>

        <p>📍 <strong>Địa chỉ:</strong><br>
            273 Trần Thủ Độ, Tân Phú, TP. Hồ Chí Minh
        </p>

        <p>📞 <strong>Hotline:</strong><br>
            <a href="tel:0966223312">0966 223 312</a>
        </p>

        <p>✉ <strong>Email:</strong><br>
            <a href="mailto:info@vesinhcare.com">info@vesinhcare.com</a>
        </p>

        <p>⏰ <strong>Thời gian làm việc:</strong><br>
            Thứ 2 – Chủ nhật: 7:00 – 20:00
        </p>
    </div>

    <!-- FORM -->
    <div class="contact-box">
        <h3>Gửi tin nhắn cho chúng tôi</h3>

        <form id="contactForm" class="contact-form">
    <input type="text" id="contactName" placeholder="Họ và tên">
    <input type="text" id="contactPhone" placeholder="Số điện thoại">
    <input type="email" id="contactEmail" placeholder="Email">
    <textarea id="contactMessage" placeholder="Nội dung liên hệ"></textarea>
    <button type="submit" class="btn">Gửi liên hệ</button>
</form>

    </div>

</section>

<!-- ===== MAP (OPTIONAL) ===== -->
<section class="container map-section">
    <iframe
        src="https://www.google.com/maps?q=273%20Tr%E1%BA%A7n%20Th%E1%BB%A7%20%C4%90%E1%BB%99%20T%C3%A2n%20Ph%C3%BA&output=embed"
        loading="lazy">
    </iframe>
</section>

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
<script src="../js/contact.js"></script>

</body>
</html>
