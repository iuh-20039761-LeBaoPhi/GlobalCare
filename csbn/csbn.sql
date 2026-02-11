-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Máy chủ: 127.0.0.1
-- Thời gian đã tạo: Th2 03, 2026 lúc 05:11 PM
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
-- Cơ sở dữ liệu: `csbn`
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
(7, 34, NULL, 'Huy Lê Quang', '0373532588', 'huyq46532@gmail.com', 'ok', '2026-02-03 11:11:07', 'completed', 'paid', '2026-02-03 11:11:07', '2026-02-03 11:11:59');

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
(25, 'Hỗ Trợ Sinh Hoạt Hàng Ngày', 'Giúp cụ ông/cụ bà ăn uống, vệ sinh', 'Hỗ trợ tắm rửa,\r\nthay đồ, \r\nvệ sinh cá nhân, \r\nhỗ trợ ăn uống \r\nnhắc nhở uống thuốc đúng giờ.', 'assets/uploads/services/6980d89d29da9.png', 400000.00, NULL, '8 giờ', 1, 0, '2026-02-02 22:14:31', '2026-02-03 11:12:37'),
(26, 'Theo Dõi Huyết Áp &amp; Đường Huyết', 'Kiểm tra chỉ số sức khỏe định kỳ', 'Thực hiện đo huyết áp, \r\nnhịp tim, \r\nđường huyết  \r\nghi chép nhật ký sức khỏe hàng ngày.', 'assets/uploads/services/6980d8ed81af4.png', 150000.00, 200000.00, '30 phút', 2, 1, '2026-02-02 22:14:31', '2026-02-03 00:03:41'),
(27, 'Bầu Bạn &amp; Trò Chuyện', 'Chăm sóc sức khỏe tinh thần', 'Cùng đi dạo\r\ntrò chuyện\r\nđọc báo\r\ngiúp người già tránh cảm giác cô đơn và trầm cảm.', 'assets/uploads/services/6980d9208c7ae.png', 200000.00, NULL, '2 giờ', 3, 1, '2026-02-02 22:14:31', '2026-02-03 00:04:32'),
(28, 'Nấu Ăn Dinh Dưỡng Cho Bệnh Nhân', 'Chế độ ăn phù hợp bệnh lý', 'Lên thực đơn và chế biến món ăn dễ tiêu hóa\r\nphù hợp với người tiểu đường, cao huyết áp.', 'assets/uploads/services/6980d950b1744.png', 250000.00, NULL, '60 phút', 2, 1, '2026-02-02 22:14:31', '2026-02-03 00:05:20'),
(29, 'Trực Đêm Tại Bệnh Viện', 'Chăm sóc bệnh nhân xuyên đêm', 'Theo dõi dịch truyền\r\nhỗ trợ vệ sinh tại giường\r\nbáo gọi bác sĩ khi có tình huống khẩn cấp.', 'assets/uploads/services/6980d9781cdad.png', 600000.00, 750000.00, '12 giờ', 3, 1, '2026-02-02 22:14:31', '2026-02-03 00:06:00'),
(30, 'Vệ Sinh &amp; Thay Băng Vết Thương', 'Chăm sóc vết mổ đúng chuẩn y khoa', 'Thực hiện rửa vết thương\r\nthay băng và theo dõi tình trạng nhiễm trùng cho bệnh nhân.', 'assets/uploads/services/6980d996312e0.png', 200000.00, NULL, '45 phút', 3, 1, '2026-02-02 22:14:31', '2026-02-03 00:06:30'),
(31, 'Hỗ Trợ Di Chuyển &amp; Xe Lăn', 'Đưa bệnh nhân đi chụp chiếu/xét nghiệm', 'Hỗ trợ di chuyển an toàn từ phòng bệnh đến các phòng chức năng trong bệnh viện.', 'assets/uploads/services/6980d9c63c3a1.png', 100000.00, NULL, '60 phút', 3, 1, '2026-02-02 22:14:31', '2026-02-03 00:07:18'),
(32, 'Gói Chăm Sóc Toàn Diện 24/7', 'Phục vụ bệnh nhân cả ngày lẫn đêm', 'Bao gồm tất cả các hoạt động chăm sóc cơ bản và chuyên sâu tại giường bệnh.', 'assets/uploads/services/6980d9feec30b.png', 1100000.00, 1300000.00, '24 giờ', 3, 1, '2026-02-02 22:14:31', '2026-02-03 00:08:14'),
(33, 'Tập Vận Động Sau Tai Biến', 'Phục hồi khả năng đi lại', 'Bài tập kéo giãn cơ, tập đi, tập thăng bằng cho người bệnh sau đột quỵ.', 'assets/uploads/services/6980da217f995.png', 350000.00, 450000.00, '60 phút', 4, 1, '2026-02-02 22:14:31', '2026-02-03 00:08:49'),
(34, 'Vật Lý Trị Liệu Giảm Đau Cột Sống', 'Sử dụng kỹ thuật chuyên môn', 'Xoa bóp, bấm huyệt và các bài tập chuyên biệt cho người thoát vị đĩa đệm, đau lưng.', 'assets/uploads/services/6980da3d4a351.png', 300000.00, NULL, '45 phút', 4, 1, '2026-02-02 22:14:31', '2026-02-03 00:09:17'),
(35, 'Tập Phục Hồi Chức Năng Tay', 'Luyện tập cử động tinh vi', 'Sử dụng công cụ hỗ trợ để phục hồi khả năng cầm nắm, viết chữ cho người bệnh.', 'assets/uploads/services/6980da664c39b.png', 250000.00, NULL, '60 phút', 4, 1, '2026-02-02 22:14:31', '2026-02-03 00:09:58'),
(36, 'Tư Vấn Bài Tập Tại Nhà', 'Hướng dẫn người thân hỗ trợ', 'Chuyên gia hướng dẫn các bài tập đơn giản để người thân có thể hỗ trợ bệnh nhân hằng ngày.', 'assets/uploads/services/6980da901b716.png', 200000.00, NULL, '30 phút', 4, 1, '2026-02-02 22:14:31', '2026-02-03 00:10:40');

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
(1, 'Dịch Vụ Chăm Sóc Người Bệnh', 'Các dịch vụ chăm sóc người bệnh tại nhà', 'user-nurse', 1, '2026-01-31 21:40:20'),
(2, 'Chăm Sóc Người Bệnh Tại Nhà', 'Dịch vụ hỗ trợ sinh hoạt và theo dõi sức khỏe cho người già tại nhà.', 'user-clock', 1, '2026-02-02 22:12:30'),
(3, 'Chăm Sóc Bệnh Nhân Tại Viện', 'Hỗ trợ chăm sóc, vệ sinh và ăn uống cho bệnh nhân đang điều trị tại bệnh viện.', 'hospital', 1, '2026-02-02 22:12:30'),
(4, 'Phục Hồi Chức Năng & Vật Lý Trị Liệu', 'Các bài tập và kỹ thuật hỗ trợ phục hồi vận động sau tai biến hoặc phẫu thuật.', 'walking', 1, '2026-02-02 22:12:30');

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
(1, 'admin', 'admin@mamacore.com', '$2y$10$0jNRVC4uYk6arWOtB/Q8b.nTniOnW7rzngpHlKBHS8ACNsrQVlMlW', 'Admin', NULL, NULL, NULL, 'admin', 'active', '2026-01-31 11:53:00', '2026-02-03 00:12:56');

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
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

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
