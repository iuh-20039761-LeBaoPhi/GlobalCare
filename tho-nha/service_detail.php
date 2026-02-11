<?php
require_once 'api/db.php';

// Lấy category_id từ URL
$category_id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

// Lấy thông tin category
$category_query = "SELECT * FROM service_categories WHERE id = ? AND is_active = 1";
$stmt = $conn->prepare($category_query);
$stmt->bind_param("i", $category_id);
$stmt->execute();
$category_result = $stmt->get_result();
$category = $category_result->fetch_assoc();

// Nếu không tìm thấy category, chuyển về trang chủ
if (!$category) {
    header('Location: index.php');
    exit;
}

// Lấy danh sách dịch vụ trong category
$services_query = "SELECT * FROM services WHERE category_id = ? AND is_active = 1 ORDER BY id ASC";
$stmt = $conn->prepare($services_query);
$stmt->bind_param("i", $category_id);
$stmt->execute();
$services_result = $stmt->get_result();
$services = $services_result->fetch_all(MYSQLI_ASSOC);

// Lấy các category khác để hiển thị "Dịch vụ liên quan"
$related_query = "SELECT * FROM service_categories WHERE id != ? AND is_active = 1 LIMIT 3";
$stmt = $conn->prepare($related_query);
$stmt->bind_param("i", $category_id);
$stmt->execute();
$related_result = $stmt->get_result();
$related_categories = $related_result->fetch_all(MYSQLI_ASSOC);

// Định nghĩa icon cho từng category
$category_icons = [
    'Sửa máy lạnh' => 'fa-wind',
    'Sửa máy giặt' => 'fa-tshirt',
    'Nhà vệ sinh' => 'fa-droplet',
    'Điện nước' => 'fa-bolt',
    'Đồ gia dụng' => 'fa-home',
    'Cải tạo nhà' => 'fa-hammer'
];

// Định nghĩa hình ảnh cho từng category
$category_images = [
    'Sửa máy lạnh' => 'image/2.jpg',
    'Sửa máy giặt' => 'image/4.jpg',
    'Nhà vệ sinh' => 'image/3.jpg',
    'Điện nước' => 'image/6.jpg',
    'Đồ gia dụng' => 'image/5.jpg',
    'Cải tạo nhà' => 'image/7.jpg'
];

$icon = isset($category_icons[$category['name']]) ? $category_icons[$category['name']] : 'fa-tools';
$main_image = isset($category_images[$category['name']]) ? $category_images[$category['name']] : 'image/1.png';

// Tính giá thấp nhất và cao nhất
$prices = array_map(function($service) {
    return (int)$service['price'];
}, $services);

$min_price = !empty($prices) ? min($prices) : 0;
$max_price = !empty($prices) ? max($prices) : 0;
$price_range = number_format($min_price) . 'đ - ' . number_format($max_price) . 'đ';
?>
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="<?php echo htmlspecialchars($category['name']); ?> - Thợ Nhà">
    <title><?php echo htmlspecialchars($category['name']); ?> - Thợ Nhà</title>
    
    <!-- Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <!-- Custom CSS -->
    <link rel="stylesheet" href="css/style.css">
    
    <style>
        .breadcrumb {
            background: transparent;
            padding: 1rem 0;
        }
        
        .breadcrumb-item + .breadcrumb-item::before {
            content: "›";
        }
        
        .service-detail-hero {
            padding: 60px 0 40px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        
        .service-detail-content {
            padding: 60px 0;
        }
        
        .price-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 20px;
            padding: 30px;
            position: sticky;
            top: 100px;
        }
        
        .price-amount {
            font-size: 2rem;
            font-weight: 800;
            margin: 20px 0;
        }
        
        .service-item-card {
            padding: 25px;
            background: white;
            border-radius: 15px;
            margin-bottom: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
            transition: all 0.3s ease;
            border-left: 4px solid #667eea;
        }
        
        .service-item-card:hover {
            transform: translateX(5px);
            box-shadow: 0 5px 20px rgba(0,0,0,0.1);
        }
        
        .service-item-name {
            font-size: 1.2rem;
            font-weight: 600;
            color: #333;
            margin-bottom: 10px;
        }
        
        .service-item-price {
            font-size: 1.5rem;
            font-weight: 700;
            color: #667eea;
            margin-bottom: 10px;
        }
        
        .service-item-description {
            color: #666;
            font-size: 0.95rem;
            line-height: 1.6;
        }
        
        .feature-box {
            background: white;
            border-radius: 15px;
            padding: 25px;
            margin-bottom: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }
        
        .feature-icon-large {
            width: 70px;
            height: 70px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 15px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 2rem;
            margin-bottom: 15px;
        }
        
        .gallery-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 20px;
            margin-top: 30px;
        }
        
        .gallery-item {
            border-radius: 15px;
            overflow: hidden;
            box-shadow: 0 3px 15px rgba(0,0,0,0.1);
        }
        
        .gallery-item img {
            width: 100%;
            height: 250px;
            object-fit: cover;
            transition: transform 0.3s ease;
        }
        
        .gallery-item:hover img {
            transform: scale(1.1);
        }
        
        .related-service {
            background: white;
            border-radius: 15px;
            overflow: hidden;
            transition: all 0.3s ease;
            cursor: pointer;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }
        
        .related-service:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 30px rgba(0,0,0,0.15);
        }
        
        .related-service img {
            width: 100%;
            height: 200px;
            object-fit: cover;
        }
        
        .related-service-content {
            padding: 20px;
        }
    </style>
</head>
<body>
    <!-- Header -->
    <div id="header-container"></div>

    <!-- Breadcrumb -->
    <div class="container">
        <nav aria-label="breadcrumb">
            <ol class="breadcrumb">
                <li class="breadcrumb-item"><a href="index.php">Trang chủ</a></li>
                <li class="breadcrumb-item"><a href="index.php#services">Dịch vụ</a></li>
                <li class="breadcrumb-item active" aria-current="page"><?php echo htmlspecialchars($category['name']); ?></li>
            </ol>
        </nav>
    </div>

    <!-- Service Detail Hero -->
    <section class="service-detail-hero">
        <div class="container">
            <div class="row align-items-center">
                <div class="col-lg-8">
                    <h1 class="display-4 fw-bold mb-3"><?php echo htmlspecialchars($category['name']); ?></h1>
                    <p class="lead mb-4">
                        Dịch vụ <?php echo strtolower(htmlspecialchars($category['name'])); ?> chuyên nghiệp 
                        với đội ngũ thợ giàu kinh nghiệm, cam kết chất lượng và uy tín.
                    </p>
                    <div class="d-flex gap-3 flex-wrap">
                        <div class="d-flex align-items-center">
                            <i class="fas fa-star me-2"></i>
                            <span>4.9/5 (500+ đánh giá)</span>
                        </div>
                        <div class="d-flex align-items-center">
                            <i class="fas fa-users me-2"></i>
                            <span>1000+ khách hàng</span>
                        </div>
                        <div class="d-flex align-items-center">
                            <i class="fas fa-shield-alt me-2"></i>
                            <span>Bảo hành 6-12 tháng</span>
                        </div>
                    </div>
                </div>
                <div class="col-lg-4 text-center">
                    <div style="font-size: 120px; opacity: 0.8;">
                        <i class="fas <?php echo $icon; ?>"></i>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Service Detail Content -->
    <section class="service-detail-content">
        <div class="container">
            <div class="row g-4">
                <!-- Main Content -->
                <div class="col-lg-8">
                    <!-- Danh Sách Dịch Vụ Chi Tiết -->
                    <div class="mb-5">
                        <h2 class="mb-4">
                            <i class="fas fa-list-check text-primary me-2"></i>
                            Danh Sách Dịch Vụ
                        </h2>
                        
                        <?php if (!empty($services)): ?>
                            <?php foreach ($services as $service): ?>
                                <div class="service-item-card">
                                    <div class="row align-items-center">
                                        <div class="col-md-8">
                                            <h3 class="service-item-name">
                                                <i class="fas fa-check-circle text-success me-2"></i>
                                                <?php echo htmlspecialchars($service['name']); ?>
                                            </h3>
                                            <?php if (!empty($service['description'])): ?>
                                                <p class="service-item-description mb-0">
                                                    <?php echo htmlspecialchars($service['description']); ?>
                                                </p>
                                            <?php endif; ?>
                                        </div>
                                        <div class="col-md-4 text-end">
                                            <div class="service-item-price">
                                                <?php echo number_format($service['price']); ?>đ
                                            </div>
                                            <button class="btn btn-sm btn-gradient booking-btn" 
                                                    data-service-id="<?php echo $service['id']; ?>"
                                                    data-service-name="<?php echo htmlspecialchars($service['name']); ?>"
                                                    data-service-price="<?php echo $service['price']; ?>">
                                                <i class="fas fa-calendar-check me-1"></i>
                                                Đặt lịch
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            <?php endforeach; ?>
                        <?php else: ?>
                            <div class="alert alert-info">
                                <i class="fas fa-info-circle me-2"></i>
                                Hiện chưa có dịch vụ nào trong danh mục này.
                            </div>
                        <?php endif; ?>
                    </div>

                    <!-- Tính Năng Nổi Bật -->
                    <div class="mb-5">
                        <h2 class="mb-4">
                            <i class="fas fa-star text-warning me-2"></i>
                            Tính Năng Nổi Bật
                        </h2>
                        <div class="row g-3">
                            <div class="col-md-6">
                                <div class="feature-box">
                                    <div class="feature-icon-large">
                                        <i class="fas fa-user-tie"></i>
                                    </div>
                                    <h5 class="mb-2">Thợ Chuyên Nghiệp</h5>
                                    <p class="text-muted mb-0">Đội ngũ được đào tạo bài bản, có chứng chỉ hành nghề và nhiều năm kinh nghiệm.</p>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="feature-box">
                                    <div class="feature-icon-large">
                                        <i class="fas fa-certificate"></i>
                                    </div>
                                    <h5 class="mb-2">Linh Kiện Chính Hãng</h5>
                                    <p class="text-muted mb-0">Sử dụng 100% linh kiện, vật tư chính hãng có xuất xứ rõ ràng.</p>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="feature-box">
                                    <div class="feature-icon-large">
                                        <i class="fas fa-shield-alt"></i>
                                    </div>
                                    <h5 class="mb-2">Bảo Hành Dài Hạn</h5>
                                    <p class="text-muted mb-0">Bảo hành 6-12 tháng cho dịch vụ và linh kiện thay thế.</p>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="feature-box">
                                    <div class="feature-icon-large">
                                        <i class="fas fa-headset"></i>
                                    </div>
                                    <h5 class="mb-2">Hỗ Trợ 24/7</h5>
                                    <p class="text-muted mb-0">Luôn sẵn sàng hỗ trợ khách hàng mọi lúc, mọi nơi kể cả ngày lễ.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Hình Ảnh Thực Tế -->
                    <div class="mb-5">
                        <h2 class="mb-4">
                            <i class="fas fa-images text-info me-2"></i>
                            Hình Ảnh Thực Tế
                        </h2>
                        <div class="gallery-grid">
                            <div class="gallery-item">
                                <img src="<?php echo $main_image; ?>" alt="<?php echo htmlspecialchars($category['name']); ?>">
                            </div>
                            <div class="gallery-item">
                                <img src="image/8.png" alt="Khách hàng hài lòng">
                            </div>
                            <div class="gallery-item">
                                <img src="image/1.png" alt="Thợ chuyên nghiệp">
                            </div>
                            <div class="gallery-item">
                                <img src="<?php echo $main_image; ?>" alt="<?php echo htmlspecialchars($category['name']); ?>">
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Sidebar -->
                <div class="col-lg-4">
                    <!-- Price Card -->
                    <div class="price-card mb-4">
                        <h4 class="mb-2">Giá dịch vụ</h4>
                        <div class="price-amount"><?php echo $price_range; ?></div>
                        <p class="mb-4">
                            <small>* Giá có thể thay đổi tùy theo tình trạng thực tế</small>
                        </p>
                        <button class="btn btn-light w-100 mb-3" onclick="scrollToServices()">
                            <i class="fas fa-list me-2"></i>
                            Xem bảng giá chi tiết
                        </button>
                        <a href="tel:0123456789" class="btn btn-outline-light w-100">
                            <i class="fas fa-phone me-2"></i>
                            Gọi: 0123 456 789
                        </a>
                    </div>

                    <!-- Commitment -->
                    <div class="bg-light p-4 rounded-4 mb-4">
                        <h5 class="mb-3">Cam Kết Của Chúng Tôi</h5>
                        <div class="d-flex align-items-start mb-3">
                            <i class="fas fa-check-circle text-success me-2 mt-1"></i>
                            <span>Thợ giàu kinh nghiệm, tay nghề cao</span>
                        </div>
                        <div class="d-flex align-items-start mb-3">
                            <i class="fas fa-check-circle text-success me-2 mt-1"></i>
                            <span>Linh kiện chính hãng, có xuất xứ rõ ràng</span>
                        </div>
                        <div class="d-flex align-items-start mb-3">
                            <i class="fas fa-check-circle text-success me-2 mt-1"></i>
                            <span>Bảo hành dài hạn 6-12 tháng</span>
                        </div>
                        <div class="d-flex align-items-start mb-3">
                            <i class="fas fa-check-circle text-success me-2 mt-1"></i>
                            <span>Giá cả minh bạch, không phát sinh</span>
                        </div>
                        <div class="d-flex align-items-start">
                            <i class="fas fa-check-circle text-success me-2 mt-1"></i>
                            <span>Hỗ trợ 24/7, phản hồi nhanh chóng</span>
                        </div>
                    </div>

                    <!-- Working Hours -->
                    <div class="bg-light p-4 rounded-4">
                        <h5 class="mb-3">Giờ Làm Việc</h5>
                        <div class="d-flex justify-content-between mb-2">
                            <span class="text-muted">Thứ 2 - Thứ 6:</span>
                            <strong>7:00 - 22:00</strong>
                        </div>
                        <div class="d-flex justify-content-between mb-2">
                            <span class="text-muted">Thứ 7 - Chủ nhật:</span>
                            <strong>7:00 - 22:00</strong>
                        </div>
                        <hr>
                        <div class="alert alert-info mb-0">
                            <i class="fas fa-info-circle me-2"></i>
                            <small>Hỗ trợ khẩn cấp 24/7</small>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Related Services -->
            <?php if (!empty($related_categories)): ?>
                <div class="mt-5">
                    <h2 class="mb-4">
                        <i class="fas fa-layer-group text-primary me-2"></i>
                        Dịch Vụ Liên Quan
                    </h2>
                    <div class="row g-4">
                        <?php foreach ($related_categories as $related): ?>
                            <?php 
                                $related_icon = isset($category_icons[$related['name']]) ? $category_icons[$related['name']] : 'fa-tools';
                                $related_image = isset($category_images[$related['name']]) ? $category_images[$related['name']] : 'image/1.png';
                            ?>
                            <div class="col-md-4">
                                <div class="related-service" onclick="window.location.href='service_detail.php?id=<?php echo $related['id']; ?>'">
                                    <img src="<?php echo $related_image; ?>" alt="<?php echo htmlspecialchars($related['name']); ?>">
                                    <div class="related-service-content">
                                        <h5 class="mb-2">
                                            <i class="fas <?php echo $related_icon; ?> me-2 text-primary"></i>
                                            <?php echo htmlspecialchars($related['name']); ?>
                                        </h5>
                                        <p class="text-muted mb-3">
                                            Dịch vụ <?php echo strtolower(htmlspecialchars($related['name'])); ?> chuyên nghiệp, uy tín
                                        </p>
                                        <div class="d-flex justify-content-between align-items-center">
                                            <span class="text-primary fw-bold">Xem chi tiết</span>
                                            <i class="fas fa-arrow-right text-primary"></i>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    </div>
                </div>
            <?php endif; ?>
        </div>
    </section>

    <!-- Footer -->
    <div id="footer-container"></div>

    <!-- Modal Đặt Lịch -->
    <div class="modal fade" id="bookingModal" tabindex="-1">
        <div class="modal-dialog modal-lg modal-dialog-centered">
            <div class="modal-content" style="border-radius: 20px;">
                <div class="modal-header">
                    <h5 class="modal-title fw-bold">🛠️ Đặt Lịch Dịch Vụ</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <form id="bookingForm">
                        <div class="row g-3">
                            <div class="col-md-6">
                                <label for="name" class="form-label">Họ và tên <span class="text-danger">*</span></label>
                                <input type="text" class="form-control" id="name" required>
                            </div>
                            <div class="col-md-6">
                                <label for="phone" class="form-label">Số điện thoại <span class="text-danger">*</span></label>
                                <input type="tel" class="form-control" id="phone" required>
                            </div>
                            <div class="col-12">
                                <label for="selectedService" class="form-label">Dịch vụ đã chọn <span class="text-danger">*</span></label>
                                <input type="text" class="form-control" id="selectedService" readonly>
                                <input type="hidden" id="selectedServiceId">
                            </div>
                            <div class="col-12">
                                <label for="servicePrice" class="form-label">Giá dịch vụ</label>
                                <input type="text" class="form-control" id="servicePrice" readonly>
                            </div>
                            <div class="col-12">
                                <label for="address" class="form-label">Địa chỉ <span class="text-danger">*</span></label>
                                <textarea class="form-control" id="address" rows="2" required></textarea>
                            </div>
                            <div class="col-12">
                                <label for="note" class="form-label">Ghi chú</label>
                                <textarea class="form-control" id="note" rows="2"></textarea>
                            </div>
                        </div>
                        <div class="mt-4">
                            <button type="submit" class="btn btn-gradient w-100">
                                <i class="fas fa-check"></i> Xác nhận đặt lịch
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
    <div class="modal fade" id="viewOrderModal" tabindex="-1">
        <div class="modal-dialog modal-xl">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title fw-bold">🔍 Tra Cứu Đơn Hàng</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <form id="viewOrderForm">
                        <input
                            type="text"
                            id="orderPhone"
                            class="form-control"
                            placeholder="Nhập số điện thoại"
                            required
                        >

                        <button type="submit" class="btn btn-primary mt-2">
                            Tra cứu
                        </button>
                    </form>

                    <div id="orderResult" class="mt-3"></div>
                </div>
            </div>
        </div>
    </div>

    <!-- Bootstrap JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
    
    <!-- Load Header & Footer -->
    <script>
        // Load header
        fetch('header.html')
        .then(res => res.text())
        .then(html => {
            document.getElementById('header-container').innerHTML = html;

            document.querySelectorAll('#header-container a[href^="#"]').forEach(link => {
                link.addEventListener('click', function (e) {
                    const hash = this.getAttribute('href');
                    const target = document.querySelector(hash);

                    if (target) {
                        // đang ở index
                        e.preventDefault();
                        target.scrollIntoView({ behavior: 'smooth' });
                    } else {
                        // đang ở trang khác → quay về index
                        window.location.href = 'index.html' + hash;
                    }
                });
            });
        });

        // Load footer
        fetch('footer.html')
            .then(response => response.text())
            .then(data => {
                document.getElementById('footer-container').innerHTML = data;
            });
    </script>

    <!-- Booking Logic -->
    <script>
        // Xử lý click nút đặt lịch
        document.querySelectorAll('.booking-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const serviceId = this.getAttribute('data-service-id');
                const serviceName = this.getAttribute('data-service-name');
                const servicePrice = this.getAttribute('data-service-price');
                
                // Điền thông tin vào modal
                document.getElementById('selectedService').value = serviceName;
                document.getElementById('selectedServiceId').value = serviceId;
                document.getElementById('servicePrice').value = new Intl.NumberFormat('vi-VN').format(servicePrice) + 'đ';
                
                // Mở modal
                const modal = new bootstrap.Modal(document.getElementById('bookingModal'));
                modal.show();
            });
        });

        // Scroll to services list
        function scrollToServices() {
            document.querySelector('.service-item-card').scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });
        }

        // Xử lý submit form đặt lịch
        document.getElementById('bookingForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = {
                name: document.getElementById('name').value,
                phone: document.getElementById('phone').value,
                serviceId: document.getElementById('selectedServiceId').value,
                address: document.getElementById('address').value,
                note: document.getElementById('note').value
            };
            
            // TODO: Gửi dữ liệu đến server
            console.log('Booking data:', formData);
            
            // Hiển thị thông báo thành công
            alert('Đặt lịch thành công! Chúng tôi sẽ liên hệ với bạn sớm nhất.');
            
            // Đóng modal và reset form
            bootstrap.Modal.getInstance(document.getElementById('bookingModal')).hide();
            this.reset();
        });
    </script>
    <script src="js/order_tracking.js"></script>
</body>
</html>