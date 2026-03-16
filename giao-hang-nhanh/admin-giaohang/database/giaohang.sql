-- Database: `giaohang` (Bản đầy đủ từ shipper_db)
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- 1. Bảng users
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `fullname` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('customer','admin','shipper') DEFAULT 'customer',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `email` varchar(255) DEFAULT NULL,
  `company_name` varchar(255) DEFAULT NULL,
  `tax_code` varchar(50) DEFAULT NULL,
  `company_address` text DEFAULT NULL,
  `is_locked` tinyint(1) NOT NULL DEFAULT 0,
  `lock_reason` varchar(255) DEFAULT NULL,
  `is_approved` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 2. Bảng orders (Bản đầy đủ)
CREATE TABLE `orders` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `order_code` varchar(20) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `shipper_id` int(11) DEFAULT NULL,
  `pickup_address` text DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `receiver_name` varchar(100) NOT NULL,
  `receiver_phone` varchar(20) NOT NULL,
  `delivery_address` text NOT NULL,
  `is_corporate` tinyint(1) DEFAULT 0,
  `company_name` varchar(255) DEFAULT NULL,
  `company_email` varchar(100) DEFAULT NULL,
  `company_tax_code` varchar(50) DEFAULT NULL,
  `company_address` text DEFAULT NULL,
  `company_bank_info` text DEFAULT NULL,
  `cancel_reason` text DEFAULT NULL,
  `package_type` varchar(50) DEFAULT 'other',
  `service_type` varchar(50) NOT NULL DEFAULT 'standard',
  `weight` decimal(10,2) DEFAULT 0.00,
  `cod_amount` decimal(15,2) DEFAULT 0.00,
  `shipping_fee` decimal(15,2) DEFAULT 0.00,
  `pickup_time` datetime DEFAULT NULL,
  `note` text DEFAULT NULL,
  `payment_method` varchar(50) NOT NULL DEFAULT 'cod',
  `payment_status` varchar(50) NOT NULL DEFAULT 'unpaid',
  `shipper_note` text DEFAULT NULL,
  `admin_note` text DEFAULT NULL,
  `pod_image` varchar(255) DEFAULT NULL,
  `status` enum('pending','shipping','completed','cancelled') DEFAULT 'pending',
  `rating` int(11) DEFAULT NULL,
  `feedback` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `order_code` (`order_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 3. Bảng order_logs (Quan trọng để theo dõi lịch sử đơn hàng)
CREATE TABLE `order_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `order_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `old_status` varchar(50) DEFAULT NULL,
  `new_status` varchar(50) DEFAULT NULL,
  `note` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 4. Bảng saved_addresses
CREATE TABLE `saved_addresses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `address` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Chèn dữ liệu mẫu cho Users (Mật khẩu chung cho tất cả là: 123456)
-- Hash Bcrypt CHUẨN PHP của "123456" là: $2y$10$s14x7W47E5mTTsy9iW0IV.B85UolJ.Qc/zmMhXG07TeuojjCF3xNS
INSERT INTO `users` (`id`, `username`, `fullname`, `phone`, `password`, `role`) VALUES
(1, 'admin', 'Quản trị viên Hệ thống', '0901234567', '$2y$10$s14x7W47E5mTTsy9iW0IV.B85UolJ.Qc/zmMhXG07TeuojjCF3xNS', 'admin'),
(2, 'shipper01', 'Nguyễn Văn Giao', '0988777666', '$2y$10$s14x7W47E5mTTsy9iW0IV.B85UolJ.Qc/zmMhXG07TeuojjCF3xNS', 'shipper'),
(3, 'khachhang01', 'Lê Thị Khách', '0911222333', '$2y$10$s14x7W47E5mTTsy9iW0IV.B85UolJ.Qc/zmMhXG07TeuojjCF3xNS', 'customer');

-- Chèn dữ liệu mẫu cho Orders
INSERT INTO `orders` (`id`, `order_code`, `user_id`, `shipper_id`, `pickup_address`, `name`, `phone`, `receiver_name`, `receiver_phone`, `delivery_address`, `service_type`, `weight`, `cod_amount`, `shipping_fee`, `status`, `note`) VALUES
(1, 'GH-DEMO-001', 3, 2, '123 Đường Láng, Hà Nội', 'Lê Thị Khách', '0911222333', 'Trần Văn Nhận', '0944555666', '456 Phố Huế, Hà Nội', 'express', 1.50, 500000.00, 35000.00, 'shipping', 'Hàng dễ vỡ, giao gấp'),
(2, 'GH-DEMO-002', 3, NULL, '10 Mai Chí Thọ, TP.HCM', 'Lê Thị Khách', '0911222333', 'Nguyễn Thị B', '0909090909', '20 Hàm Nghi, Quận 1, TP.HCM', 'standard', 0.50, 0.00, 22000.00, 'pending', 'Giao trong giờ hành chính'),
(3, 'GH-DEMO-003', NULL, 2, '789 Trần Hưng Đạo, Đà Nẵng', 'Khách Vãng Lai', '0977888999', 'Phạm Văn C', '0966555444', '101 Nguyễn Văn Linh, Đà Nẵng', 'slow', 5.00, 1200000.00, 30000.00, 'completed', 'Đã thanh toán trước');

-- Chèn dữ liệu mẫu cho Order Logs
INSERT INTO `order_logs` (`order_id`, `user_id`, `old_status`, `new_status`, `note`) VALUES
(1, 1, 'pending', 'shipping', 'Admin đã phân phối đơn cho shipper01'),
(3, 2, 'shipping', 'completed', 'Shipper đã giao hàng thành công');

COMMIT;
