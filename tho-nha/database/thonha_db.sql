-- =====================================================
-- Thợ Nhà Database Schema (Minimal)
-- Chỉ lưu: đặt lịch, yêu cầu hủy, admin
-- Dữ liệu dịch vụ lấy từ data/services.json
-- =====================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";
SET NAMES utf8mb4;

-- Database: `thonha`

-- =====================================================
-- BẢNG ADMIN
-- =====================================================
CREATE TABLE `admins` (
  `id`       int(11)      NOT NULL AUTO_INCREMENT,
  `username` varchar(50)  NOT NULL,
  `password` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Tài khoản admin mặc định (password: admin123)
INSERT INTO `admins` (`id`, `username`, `password`) VALUES
(1, 'admin', '$2y$10$6bCPfmuIzA8RXWyVsGHS9eBK8erfGyEt6OjQt7ClA4u7WtyHbfkeO');

-- =====================================================
-- BẢNG ĐẶT LỊCH
-- =====================================================
CREATE TABLE `bookings` (
  `id`            int(11)     NOT NULL AUTO_INCREMENT,
  `order_code`    varchar(30) DEFAULT NULL,
  `customer_name` varchar(100) DEFAULT NULL,
  `phone`         varchar(20)  DEFAULT NULL,
  `service_name`  varchar(255) NOT NULL DEFAULT '',
  `address`       text         DEFAULT NULL,
  `note`          text         DEFAULT NULL,
  `status`        enum('new','confirmed','doing','done','cancel') DEFAULT 'new',
  `created_at`    timestamp   NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_code` (`order_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `bookings` (`id`, `order_code`, `customer_name`, `phone`, `service_name`, `address`, `note`, `status`, `created_at`) VALUES
(7,  'TN709918', 'Nông Quốc Thương', '0394371259', 'Thay motor máy giặt',   'Số 11 Phan Văn Trị', 'aa', 'cancel',    '2026-01-22 07:28:30'),
(8,  'TN417873', 'Nông Quốc Thương', '0123456789', 'Sửa bồn cầu rò nước',   'Số 11 Phan Văn Trị', 'aaa','new',       '2026-01-22 07:31:23'),
(9,  'TN672259', 'Nông Quốc Thương', '0394371259', 'Sửa bồn cầu rò nước',   'Số 11 Phan Văn Trị', '',  'new',       '2026-01-22 07:32:20'),
(10, 'TN188042', 'Nông Quốc Thu',    '0987654321', 'Chống thấm nhà vệ sinh', 'Gò Vấp',             'no','confirmed', '2026-01-25 08:36:23'),
(11, 'TN516460', 'thuong',           '0987654321', 'Sửa rò rỉ nước',        'Gò Vấp',             'ko','cancel',    '2026-01-27 04:27:33'),
(12, 'TN735188', 'Nông Quốc Thương', '0394371259', 'Thay motor máy giặt',   'Lê đức thọ',         '99','cancel',    '2026-01-28 04:11:00'),
(13, 'TN376090', 'Nông Quốc Thương', '0394371259', 'Vệ sinh máy giặt',      'aa',                 'a', 'cancel',    '2026-01-28 04:34:07');

-- =====================================================
-- BẢNG YÊU CẦU HỦY
-- =====================================================
CREATE TABLE `cancel_requests` (
  `id`                   int(11)   NOT NULL AUTO_INCREMENT,
  `booking_id`           int(11)   NOT NULL,
  `cancel_reason`        text      NOT NULL,
  `cancel_status`        enum('pending','approved','rejected') DEFAULT 'pending',
  `cancel_requested_at`  timestamp NOT NULL DEFAULT current_timestamp(),
  `cancel_processed_at`  timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `booking_id` (`booking_id`),
  CONSTRAINT `cancel_requests_ibfk_1` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `cancel_requests` (`id`, `booking_id`, `cancel_reason`, `cancel_status`, `cancel_requested_at`, `cancel_processed_at`) VALUES
(1, 9, 'aa', 'pending',  '2026-01-27 05:51:14', NULL),
(2, 7, 'aa', 'approved', '2026-01-27 05:54:34', '2026-01-27 06:00:42'),
(3, 11,'aa', 'approved', '2026-01-27 06:23:49', '2026-01-29 09:59:14');

COMMIT;
