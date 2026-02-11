-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Máy chủ: 127.0.0.1
-- Thời gian đã tạo: Th2 03, 2026 lúc 05:09 PM
-- Phiên bản máy phục vụ: 10.4.32-MariaDB
-- Phiên bản PHP: 8.1.25

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Cơ sở dữ liệu: `csmvb`
--

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `bookings`
--

CREATE TABLE `bookings` (
  `id` int(10) UNSIGNED NOT NULL,
  `dichvu_id` int(10) UNSIGNED NOT NULL,
  `customer_id` int(10) UNSIGNED DEFAULT NULL,
  `customer_name` varchar(255) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `note` text DEFAULT NULL,
  `booking_date` datetime DEFAULT NULL,
  `status` enum('pending','contacted','confirmed','completed','cancelled') DEFAULT 'pending',
  `payment_status` enum('unpaid','paid') DEFAULT 'unpaid',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `bookings`
--

INSERT INTO `bookings` (`id`, `dichvu_id`, `customer_id`, `customer_name`, `phone`, `email`, `note`, `booking_date`, `status`, `payment_status`, `created_at`, `updated_at`) VALUES
(7, 17, NULL, 'Huy Lê Quang', '0373532588', 'huyq46532@gmail.com', 'ok', '2026-02-03 10:50:18', 'completed', 'paid', '2026-02-03 10:50:18', '2026-02-03 10:59:05');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `dichvu`
--

CREATE TABLE `dichvu` (
  `id` int(10) UNSIGNED NOT NULL,
  `tendichvu` varchar(255) NOT NULL,
  `mo_ta_ngan` text DEFAULT NULL,
  `noi_dung_chi_tiet` text DEFAULT NULL,
  `hinh_anh` varchar(500) DEFAULT NULL,
  `gia` decimal(12,2) NOT NULL,
  `gia_cu` decimal(12,2) DEFAULT NULL,
  `thoi_gian_du_kien` varchar(50) DEFAULT NULL,
  `category_id` int(10) UNSIGNED DEFAULT NULL,
  `status` tinyint(1) DEFAULT 1,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `dichvu`
--

INSERT INTO `dichvu` (`id`, `tendichvu`, `mo_ta_ngan`, `noi_dung_chi_tiet`, `hinh_anh`, `gia`, `gia_cu`, `thoi_gian_du_kien`, `category_id`, `status`, `created_at`, `updated_at`) VALUES
(1, 'Khám Sơ Sinh &amp; Tiêm Chủng', 'Kiểm tra sức khỏe chi tiết cho bé sơ sinh', 'Khám tổng quát\r\nSàng lọc sơ sinh\r\nTiêm chủng đầy đủ', 'assets/uploads/services/6980d73615e8c.png', 200000.00, NULL, '', 1, 1, '2026-01-31 11:53:00', '2026-02-02 23:56:22'),
(3, 'Chăm Sóc Mẹ Sau Sinh Tại Nhà', 'Hỗ trợ hồi phục sau sinh', 'Theo dõi sức khỏe mẹ\r\nChăm sóc vết mổ/vết khâu\r\nMassage thư giãn\r\nHướng dẫn cho bé bú đúng cách', 'assets/uploads/services/6980d6b73d1a2.png', 500000.00, 650000.00, '3 - 4 giờ', 1, 1, '2026-01-31 21:40:44', '2026-02-02 23:54:15'),
(4, 'Tắm Bé &amp; Chăm Sóc Rốn', 'Chăm sóc bé sơ sinh an toàn', 'Tắm bé đúng chuẩn y khoa\r\nVệ sinh rốn\r\nTheo dõi thân nhiệt\r\nHướng dẫn cha mẹ chăm sóc tại nhà', 'assets/uploads/services/6980d6d7d02e3.png', 250000.00, NULL, '60 phút', 1, 1, '2026-01-31 21:40:44', '2026-02-02 23:54:47'),
(5, 'Massage &amp; Kích Thích Phát Triển Cho Bé', 'Hỗ trợ bé ăn ngon, ngủ sâu', 'Massage toàn thân\r\nKích thích giác quan\r\nHướng dẫn cha mẹ thực hiện tại nhà', 'assets/uploads/services/6980d6f04081a.png', 300000.00, NULL, '45 phút', 1, 1, '2026-01-31 21:40:44', '2026-02-02 23:55:12'),
(6, 'Theo Dõi Sức Khỏe Mẹ &amp; Bé 7 Ngày', 'Gói chăm sóc sau sinh trọn gói', 'Theo dõi sức khỏe mẹ\r\nTheo dõi bé sơ sinh\r\nTư vấn dinh dưỡng & chăm sóc', 'assets/uploads/services/6980d71e0ca5d.png', 3000000.00, 3500000.00, '7 ngày', 1, 1, '2026-01-31 21:40:44', '2026-02-02 23:55:58'),
(13, 'Massage Bầu Thư Giãn', 'Giảm đau mỏi lưng và hông cho mẹ', 'Massage chuyên sâu vùng lưng, cổ vai gáy. Giúp giảm phù nề chân và cải thiện giấc ngủ.', 'assets/uploads/services/6980d4674fbe7.png', 350000.00, 400000.00, '90 phút', 2, 0, '2026-02-02 22:09:16', '2026-02-03 10:59:55'),
(14, 'Ngâm Chân Thảo Dược Bầu', 'Giảm stress và lưu thông khí huyết', 'Sử dụng các loại thảo mộc tự nhiên giúp mẹ bầu thư giãn, giảm tê bì chân tay.', 'assets/uploads/services/6980d4880ed33.png', 150000.00, NULL, '30 phút', 2, 1, '2026-02-02 22:09:16', '2026-02-02 23:44:56'),
(15, 'Chăm Sóc Da Mặt Mẹ Bầu', 'Sử dụng mỹ phẩm hữu cơ an toàn', 'Liệu trình làm sạch sâu, đắp mặt nạ thiên nhiên giúp da sáng khỏe trong thai kỳ.', 'assets/uploads/services/6980d4b5cda0e.png', 300000.00, NULL, '60 phút', 2, 1, '2026-02-02 22:09:16', '2026-02-02 23:45:41'),
(16, 'Thông Tắc Tia Sữa Tại Nhà', 'Xử lý nhanh tình trạng cương sữa', 'Sử dụng máy siêu âm đa tần kết hợp massage thủ công để thông tắc tia sữa không đau.', 'assets/uploads/services/6980d4da7fb1c.png', 450000.00, 500000.00, '60 - 90 phút', 3, 1, '2026-02-02 22:09:16', '2026-02-02 23:46:18'),
(17, 'Kích Sữa Chuyên Sâu', 'Dành cho mẹ ít sữa, mất sữa', 'Tư vấn chế độ dinh dưỡng và kỹ thuật kích sữa bằng máy chuyên dụng.', 'assets/uploads/services/6980d4f577081.png', 400000.00, NULL, '60 phút', 3, 1, '2026-02-02 22:09:16', '2026-02-02 23:46:45'),
(18, 'Tư Vấn Nuôi Con Bằng Sữa Mẹ', 'Hướng dẫn khớp ngậm đúng', 'Chuyên gia hướng dẫn tư thế cho bú và cách duy trì nguồn sữa lâu dài.', 'assets/uploads/services/6980d5116c34e.png', 200000.00, NULL, '45 phút', 3, 1, '2026-02-02 22:09:16', '2026-02-02 23:47:13'),
(19, 'Massage Giảm Eo Sau Sinh', 'Lấy lại vòng eo thon gọn', 'Kỹ thuật massage ấn huyệt Nhật Bản kết hợp quấn muối thảo dược.', 'assets/uploads/services/6980d53011e7d.png', 550000.00, 700000.00, '90 phút', 4, 1, '2026-02-02 22:09:16', '2026-02-02 23:47:44'),
(20, 'Xông Hơi Toàn Thân Thảo Dược', 'Đào thải độc tố sau sinh', 'Sử dụng lều xông hơi và lá xông thảo dược truyền thống giúp mẹ nhẹ người.', 'assets/uploads/services/6980d55130615.png', 250000.00, NULL, '45 phút', 4, 1, '2026-02-02 22:09:16', '2026-02-02 23:48:17'),
(21, 'Tẩy Tế Bào Chết Toàn Thân', 'Làm sáng da vùng bụng và nách', 'Sử dụng cám gạo và nghệ tươi giúp làm mờ các vết thâm rạn sau khi sinh.', 'assets/uploads/services/6980d57840eb3.png', 300000.00, 350000.00, '60 phút', 4, 1, '2026-02-02 22:09:16', '2026-02-02 23:48:56');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `service_category`
--

CREATE TABLE `service_category` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `icon` varchar(50) DEFAULT NULL,
  `status` tinyint(1) DEFAULT 1,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `service_category`
--

INSERT INTO `service_category` (`id`, `name`, `description`, `icon`, `status`, `created_at`) VALUES
(1, 'Dịch Vụ Chăm Sóc Mẹ và Bé', 'Các dịch vụ khám sức khỏe', 'heart', 1, '2026-01-31 11:53:00'),
(2, 'Chăm Sóc Mẹ Bầu', 'Các liệu pháp massage và thư giãn dành riêng cho phụ nữ mang thai.', 'baby-carriage', 1, '2026-02-02 22:08:51'),
(3, 'Dịch Vụ Thông Tắc Tia Sữa', 'Điều trị và hỗ trợ mẹ gặp các vấn đề về tuyến sữa sau sinh.', 'faucet', 1, '2026-02-02 22:08:51'),
(4, 'Phục Hồi Vóc Dáng & Làm Đẹp', 'Liệu trình giảm eo, chăm sóc da và xông hơi thảo dược.', 'sparkles', 1, '2026-02-02 22:08:51');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `users`
--

CREATE TABLE `users` (
  `id` int(10) UNSIGNED NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `avatar` varchar(500) DEFAULT NULL,
  `role` enum('customer','admin','staff','doctor') DEFAULT 'customer',
  `status` enum('active','inactive','banned') DEFAULT 'active',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `users`
--

INSERT INTO `users` (`id`, `username`, `email`, `password`, `full_name`, `phone`, `address`, `avatar`, `role`, `status`, `created_at`, `updated_at`) VALUES
(1, 'admin', 'admin@mamacore.com', '$2y$10$0jNRVC4uYk6arWOtB/Q8b.nTniOnW7rzngpHlKBHS8ACNsrQVlMlW', 'Admin', NULL, NULL, NULL, 'admin', 'active', '2026-01-31 11:53:00', '2026-02-03 00:12:39');

--
-- Chỉ mục cho các bảng đã đổ
--

--
-- Chỉ mục cho bảng `bookings`
--
ALTER TABLE `bookings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_dichvu` (`dichvu_id`),
  ADD KEY `idx_customer` (`customer_id`);

--
-- Chỉ mục cho bảng `dichvu`
--
ALTER TABLE `dichvu`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_category` (`category_id`);

--
-- Chỉ mục cho bảng `service_category`
--
ALTER TABLE `service_category`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Chỉ mục cho bảng `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT cho các bảng đã đổ
--

--
-- AUTO_INCREMENT cho bảng `bookings`
--
ALTER TABLE `bookings`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT cho bảng `dichvu`
--
ALTER TABLE `dichvu`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT cho bảng `service_category`
--
ALTER TABLE `service_category`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT cho bảng `users`
--
ALTER TABLE `users`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Các ràng buộc cho các bảng đã đổ
--

--
-- Các ràng buộc cho bảng `bookings`
--
ALTER TABLE `bookings`
  ADD CONSTRAINT `fk_bookings_customer` FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_bookings_dichvu` FOREIGN KEY (`dichvu_id`) REFERENCES `dichvu` (`id`) ON UPDATE CASCADE;

--
-- Các ràng buộc cho bảng `dichvu`
--
ALTER TABLE `dichvu`
  ADD CONSTRAINT `fk_dichvu_category` FOREIGN KEY (`category_id`) REFERENCES `service_category` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
