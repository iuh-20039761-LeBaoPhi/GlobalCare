-- =====================================================
-- Thợ Nhà — Full Database Schema
-- Import file này để tạo mới hoàn toàn
-- Admin mặc định: admin.thonha@gmail.com / 123456
-- =====================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET NAMES utf8mb4;

CREATE DATABASE IF NOT EXISTS `thonha`
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `thonha`;

-- =====================================================
-- BẢNG NGƯỜI DÙNG (users)
-- role:   admin | customer | provider
-- status: active | blocked | pending | rejected
--   provider: pending=chờ duyệt, active=đã duyệt
-- =====================================================
CREATE TABLE `users` (
  `id`           INT(11)      NOT NULL AUTO_INCREMENT,
  `full_name`    VARCHAR(100) NOT NULL,
  `email`        VARCHAR(100) NOT NULL,
  `phone`        VARCHAR(20)  NOT NULL DEFAULT '',
  `password`     VARCHAR(255) NOT NULL,
  `role`         ENUM('admin','customer','provider') NOT NULL DEFAULT 'customer',
  `status`       ENUM('active','blocked','pending','rejected') NOT NULL DEFAULT 'active',
  -- Chỉ dùng cho provider
  `company_name`     VARCHAR(255) DEFAULT NULL COMMENT 'Tên cửa hàng / đội thợ',
  `address`          TEXT         DEFAULT NULL,
  `description`      TEXT         DEFAULT NULL,
  `avatar`           VARCHAR(500) DEFAULT NULL COMMENT 'Đường dẫn ảnh đại diện',
  `cccd_front`       VARCHAR(500) DEFAULT NULL COMMENT 'CCCD mặt trước',
  `cccd_back`        VARCHAR(500) DEFAULT NULL COMMENT 'CCCD mặt sau',
  `rejection_reason` VARCHAR(500) DEFAULT NULL COMMENT 'Lý do từ chối / khóa tài khoản (admin ghi)',
  `created_at`       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_role`   (`role`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Admin mặc định (password: 123456)
INSERT INTO `users` (`full_name`, `email`, `phone`, `password`, `role`, `status`) VALUES
('Quản trị viên', 'admin.thonha@gmail.com', '', '$2y$10$6bCPfmuIzA8RXWyVsGHS9eBK8erfGyEt6OjQt7ClA4u7WtyHbfkeO', 'admin', 'active');

-- =====================================================
-- BẢNG ĐẶT LỊCH (bookings)
-- user_id:       khách hàng đặt lịch (FK → users)
-- provider_id:   nhà cung cấp nhận đơn (FK → users)
-- selected_brand:  hãng linh kiện đã chọn khi đặt
-- estimated_price: giá ước tính (dịch vụ + di chuyển + khảo sát)
-- =====================================================
CREATE TABLE `bookings` (
  `id`              INT(11)      NOT NULL AUTO_INCREMENT,
  `user_id`         INT(11)      DEFAULT NULL COMMENT 'FK → users (customer)',
  `provider_id`     INT(11)      DEFAULT NULL COMMENT 'FK → users (provider)',
  `order_code`      VARCHAR(30)  DEFAULT NULL,
  `customer_name`   VARCHAR(100) DEFAULT NULL,
  `phone`           VARCHAR(20)  DEFAULT NULL,
  `service_name`    VARCHAR(255) NOT NULL DEFAULT '',
  `address`         TEXT         DEFAULT NULL,
  `note`            TEXT         DEFAULT NULL,
  `status`          ENUM('new','confirmed','doing','done','cancel') NOT NULL DEFAULT 'new',
  `selected_brand`  VARCHAR(100) DEFAULT NULL  COMMENT 'Hãng linh kiện/vật liệu đã chọn',
  `estimated_price` INT(11)      DEFAULT NULL  COMMENT 'Giá ước tính tối thiểu lúc đặt (VNĐ)',
  `created_at`      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_code`       (`order_code`),
  KEY `idx_user_id`     (`user_id`),
  KEY `idx_provider_id` (`provider_id`),
  KEY `idx_status`      (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dữ liệu mẫu
INSERT INTO `bookings` (`order_code`,`customer_name`,`phone`,`service_name`,`address`,`note`,`status`,`created_at`) VALUES
('TN709918','Nguyễn Văn An',   '0901234567','Thay motor máy giặt',    'Số 11 Phan Văn Trị, Q. Bình Thạnh','',   'cancel',    '2026-01-22 07:28:30'),
('TN417873','Trần Thị Bích',   '0912345678','Sửa bồn cầu rò nước',   '45 Lê Lợi, Quận Hải Châu, Đà Nẵng','',  'new',       '2026-01-22 07:31:23'),
('TN672259','Lê Minh Khoa',    '0978901234','Sửa bồn cầu rò nước',   '88 Đinh Tiên Hoàng, Bình Thạnh','',      'new',       '2026-01-22 07:32:20'),
('TN188042','Phạm Quỳnh Anh',  '0987654321','Chống thấm nhà vệ sinh', 'Gò Vấp, TP.HCM','',                    'confirmed', '2026-01-25 08:36:23'),
('TN516460','Hoàng Đức Trung', '0945678901','Sửa rò rỉ nước',        '67 Hai Bà Trưng, Q.3, TP.HCM','',       'cancel',    '2026-01-27 04:27:33'),
('TN735188','Vũ Thị Lan',      '0956789012','Thay motor máy giặt',    '15 Phan Bội Châu, TP. Huế','',           'cancel',    '2026-01-28 04:11:00'),
('TN376090','Ngô Thị Mai',     '0989012345','Vệ sinh máy giặt',       '5 Lý Tự Trọng, Cần Thơ','',             'done',      '2026-01-28 04:34:07'),
('TN821345','Bùi Văn Hùng',    '0901112233','Sơn tường nội thất',     '30 Lê Duẩn, Q.1, TP.HCM','',            'doing',     '2026-02-01 09:00:00');

-- =====================================================
-- BẢNG YÊU CẦU HỦY (cancel_requests)
-- =====================================================
CREATE TABLE `cancel_requests` (
  `id`                  INT(11)  NOT NULL AUTO_INCREMENT,
  `booking_id`          INT(11)  NOT NULL,
  `cancel_reason`       TEXT     NOT NULL,
  `cancel_status`       ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `cancel_requested_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `cancel_processed_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `booking_id` (`booking_id`),
  CONSTRAINT `cancel_requests_ibfk_1`
    FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dữ liệu mẫu yêu cầu hủy
INSERT INTO `cancel_requests` (`booking_id`,`cancel_reason`,`cancel_status`,`cancel_requested_at`,`cancel_processed_at`) VALUES
(3,'Tôi muốn đổi lịch sang tuần sau',    'pending',  '2026-01-27 05:51:14', NULL),
(1,'Đặt nhầm dịch vụ',                   'approved', '2026-01-27 05:54:34', '2026-01-27 06:00:42'),
(5,'Bận đột xuất không thể tiếp thợ',    'approved', '2026-01-27 06:23:49', '2026-01-29 09:59:14');

-- =====================================================
-- BẢNG DANH MỤC DỊCH VỤ (service_categories)
-- is_active: 1=hiển thị, 0=ẩn
-- =====================================================
CREATE TABLE `service_categories` (
  `id`          INT(11)      NOT NULL AUTO_INCREMENT,
  `name`        VARCHAR(150) NOT NULL,
  `description` TEXT         DEFAULT NULL,
  `is_active`   TINYINT(1)   NOT NULL DEFAULT 1,
  `created_at`  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dữ liệu mẫu danh mục
INSERT INTO `service_categories` (`name`, `description`, `is_active`) VALUES
('Sửa Máy Lạnh',  'Sửa chữa, vệ sinh, bảo dưỡng máy lạnh các loại. Thay linh kiện chính hãng, nạp gas R32/R410A.', 1),
('Sửa Máy Giặt',  'Sửa máy giặt cửa trên, cửa ngang, máy giặt sấy. Thay motor, board mạch, cảm biến chính hãng.',  1),
('Nhà Vệ Sinh',   'Thông tắc bồn cầu, sửa rò nước, chống thấm nhà vệ sinh hiệu quả.',                              1),
('Điện Nước',     'Sửa chữa hệ thống điện nước trong nhà. Xử lý nhanh sự cố chập điện, rò rỉ nước, thay ống.',    1),
('Sửa Tủ Lạnh',   'Sửa chữa tủ lạnh các hãng. Xử lý không lạnh, rò gas, thay linh kiện, vệ sinh dàn lạnh.',       1),
('Sửa Tivi',      'Sửa chữa tivi LED, LCD, OLED các hãng. Khắc phục mất hình, mất tiếng, không nguồn.',            1),
('Sửa Bếp Từ',    'Sửa chữa bếp từ, bếp điện từ, bếp gas các hãng. Xử lý không nóng, báo lỗi, không nhận nồi.',   1),
('Cải Tạo Nhà',   'Thi công cải tạo nhà cửa: sơn nhà, trần thạch cao, lát nền. Tư vấn miễn phí.',                  1);

-- =====================================================
-- BẢNG DỊCH VỤ (services)
-- brand_prices: JSON array — giá theo từng hãng (tương thích ngược)
-- pricing_json: JSON object — travelFee, surveyFee, priceRange, brandPrices
--   Nếu pricing_json có brandPrices, ưu tiên dùng hơn brand_prices.
-- =====================================================
CREATE TABLE `services` (
  `id`            INT(11)       NOT NULL AUTO_INCREMENT,
  `category_id`   INT(11)       NOT NULL,
  `name`          VARCHAR(255)  NOT NULL,
  `price`         DECIMAL(12,0) NOT NULL DEFAULT 0  COMMENT 'Giá mặc định (VNĐ)',
  `labor_cost`    DECIMAL(12,0) DEFAULT NULL         COMMENT 'Tiền công',
  `material_cost` DECIMAL(12,0) DEFAULT NULL         COMMENT 'Vật liệu/linh kiện',
  `brand`         VARCHAR(100)  DEFAULT NULL         COMMENT 'Hãng đơn (text tự do)',
  `warranty`      VARCHAR(50)   DEFAULT NULL         COMMENT 'Thời hạn bảo hành, VD: 6 tháng',
  `duration`      VARCHAR(50)   DEFAULT NULL         COMMENT 'Thời gian thực hiện, VD: 1–2 giờ',
  `description`   TEXT          DEFAULT NULL,
  `brand_prices`  TEXT          DEFAULT NULL         COMMENT 'JSON: [{name, price, materialCost}] (tương thích ngược)',
  `pricing_json`  TEXT          DEFAULT NULL         COMMENT 'JSON: {travelFee, surveyFee, priceRange, brandPrices}',
  `is_active`     TINYINT(1)    NOT NULL DEFAULT 1,
  `created_at`    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_category_id` (`category_id`),
  KEY `idx_is_active`   (`is_active`),
  CONSTRAINT `services_ibfk_1`
    FOREIGN KEY (`category_id`) REFERENCES `service_categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dữ liệu mẫu dịch vụ (category_id 1–8 tương ứng INSERT ở trên)
-- pricing_json lưu travelFee + surveyFee + priceRange cho từng dịch vụ
INSERT INTO `services` (`category_id`,`name`,`price`,`labor_cost`,`material_cost`,`warranty`,`duration`,`description`,`brand_prices`,`pricing_json`) VALUES

-- Sửa Máy Lạnh (cat 1)
(1,'Vệ sinh máy lạnh',300000,200000,100000,'3 tháng','1–2 giờ',
 'Vệ sinh toàn bộ dàn lạnh và dàn nóng, làm sạch bụi bẩn, giúp máy lạnh hoạt động hiệu quả và tiết kiệm điện.',
 NULL,
 '{"travelFee":{"mode":"fixed","fixedAmount":30000,"min":20000,"max":50000}}'),

(1,'Nạp gas máy lạnh',430000,150000,280000,'3 tháng','1–2 giờ',
 'Nạp gas đúng loại và đúng áp suất, xử lý thiếu gas giúp máy lạnh làm mát nhanh và ổn định.',
 '[{"name":"R32","materialCost":280000,"price":430000},{"name":"R410A","materialCost":320000,"price":470000}]',
 '{"travelFee":{"mode":"fixed","fixedAmount":30000,"min":20000,"max":50000},"priceRange":{"min":430000,"max":470000,"currency":"VNĐ"}}'),

(1,'Thay block máy lạnh',1200000,300000,900000,'12 tháng','2–3 giờ',
 'Thay block (máy nén) mới cho máy lạnh khi block cũ bị hư, kém lạnh hoặc không hoạt động.',
 '[{"name":"Daikin","materialCost":1000000,"price":1300000},{"name":"Toshiba","materialCost":900000,"price":1200000},{"name":"LG","materialCost":850000,"price":1150000}]',
 '{"travelFee":{"mode":"fixed","fixedAmount":30000,"min":20000,"max":50000},"surveyFee":{"amount":50000,"required":true,"waiveIfBooked":true,"deductToFinal":true},"priceRange":{"min":1150000,"max":1300000,"currency":"VNĐ"}}'),

(1,'Di dời máy lạnh',500000,500000,NULL,'3 tháng','2–4 giờ',
 'Tháo lắp, di chuyển máy lạnh sang vị trí mới an toàn, đảm bảo kỹ thuật và thẩm mỹ.',
 NULL,
 '{"travelFee":{"mode":"fixed","fixedAmount":30000,"min":20000,"max":50000},"surveyFee":{"amount":50000,"required":false,"waiveIfBooked":true,"deductToFinal":false}}'),

-- Sửa Máy Giặt (cat 2)
(2,'Sửa máy giặt không vắt',280000,200000,80000,'3 tháng','1–2 giờ',
 'Khắc phục tình trạng máy giặt không vắt, vắt yếu do lỗi motor, dây curoa hoặc bo mạch.',
 NULL,
 '{"travelFee":{"mode":"fixed","fixedAmount":30000,"min":20000,"max":50000}}'),

(2,'Thay motor máy giặt',900000,200000,700000,'6 tháng','1–2 giờ',
 'Thay motor máy giặt chính hãng, giúp máy giặt hoạt động mạnh mẽ và ổn định trở lại.',
 '[{"name":"Samsung","materialCost":700000,"price":900000},{"name":"LG","materialCost":650000,"price":850000},{"name":"Electrolux","materialCost":800000,"price":1000000}]',
 '{"travelFee":{"mode":"fixed","fixedAmount":30000,"min":20000,"max":50000},"priceRange":{"min":850000,"max":1000000,"currency":"VNĐ"}}'),

(2,'Vệ sinh máy giặt',350000,250000,100000,'1 tháng','1–2 giờ',
 'Vệ sinh lồng giặt, loại bỏ cặn bẩn, vi khuẩn và mùi hôi, bảo vệ sức khỏe gia đình.',
 NULL,
 '{"travelFee":{"mode":"fixed","fixedAmount":30000,"min":20000,"max":50000}}'),

-- Nhà Vệ Sinh (cat 3)
(3,'Thông tắc bồn cầu',200000,200000,NULL,'1 tháng','30–60 phút',
 'Xử lý nhanh tình trạng bồn cầu bị nghẹt, thoát nước kém bằng thiết bị chuyên dụng.',
 NULL,
 '{"travelFee":{"mode":"fixed","fixedAmount":30000,"min":20000,"max":50000}}'),

(3,'Sửa bồn cầu rò nước',250000,150000,100000,'3 tháng','1–2 giờ',
 'Sửa chữa bồn cầu bị rò rỉ nước, chảy nước liên tục gây lãng phí và mất vệ sinh.',
 NULL,
 '{"travelFee":{"mode":"fixed","fixedAmount":30000,"min":20000,"max":50000}}'),

(3,'Chống thấm nhà vệ sinh',1500000,500000,1000000,'12 tháng','1–2 ngày',
 'Chống thấm triệt để nhà vệ sinh, ngăn thấm nước, ẩm mốc và hư hỏng kết cấu.',
 '[{"name":"Sika","materialCost":1000000,"price":1500000},{"name":"Kova","materialCost":800000,"price":1300000}]',
 '{"travelFee":{"mode":"fixed","fixedAmount":30000,"min":20000,"max":50000},"surveyFee":{"amount":150000,"required":true,"waiveIfBooked":true,"deductToFinal":true},"priceRange":{"min":1300000,"max":1500000,"currency":"VNĐ"}}'),

-- Điện Nước (cat 4)
(4,'Sửa chập điện',180000,180000,NULL,'3 tháng','1–2 giờ',
 'Sửa chữa sự cố chập điện, mất điện cục bộ, đảm bảo an toàn cho hệ thống điện gia đình.',
 NULL,
 '{"travelFee":{"mode":"fixed","fixedAmount":30000,"min":20000,"max":50000}}'),

(4,'Sửa rò rỉ nước',200000,200000,NULL,'3 tháng','1–2 giờ',
 'Xử lý rò rỉ nước âm tường, đường ống nước bị bể, xì nước nhanh chóng và hiệu quả.',
 NULL,
 '{"travelFee":{"mode":"fixed","fixedAmount":30000,"min":20000,"max":50000}}'),

(4,'Thay đường ống nước',400000,200000,200000,'12 tháng','2–4 giờ',
 'Thay mới đường ống nước cũ, hư hỏng, đảm bảo nguồn nước sạch và ổn định.',
 '[{"name":"Tiền Phong","materialCost":200000,"price":400000},{"name":"Bình Minh","materialCost":180000,"price":380000}]',
 '{"travelFee":{"mode":"fixed","fixedAmount":30000,"min":20000,"max":50000},"priceRange":{"min":380000,"max":400000,"currency":"VNĐ"}}'),

-- Sửa Tủ Lạnh (cat 5)
(5,'Sửa tủ lạnh không lạnh',300000,200000,100000,'3 tháng','1–2 giờ',
 'Chẩn đoán và khắc phục tủ lạnh không lạnh do lỗi board mạch, quạt dàn lạnh hoặc cảm biến nhiệt.',
 NULL,
 '{"travelFee":{"mode":"fixed","fixedAmount":30000,"min":20000,"max":50000}}'),

(5,'Vệ sinh tủ lạnh',200000,150000,50000,'1 tháng','30–60 phút',
 'Vệ sinh dàn lạnh, khay nước, ngăn chứa, loại bỏ vi khuẩn và mùi hôi, đảm bảo vệ sinh thực phẩm.',
 NULL,
 '{"travelFee":{"mode":"fixed","fixedAmount":30000,"min":20000,"max":50000}}'),

(5,'Thay ron cửa tủ lạnh',350000,150000,200000,'6 tháng','1–2 giờ',
 'Thay ron cao su cửa tủ lạnh bị hở, giúp giữ nhiệt tốt, tiết kiệm điện và bảo quản thực phẩm lâu hơn.',
 '[{"name":"Samsung","materialCost":200000,"price":350000},{"name":"LG","materialCost":180000,"price":330000},{"name":"Electrolux","materialCost":220000,"price":370000}]',
 '{"travelFee":{"mode":"fixed","fixedAmount":30000,"min":20000,"max":50000},"priceRange":{"min":330000,"max":370000,"currency":"VNĐ"}}'),

(5,'Nạp gas tủ lạnh',450000,200000,250000,'6 tháng','1–2 giờ',
 'Nạp lại gas tủ lạnh bị thiếu hoặc rò rỉ, đảm bảo tủ lạnh làm lạnh đúng nhiệt độ và ổn định.',
 NULL,
 '{"travelFee":{"mode":"fixed","fixedAmount":30000,"min":20000,"max":50000}}'),

-- Sửa Tivi (cat 6)
(6,'Sửa tivi không lên nguồn',280000,200000,80000,'3 tháng','1–2 giờ',
 'Kiểm tra và sửa chữa nguồn điện, bo mạch tivi khi tivi không lên nguồn hoặc tự tắt bật.',
 NULL,
 '{"travelFee":{"mode":"fixed","fixedAmount":30000,"min":20000,"max":50000}}'),

(6,'Sửa tivi mất hình',300000,250000,50000,'3 tháng','1–2 giờ',
 'Xử lý tivi không có hình, màn hình đen, sọc dọc/ngang do lỗi mạch cao áp hoặc dây tín hiệu.',
 NULL,
 '{"travelFee":{"mode":"fixed","fixedAmount":30000,"min":20000,"max":50000}}'),

(6,'Sửa tivi mất tiếng',250000,200000,50000,'3 tháng','1–2 giờ',
 'Khắc phục tivi không có âm thanh, âm thanh bị rè, nhiễu do lỗi bo âm thanh hoặc loa.',
 NULL,
 '{"travelFee":{"mode":"fixed","fixedAmount":30000,"min":20000,"max":50000}}'),

(6,'Thay màn hình tivi',1500000,300000,1200000,'6 tháng','2–4 giờ',
 'Thay thế màn hình tivi bị vỡ, bể, đốm sáng bằng màn hình chính hãng tương thích.',
 '[{"name":"Samsung","materialCost":1200000,"price":1500000},{"name":"LG","materialCost":1100000,"price":1400000},{"name":"Sony","materialCost":1300000,"price":1600000}]',
 '{"travelFee":{"mode":"fixed","fixedAmount":30000,"min":20000,"max":50000},"priceRange":{"min":1400000,"max":1600000,"currency":"VNĐ"}}'),

-- Sửa Bếp Từ (cat 7)
(7,'Sửa bếp từ không nóng',350000,250000,100000,'3 tháng','1–2 giờ',
 'Chẩn đoán và sửa chữa bếp từ không tạo nhiệt do lỗi IGBT, cảm biến nhiệt hoặc bo mạch điều khiển.',
 NULL,
 '{"travelFee":{"mode":"fixed","fixedAmount":30000,"min":20000,"max":50000}}'),

(7,'Sửa bếp từ báo lỗi',280000,200000,80000,'3 tháng','1–2 giờ',
 'Xử lý các mã lỗi E0–E8 trên bếp từ, reset và sửa chữa linh kiện liên quan để bếp hoạt động bình thường.',
 NULL,
 '{"travelFee":{"mode":"fixed","fixedAmount":30000,"min":20000,"max":50000}}'),

(7,'Thay mặt kính bếp từ',800000,200000,600000,'6 tháng','2–3 giờ',
 'Thay thế mặt kính bếp từ bị nứt, vỡ bằng kính ceramic chịu nhiệt chính hãng, đảm bảo an toàn.',
 '[{"name":"Bosch","materialCost":700000,"price":900000},{"name":"Teka","materialCost":600000,"price":800000},{"name":"Sunhouse","materialCost":450000,"price":650000}]',
 '{"travelFee":{"mode":"fixed","fixedAmount":30000,"min":20000,"max":50000},"priceRange":{"min":650000,"max":900000,"currency":"VNĐ"}}'),

(7,'Sửa bếp gas',200000,150000,50000,'3 tháng','30–60 phút',
 'Sửa bếp gas không bật lửa, lửa yếu, rò gas, thay van gas và làm sạch đầu đốt đảm bảo an toàn.',
 NULL,
 '{"travelFee":{"mode":"fixed","fixedAmount":30000,"min":20000,"max":50000}}'),

-- Cải Tạo Nhà (cat 8)
(8,'Sơn nhà',5000000,2000000,3000000,'12 tháng','2–5 ngày',
 'Sơn mới hoặc sơn lại nhà ở, căn hộ với vật liệu chất lượng cao, bền đẹp theo thời gian.',
 '[{"name":"Dulux","materialCost":3000000,"price":5000000},{"name":"Jotun","materialCost":3500000,"price":5500000},{"name":"Kova","materialCost":2500000,"price":4500000}]',
 '{"travelFee":{"mode":"fixed","fixedAmount":50000,"min":30000,"max":100000},"surveyFee":{"amount":200000,"required":true,"waiveIfBooked":true,"deductToFinal":true},"priceRange":{"min":4500000,"max":5500000,"currency":"VNĐ"}}'),

(8,'Trần thạch cao',7000000,3000000,4000000,'12 tháng','3–5 ngày',
 'Thi công trần thạch cao thẩm mỹ, cách âm, cách nhiệt, phù hợp nhà ở và văn phòng.',
 '[{"name":"Gyproc","materialCost":4000000,"price":7000000},{"name":"USG","materialCost":4500000,"price":7500000}]',
 '{"travelFee":{"mode":"fixed","fixedAmount":50000,"min":30000,"max":100000},"surveyFee":{"amount":200000,"required":true,"waiveIfBooked":true,"deductToFinal":true},"priceRange":{"min":7000000,"max":7500000,"currency":"VNĐ"}}'),

(8,'Lát nền gạch',6000000,2500000,3500000,'12 tháng','3–5 ngày',
 'Lát nền gạch chuyên nghiệp, thẳng đẹp, bền chắc cho nhà ở và công trình.',
 '[{"name":"Đồng Tâm","materialCost":3500000,"price":6000000},{"name":"Viglacera","materialCost":4000000,"price":6500000}]',
 '{"travelFee":{"mode":"fixed","fixedAmount":50000,"min":30000,"max":100000},"surveyFee":{"amount":200000,"required":true,"waiveIfBooked":true,"deductToFinal":true},"priceRange":{"min":6000000,"max":6500000,"currency":"VNĐ"}}');

-- =====================================================
-- MIGRATION — Nâng cấp DB cũ
-- Chạy phần này nếu DB đã tồn tại từ phiên bản trước.
-- An toàn khi chạy nhiều lần (IF NOT EXISTS / IF EXISTS).
-- KHÔNG cần chạy khi import file này lần đầu.
-- =====================================================

-- v1 → v2: thêm pricing_json cho services, selected_brand + estimated_price cho bookings
ALTER TABLE `services`  ADD COLUMN IF NOT EXISTS `pricing_json`    TEXT          DEFAULT NULL COMMENT 'JSON: {travelFee, surveyFee, priceRange, brandPrices}';
ALTER TABLE `bookings`  ADD COLUMN IF NOT EXISTS `selected_brand`  VARCHAR(100)  DEFAULT NULL COMMENT 'Hãng linh kiện/vật liệu đã chọn';
ALTER TABLE `bookings`  ADD COLUMN IF NOT EXISTS `estimated_price` INT(11)       DEFAULT NULL COMMENT 'Giá ước tính tối thiểu lúc đặt (VNĐ)';
ALTER TABLE `bookings`  ADD COLUMN IF NOT EXISTS `user_id`         INT(11)       DEFAULT NULL COMMENT 'FK → users (customer)';
ALTER TABLE `bookings`  ADD COLUMN IF NOT EXISTS `provider_id`     INT(11)       DEFAULT NULL COMMENT 'FK → users (provider)';

-- v2 → v3: thêm cột ảnh/giấy tờ và rejection_reason cho provider
ALTER TABLE `users`     ADD COLUMN IF NOT EXISTS `avatar`           VARCHAR(500)  DEFAULT NULL COMMENT 'Đường dẫn ảnh đại diện';
ALTER TABLE `users`     ADD COLUMN IF NOT EXISTS `cccd_front`       VARCHAR(500)  DEFAULT NULL COMMENT 'CCCD mặt trước';
ALTER TABLE `users`     ADD COLUMN IF NOT EXISTS `cccd_back`        VARCHAR(500)  DEFAULT NULL COMMENT 'CCCD mặt sau';
ALTER TABLE `users`     ADD COLUMN IF NOT EXISTS `rejection_reason` VARCHAR(500)  DEFAULT NULL COMMENT 'Lý do từ chối / khóa tài khoản (admin ghi)';
