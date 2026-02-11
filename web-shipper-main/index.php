<?php
require_once 'config/db.php';
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// --- LẤY DANH SÁCH DỊCH VỤ TỪ DB ---
$services_list = [];
$svc_res = $conn->query("SELECT * FROM services ORDER BY base_price ASC");
if ($svc_res) {
    while ($r = $svc_res->fetch_assoc())
        $services_list[] = $r;
}

// Cấu hình phí cứng (vì đã bỏ DB settings)
$pricing_config = ['weight_free' => 2, 'weight_price' => 5000, 'cod_min' => 5000];

// --- LẤY ĐÁNH GIÁ KHÁCH HÀNG TỪ DB ---
$testimonials = [];
$test_res = $conn->query("SELECT * FROM testimonials WHERE is_visible = 1 ORDER BY created_at DESC LIMIT 3");
if ($test_res) {
    while ($row = $test_res->fetch_assoc())
        $testimonials[] = $row;
}

// --- LẤY FAQ TỪ DB (MỚI) ---
$faqs = [];
$faq_res = $conn->query("SELECT * FROM faqs ORDER BY display_order ASC");
if ($faq_res) {
    while ($row = $faq_res->fetch_assoc())
        $faqs[] = $row;
}

// --- LOGIC CHO LINK "ĐẶT HÀNG" ---
// Mục tiêu: Bỏ qua bước trung gian, điều hướng thẳng tới trang phù hợp
$order_now_link = "login.php?redirect=" . urlencode('create_order.php'); // Mặc định cho khách
if (isset($_SESSION['user_id'])) {
    if ($_SESSION['role'] === 'customer') {
        $order_now_link = 'create_order.php'; // Khách hàng vào thẳng form tạo đơn
    } else {
        // Admin hoặc Shipper thì vào dashboard tương ứng của họ
        $order_now_link = 'dashboard.php';
    }
}
?>
<!doctype html>
<html lang="vi">

<head>
    <meta charset="UTF-8" />
    <title>Dịch vụ Shipper | FastGo</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="stylesheet" href="assets/css/styles.css?v=<?php echo time(); ?>" />
    <!-- Thêm SwiperJS CSS -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css" />

    <style>
        /* --- TRACKING STYLES (MỚI) --- */
        .tracking-card {
            background: #fff;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
            padding: 30px;
            margin-top: 30px;
            text-align: left;
            border: 1px solid #eee;
            animation: slideUp 0.4s ease;
        }

        .t-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-bottom: 15px;
            border-bottom: 1px dashed #eee;
            margin-bottom: 20px;
            flex-wrap: wrap;
            gap: 10px;
        }

        .t-code {
            font-size: 18px;
            font-weight: 700;
            color: #0a2a66;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .t-status {
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: 600;
        }

        .t-status.completed {
            background: #d4edda;
            color: #155724;
        }

        .t-status.shipping {
            background: #cce5ff;
            color: #004085;
        }

        .t-status.pending {
            background: #fff3cd;
            color: #856404;
        }

        .t-status.cancelled {
            background: #f8d7da;
            color: #721c24;
        }

        .t-route {
            display: flex;
            gap: 20px;
            margin-bottom: 30px;
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            position: relative;
        }

        .t-route-item {
            flex: 1;
            position: relative;
            z-index: 1;
        }

        .t-label {
            font-size: 11px;
            text-transform: uppercase;
            color: #888;
            letter-spacing: 0.5px;
            margin-bottom: 5px;
            display: block;
        }

        .t-addr {
            font-size: 15px;
            font-weight: 600;
            color: #333;
            line-height: 1.4;
        }

        .t-icon {
            font-size: 20px;
            margin-bottom: 5px;
            display: block;
        }

        /* Timeline Dọc */
        .timeline {
            position: relative;
            padding-left: 30px;
        }

        .timeline::before {
            content: '';
            position: absolute;
            left: 9px;
            top: 5px;
            bottom: 0;
            width: 2px;
            background: #e9ecef;
        }

        .tl-item {
            position: relative;
            padding-bottom: 25px;
        }

        .tl-item:last-child {
            padding-bottom: 0;
        }

        .tl-dot {
            position: absolute;
            left: -26px;
            top: 4px;
            width: 12px;
            height: 12px;
            background: #fff;
            border: 2px solid #ccc;
            border-radius: 50%;
            z-index: 1;
        }

        .tl-item.active .tl-dot {
            border-color: #28a745;
            background: #28a745;
            box-shadow: 0 0 0 3px rgba(40, 167, 69, 0.2);
        }

        .tl-time {
            font-size: 12px;
            color: #999;
            margin-bottom: 2px;
        }

        .tl-content {
            font-size: 15px;
            font-weight: 500;
            color: #555;
        }

        .tl-item.active .tl-content {
            color: #0a2a66;
            font-weight: 700;
        }

        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }

            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    </style>
</head>

<body>
    <!-- HEADER -->
    <?php include 'includes/header.php'; ?>

    <!-- HERO SECTION -->
    <section id="hero" class="hero-section">
        <div class="container hero-container">
            <div class="hero-content">
                <h1 class="animate-top">Giao hàng nhanh– An toàn – Đúng giờ</h1>
                <p class="animate-bottom">
                    Dịch vụ giao hàng nội thành & liên tỉnh, hỗ trợ 24/7. Nhận hàng ngay sau 15 phút!
                </p>
                <div class="hero-btns animate-bottom">
                    <a href="#quick-quote" class="btn-primary">Tính giá ngay</a>
                    <a href="<?php echo $order_now_link; ?>" class="btn-secondary">Đặt hàng ngay</a>
                    <a href="huong-dan-dat-hang.html" class="btn-secondary btn-blink" target="_blank">📖 Hướng dẫn</a>
                </div>

                <!-- APP DOWNLOAD BUTTONS -->
                <div class="app-btns animate-bottom">
                    <a href="#" class="btn-store">
                        <span class="store-icon">
                            <svg viewBox="0 0 384 512">
                                <path
                                    d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 79.9c14.2 40.8 32.2 77.7 57.6 77.7 24.4 0 32.4-16.7 61.1-16.7 28.5 0 33.8 16.7 61.1 16.7 25.2 0 46.8-34.9 61.1-76.5 8.7-24.3 14.9-50.6 14.9-50.6s-35.6-11.4-35.4-55.3zM263 103.5c16.1-21.3 26.9-50.6 23.9-81.6-23.1 1.4-51.3 15.2-67.7 36.9-14.5 19-26.8 49.7-23.2 79.3 25.8 2.1 52.2-12.5 67-34.6z" />
                            </svg>
                        </span>
                        <div class="store-text">
                            <span class="store-subtitle">Download on the</span>
                            <span class="store-title">App Store</span>
                        </div>
                    </a>
                    <a href="#" class="btn-store">
                        <span class="store-icon">
                            <svg viewBox="0 0 512 512">
                                <path
                                    d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58.9-34.1-37.5 37.5 37.5 37.5 58.9-34.1c13.7-7.5 13.7-20.5 0-28zM104.6 499l220.7-221.3-58.7-58.9L47 512z" />
                            </svg>
                        </span>
                        <div class="store-text">
                            <span class="store-subtitle">GET IT ON</span>
                            <span class="store-title">Google Play</span>
                        </div>
                    </a>
                </div>
            </div>
            <div class="hero-image animate-right">
                <img src="assets/images/hero.png" alt="FastGo Shipper" />
            </div>
        </div>
    </section>

    <!-- TRACKING SECTION -->
    <section id="home-tracking">
        <div class="container">
            <h2 class="section-title">Tra cứu hành trình đơn hàng</h2>
            <p class="section-desc">Nhập mã vận đơn để theo dõi tình trạng đơn hàng của bạn (VD: FAST-XXXXXX)</p>

            <form class="tracking-form" onsubmit="trackOrder(event, 'standard')">
                <input type="text" id="standard-code" placeholder="Nhập mã đơn hàng..." required>
                <button type="submit" class="btn-primary">Tra cứu</button>
            </form>
            <div id="loading-spinner-standard" class="spinner" style="display:none;"></div>
            <div id="result-standard"></div>
        </div>
    </section>

    <!-- PROCESS -->
    <section id="process" class="process-section">
        <div class="container">
            <h2 class="section-title">Quy trình giao hàng đơn giản</h2>
            <p class="section-subtitle">Chỉ với 3 bước, hàng hóa của bạn sẽ được giao đến nơi an toàn</p>
            <div class="process-container">
                <div class="process-item animate-up">
                    <img src="assets/images/order.png" alt="Đặt đơn" class="process-img" />
                    <h3>Đặt đơn trực tuyến</h3>
                    <p>Nhập thông tin người gửi, người nhận và loại dịch vụ ngay trên website.</p>
                </div>
                <div class="process-arrow">➔</div>
                <div class="process-item animate-up" style="animation-delay: 0.2s">
                    <img src="assets/images/hero-shipper.png" alt="Lấy hàng" class="process-img" />
                    <h3>Lấy hàng trong 15p</h3>
                    <p>Shipper gần nhất sẽ đến nhận hàng chỉ sau vài phút xác nhận đơn.</p>
                </div>
                <div class="process-arrow">➔</div>
                <div class="process-item animate-up" style="animation-delay: 0.4s">
                    <img src="assets/images/package.png" alt="Giao hàng" class="process-img" />
                    <h3>Giao tận tay</h3>
                    <p>Hàng hóa được vận chuyển siêu tốc và giao tận tay người nhận an toàn.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- SERVICES -->
    <section id="services">
        <h2 class="section-title">Dịch vụ của chúng tôi</h2>
        <p class="section-desc">FastGo cung cấp đa dạng dịch vụ giao hàng, đáp ứng mọi nhu cầu của bạn.</p>
        <div class="service-list" id="services-list">
            <div class="service-card" id="standard-delivery">
                <h3>Giao nội thành</h3>
                <p>Giao hàng nhanh trong khu vực nội thành chỉ từ 30–60 phút.</p>
            </div>
            <div class="service-card" id="express-delivery">
                <h3>Giao hỏa tốc</h3>
                <p>Ưu tiên đơn gấp, giao ngay trong thời gian sớm nhất.</p>
            </div>
            <div class="service-card" id="cod-delivery">
                <h3>Giao COD</h3>
                <p>Thu hộ tiền mặt an toàn, minh bạch và nhanh chóng.</p>
            </div>
            <div class="service-card" id="bulk-delivery">
                <h3>Giao hàng số lượng lớn</h3>
                <p>Hỗ trợ doanh nghiệp và shop online giao nhiều đơn cùng lúc.</p>
            </div>
            <div class="service-card" id="corporate-delivery">
                <h3>Dịch vụ doanh nghiệp</h3>
                <p>Giải pháp giao hàng chuyên nghiệp cho doanh nghiệp.</p>
            </div>
            <div class="service-card" id="moving-service">
                <h3>Chuyển nhà / Vận chuyển lớn</h3>
                <p>Hỗ trợ vận chuyển hàng hóa lớn, chuyển nhà, văn phòng.</p>
            </div>
        </div>
    </section>

    <!-- FEATURES -->
    <section id="features">
        <h2 class="section-title">Vì sao chọn FastGo?</h2>
        <div class="feature-list">
            <div class="feature-item"><span class="feature-icon">🚀</span>
                <h3>Nhanh & đúng giờ</h3>
                <p>Thời gian giao hàng được tối ưu, đảm bảo đúng hẹn.</p>
            </div>
            <div class="feature-item"><span class="feature-icon">📦</span>
                <h3>Theo dõi đơn hàng</h3>
                <p>Khách hàng dễ dàng theo dõi trạng thái đơn hàng.</p>
            </div>
            <div class="feature-item"><span class="feature-icon">👨‍✈️</span>
                <h3>Shipper chuyên nghiệp</h3>
                <p>Đội ngũ shipper được đào tạo bài bản.</p>
            </div>
            <div class="feature-item"><span class="feature-icon">☎️</span>
                <h3>Hỗ trợ 24/7</h3>
                <p>Sẵn sàng hỗ trợ khách hàng mọi lúc, mọi nơi.</p>
            </div>
        </div>
    </section>

    <!-- PRICING -->
    <section id="pricing">
        <h2 class="section-title">Bảng giá tham khảo</h2>
        <div class="pricing-table-wrapper">
            <table class="pricing-table">
                <thead>
                    <tr>
                        <th>Dịch vụ</th>
                        <th>Phương tiện</th>
                        <th>Khu vực</th>
                        <th>Giá</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($services_list as $service): ?>
                        <tr>
                            <td><?php echo htmlspecialchars($service['name']); ?></td>
                            <td>
                                <?php
                                // Giả định phương tiện dựa trên loại dịch vụ
                                if ($service['type_key'] == 'bulk') {
                                    echo 'Ô tô';
                                } else {
                                    echo 'Xe máy';
                                }
                                ?>
                            </td>
                            <td>Nội thành</td>
                            <td>
                                <?php
                                if ($service['base_price'] > 0) {
                                    echo number_format($service['base_price']) . 'đ';
                                } else {
                                    echo 'Liên hệ'; // Hiển thị 'Liên hệ' nếu giá là 0 hoặc không xác định
                                }
                                ?>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                    <!-- Dòng phụ phí COD có thể giữ lại để cung cấp thông tin -->
                    <tr>
                        <td>Giao COD</td>
                        <td>Xe máy</td>
                        <td>Nội thành</td>
                        <td>+5.000đ</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </section>

    <!-- QUICK QUOTE -->
    <section id="quick-quote">
        <h2 class="section-title">Tính giá cước nhanh</h2>
        <form id="quick-quote-form">
            <input type="text" id="from-location" list="districts-list" placeholder="Điểm đi (Quận/Huyện)" required />
            <input type="text" id="to-location" list="districts-list" placeholder="Điểm đến (Quận/Huyện)" required />
            <select id="service-type" required>
                <option value="">-- Chọn loại dịch vụ --</option>
                <?php foreach ($services_list as $svc): ?>
                    <option value="<?php echo $svc['type_key']; ?>">
                        <?php echo $svc['name']; ?>
                        (<?php echo ($svc['base_price'] > 0) ? number_format($svc['base_price']) . 'đ' : 'Liên hệ'; ?>)
                    </option>
                <?php endforeach; ?>
            </select>
            <label class="checkbox-label"><input type="checkbox" id="is-cod" /> Có thu hộ COD (+5k)</label>
            <button type="submit" class="btn-primary">Tính giá ngay</button>
        </form>
        <datalist id="districts-list">
            <option value="Quận 1" />
            <option value="Quận 2" />
            <option value="Quận 3" />
            <option value="Quận 4" />
            <option value="Quận 5" />
            <option value="Quận 7" />
            <option value="Bình Thạnh" />
            <option value="Tân Bình" />
            <option value="Thủ Đức" />
        </datalist>
        <div id="quote-result" class="quote-result"></div>
    </section>

    <!-- CONTACT -->
    <section id="contact">
        <h2 class="section-title">Sẵn sàng vận chuyển?</h2>
        <p class="section-desc">Tạo tài khoản hoặc đăng nhập để bắt đầu gửi hàng cùng FastGo ngay hôm nay!</p>
        <div class="hero-btns centered-btns">
            <?php if (isset($_SESSION['user_id'])): ?>
                <a href="create_order.php" class="btn-primary">Tạo đơn hàng ngay</a>
                <a href="dashboard.php" class="btn-secondary">Vào trang quản lý</a>
            <?php else: ?>
                <a href="login.php" class="btn-primary">Đăng nhập & Đặt đơn</a>
                <a href="register.php" class="btn-secondary">Đăng ký tài khoản mới</a>
            <?php endif; ?>
        </div>
    </section>

    <!-- TESTIMONIALS (MỚI) -->
    <section id="testimonials">
        <h2 class="section-title">Khách hàng nói gì về FastGo?</h2>
        <p class="section-desc">Sự hài lòng của khách hàng là động lực phát triển của chúng tôi.</p>
        <!-- Cấu trúc Slider -->
        <?php if (!empty($testimonials)): ?>
            <div class="swiper testimonial-slider">
                <div class="swiper-wrapper">
                    <?php foreach ($testimonials as $t): ?>
                        <div class="swiper-slide">
                            <div class="testimonial-item">
                                <div class="stars"><?php echo str_repeat('⭐', intval($t['rating'])); ?></div>
                                <p class="feedback">"<?php echo htmlspecialchars($t['content']); ?>"</p>
                                <div class="customer-info">
                                    <strong><?php echo htmlspecialchars($t['customer_name']); ?></strong>
                                    <span>- <?php echo htmlspecialchars($t['customer_role']); ?></span>
                                </div>
                            </div>
                        </div>
                    <?php endforeach; ?>
                </div>
                <!-- Nút điều hướng & Phân trang -->
                <div class="swiper-pagination"></div>
            </div>
        <?php else: ?>
            <p class="no-content-msg">Chưa có đánh giá nào.</p>
        <?php endif; ?>
    </section>

    <!-- FAQ -->
    <section id="faq">
        <h2 class="section-title">FAQs / Hỗ trợ</h2>
        <div class="faq-list">
            <?php if (!empty($faqs)): ?>
                <?php foreach ($faqs as $faq): ?>
                    <div class="faq-item">
                        <h3 class="faq-question"><?php echo htmlspecialchars($faq['question']); ?></h3>
                        <p class="faq-answer"><?php echo nl2br(htmlspecialchars($faq['answer'])); ?></p>
                    </div>
                <?php endforeach; ?>
            <?php else: ?>
                <p>Chưa có câu hỏi thường gặp nào.</p>
            <?php endif; ?>
        </div>
    </section>

    <!-- INQUIRY FORM (MỚI) -->
    <section id="inquiry">
        <div class="container inquiry-container">
            <h2 class="section-title">Gửi thắc mắc cho chúng tôi</h2>
            <p class="section-desc">Bạn cần hỗ trợ thêm? Hãy để lại lời nhắn.</p>

            <form id="inquiry-form">
                <div class="form-group">
                    <input type="text" name="name" placeholder="Họ và tên của bạn" required>
                </div>
                <div class="form-group">
                    <input type="email" name="email" placeholder="Email liên hệ" required>
                </div>
                <div class="form-group">
                    <input type="tel" name="phone" placeholder="Số điện thoại" required>
                </div>
                <div class="form-group">
                    <select name="subject">
                        <option value="Tuvan">Tư vấn dịch vụ</option>
                        <option value="KhieuNai">Khiếu nại đơn hàng</option>
                        <option value="HopTac">Liên hệ hợp tác</option>
                        <option value="Khac">Khác</option>
                    </select>
                </div>
                <textarea name="message" placeholder="Nội dung thắc mắc..." required></textarea>
                <button type="submit" class="btn-primary">Gửi tin nhắn</button>
                <div id="inquiry-message"></div>
            </form>
        </div>
    </section>

    <!-- FOOTER -->
    <?php include 'includes/footer.php'; ?>

    <!-- AUTH MODAL (Popup Đăng nhập) -->
    <div id="auth-modal" class="modal">
        <div class="modal-content">
            <span class="close-modal">&times;</span>

            <!-- VIEW 1: ĐĂNG NHẬP -->
            <div id="login-view">
                <h2 style="text-align:center; color:#0a2a66; margin-bottom:20px;">Bạn cần đăng nhập</h2>
                <p style="text-align:center; margin-bottom:20px; color:#666;">Vui lòng đăng nhập để hoàn tất đơn hàng.
                </p>

                <form id="ajax-login-form">
                    <div class="form-group">
                        <input type="text" name="username" placeholder="Tên đăng nhập" required
                            style="width:100%; padding:12px; margin-bottom:10px; border:1px solid #ccc; border-radius:6px;">
                    </div>
                    <div class="form-group">
                        <input type="password" name="password" placeholder="Mật khẩu" required
                            style="width:100%; padding:12px; margin-bottom:10px; border:1px solid #ccc; border-radius:6px;">
                    </div>
                    <div style="text-align:right; margin-bottom:15px;">
                        <a href="#" id="show-forgot-btn" style="color:#666; font-size:13px; text-decoration:none;">Quên
                            mật khẩu?</a>
                    </div>
                    <div id="login-error" style="color:red; text-align:center; margin-bottom:10px; display:none;"></div>
                    <button type="submit" class="btn-primary" style="width:100%;">Đăng Nhập & Gửi Đơn</button>
                </form>

                <div style="text-align:center; margin-top:15px; font-size:14px;">
                    Chưa có tài khoản? <a href="#" id="show-register-btn" style="color:#ff7a00; font-weight:bold;">Đăng
                        ký ngay</a>
                </div>
            </div>

            <!-- VIEW 2: ĐĂNG KÝ (Mặc định ẩn) -->
            <div id="register-view" style="display:none;">
                <h2 style="text-align:center; color:#0a2a66; margin-bottom:20px;">Đăng Ký Nhanh</h2>

                <form id="ajax-register-form">
                    <div class="form-group"><input type="text" name="username" placeholder="Tên đăng nhập" required
                            style="width:100%; padding:10px; margin-bottom:8px; border:1px solid #ccc; border-radius:6px;">
                    </div>
                    <div class="form-group"><input type="text" name="fullname" placeholder="Họ và tên" required
                            style="width:100%; padding:10px; margin-bottom:8px; border:1px solid #ccc; border-radius:6px;">
                    </div>
                    <div class="form-group"><input type="email" name="email" placeholder="Email" required
                            style="width:100%; padding:10px; margin-bottom:8px; border:1px solid #ccc; border-radius:6px;">
                    </div>
                    <div class="form-group"><input type="tel" name="phone" placeholder="Số điện thoại" required
                            style="width:100%; padding:10px; margin-bottom:8px; border:1px solid #ccc; border-radius:6px;">
                    </div>
                    <div class="form-group" style="display:flex; gap:10px;">
                        <input type="password" name="password" placeholder="Mật khẩu" required
                            style="width:100%; padding:10px; margin-bottom:8px; border:1px solid #ccc; border-radius:6px;">
                        <input type="password" name="confirm_password" placeholder="Nhập lại MK" required
                            style="width:100%; padding:10px; margin-bottom:8px; border:1px solid #ccc; border-radius:6px;">
                    </div>

                    <div id="register-error" style="color:red; text-align:center; margin-bottom:10px; display:none;">
                    </div>
                    <button type="submit" class="btn-primary" style="width:100%;">Đăng Ký & Gửi Đơn</button>
                </form>

                <div style="text-align:center; margin-top:15px; font-size:14px;">
                    Đã có tài khoản? <a href="#" id="show-login-btn" style="color:#ff7a00; font-weight:bold;">Đăng
                        nhập</a>
                </div>
            </div>

            <!-- VIEW 3: QUÊN MẬT KHẨU (Mặc định ẩn) -->
            <div id="forgot-view" style="display:none;">
                <h2 style="text-align:center; color:#0a2a66; margin-bottom:20px;">Khôi phục mật khẩu</h2>
                <p style="text-align:center; margin-bottom:20px; color:#666;">Nhập email đã đăng ký để nhận hướng dẫn.
                </p>

                <form id="ajax-forgot-form">
                    <div class="form-group">
                        <input type="email" name="email" placeholder="Nhập email của bạn" required
                            style="width:100%; padding:12px; margin-bottom:10px; border:1px solid #ccc; border-radius:6px;">
                    </div>
                    <div id="forgot-message" style="text-align:center; margin-bottom:10px; display:none;"></div>
                    <button type="submit" class="btn-primary" style="width:100%;">Gửi yêu cầu</button>
                </form>

                <div style="text-align:center; margin-top:15px; font-size:14px;">
                    <a href="#" id="back-to-login-btn" style="color:#0a2a66; font-weight:bold;">← Quay lại đăng nhập</a>
                </div>
            </div>

        </div>
    </div>

    <!-- Biến JS để kiểm tra trạng thái login -->
    <script>
        window.isLoggedIn = <?php echo isset($_SESSION['user_id']) ? 'true' : 'false'; ?>;
        window.servicesData =
            <?php echo json_encode($services_list, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_AMP); ?>;
        window.pricingConfig =
            <?php echo json_encode($pricing_config, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_AMP); ?>;
    </script>
    <!-- Thêm SwiperJS JS -->
    <script src="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js"></script>


    <script>
        // Bổ sung hàm trackOrder để xử lý tra cứu đơn hàng
        async function trackOrder(event, type) {
            event.preventDefault();

            const codeInput = document.getElementById(type + '-code');
            const resultDiv = document.getElementById('result-' + type);
            const spinner = document.getElementById('loading-spinner-' + type);

            if (!codeInput || !resultDiv) return;

            const code = codeInput.value.trim();
            if (!code) {
                alert('Vui lòng nhập mã vận đơn');
                return;
            }

            // Hiển thị loading
            if (spinner) spinner.style.display = 'block';
            resultDiv.innerHTML = '';

            try {
                // Gọi API vừa tạo
                const response = await fetch('tracking_ajax.php?code=' + encodeURIComponent(code));
                const data = await response.json();

                if (spinner) spinner.style.display = 'none';

                if (data.success) {
                    const order = data.data;
                    let timelineHtml = '';

                    // Xác định class màu sắc cho trạng thái
                    let statusClass = 'pending';
                    const rawStatus = order.status_raw || order.status; // Fallback nếu thiếu status_raw
                    if (rawStatus === 'completed' || rawStatus === 'delivered') statusClass = 'completed';
                    else if (rawStatus === 'shipping' || rawStatus === 'delivering' || rawStatus === 'picked')
                        statusClass = 'shipping';
                    else if (rawStatus === 'cancelled') statusClass = 'cancelled';

                    // Xây dựng HTML cho timeline
                    if (data.timeline && data.timeline.length > 0) {
                        timelineHtml = '<div class="timeline">';
                        // Đảo ngược mảng để sự kiện mới nhất lên đầu
                        const reversedTimeline = [...data.timeline].reverse();

                        reversedTimeline.forEach((item, index) => {
                            // Map lại text hiển thị cho timeline
                            const statusMap = {
                                'created': 'Đơn hàng đã được tạo',
                                'pending': 'Đang chờ xử lý',
                                'assigned': 'Đã điều phối tài xế',
                                'picked': 'Tài xế đã lấy hàng',
                                'delivering': 'Đang trên đường giao',
                                'delivered': 'Giao hàng thành công',
                                'cancelled': 'Đơn hàng đã hủy',
                                'shipping': 'Đang trên đường giao',
                                'completed': 'Giao hàng thành công'
                            };
                            const statusText = statusMap[item.status] || item.status;
                            const isActive = index === 0 ? 'active' : ''; // Item đầu tiên (mới nhất) là active

                            timelineHtml += `
                            <div class="tl-item ${isActive}">
                                <div class="tl-dot"></div>
                                <div class="tl-time">${item.time}</div>
                                <div class="tl-content">${statusText}</div>
                            </div>
                        `;
                        });
                        timelineHtml += '</div>';
                    }

                    resultDiv.innerHTML = `
                    <div class="tracking-card">
                        <div class="t-header">
                            <div class="t-code">📦 ${order.order_code}</div>
                            <div class="t-status ${statusClass}">${order.status_text}</div>
                        </div>
                        <div class="t-route">
                            <div class="t-route-item">
                                <span class="t-icon">🚩</span>
                                <span class="t-label">Điểm lấy hàng</span>
                                <div class="t-addr">${order.pickup_address}</div>
                            </div>
                            <div class="t-route-item">
                                <span class="t-icon">🏁</span>
                                <span class="t-label">Điểm giao hàng</span>
                                <div class="t-addr">${order.delivery_address}</div>
                            </div>
                        </div>
                        <h4 style="font-size:16px; color:#0a2a66; margin-bottom:15px;">Hành trình chi tiết</h4>
                        ${timelineHtml}
                    </div>
                `;
                } else {
                    resultDiv.innerHTML =
                        `<div class="error-box" style="color:red; margin-top:10px; text-align:center;">${data.message}</div>`;
                }
            } catch (error) {
                console.error(error);
                if (spinner) spinner.style.display = 'none';
                resultDiv.innerHTML =
                    `<div class="error-box" style="color:red; margin-top:10px; text-align:center;">Lỗi kết nối hệ thống.</div>`;
            }
        }
    </script>
</body>

</html>