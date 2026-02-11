-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Máy chủ: 127.0.0.1
-- Thời gian đã tạo: Th2 03, 2026 lúc 05:10 PM
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
-- Cơ sở dữ liệu: `csng`
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
(7, 21, NULL, 'Huy Lê Quang', '0373532588', 'huyq46532@gmail.com', 'ok', '2026-02-03 11:41:24', 'completed', 'paid', '2026-02-03 11:41:24', '2026-02-03 11:42:08');

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
(13, 'Hỗ Trợ Vệ Sinh Cá Nhân', 'Tắm rửa và thay đồ tại giường', 'Giúp người già vệ sinh cá nhân, \r\ntắm rửa an toàn, \r\ncắt móng tay chân và thay trang phục sạch sẽ.', 'assets/uploads/services/6980de06756dc.png', 250000.00, NULL, '60 phút', 1, 0, '2026-02-02 22:17:39', '2026-02-03 11:42:41'),
(14, 'Đồng Hành &amp; Trò Chuyện', 'Giảm bớt sự cô đơn cho người già', 'Nhân viên đến tâm sự, \r\nđọc sách, \r\nnghe nhạc \r\ncùng người già để cải thiện tâm lý và trí nhớ.', 'assets/uploads/services/6980de2ce08a3.png', 150000.00, 200000.00, '2 giờ', 1, 1, '2026-02-02 22:17:39', '2026-02-03 00:26:04'),
(15, 'Đi Chợ &amp; Nấu Ăn Theo Chế Độ', 'Chuẩn bị bữa ăn dinh dưỡng', 'Lựa chọn thực phẩm tươi ngon và nấu các món ăn phù hợp với khẩu vị và khả năng nhai của người già.', 'assets/uploads/services/6980de72d8add.png', 200000.00, NULL, '90 phút', 1, 1, '2026-02-02 22:17:39', '2026-02-03 00:27:14'),
(16, 'Hỗ Trợ Vận Động Nhẹ Nhàng', 'Dìu đi dạo và tập thể dục', 'Hỗ trợ người già đi lại quanh nhà hoặc công viên, \r\ntập các động tác dưỡng sinh cơ bản.', 'assets/uploads/services/6980de9657fd2.png', 180000.00, NULL, '45 phút', 1, 1, '2026-02-02 22:17:39', '2026-02-03 00:27:50'),
(17, 'Đặt Lịch &amp; Nhắc Thuốc Định Kỳ', 'Đảm bảo uống thuốc đúng liều', 'Quản lý tủ thuốc cá nhân và nhắc nhở hoặc hỗ trợ người già uống thuốc đúng giờ, \r\nđúng liều lượng.', 'assets/uploads/services/6980debaab517.png', 100000.00, NULL, 'Hàng ngày', 2, 1, '2026-02-02 22:17:39', '2026-02-03 00:28:26'),
(18, 'Theo Dõi Chỉ Số Sinh Tồn', 'Đo huyết áp, tim mạch, SpO2', 'Kiểm tra và ghi chép các chỉ số sức khỏe cơ bản mỗi ngày để báo cáo cho bác sĩ hoặc người thân.', 'assets/uploads/services/6980dee6878c8.png', 150000.00, 180000.00, '30 phút', 2, 1, '2026-02-02 22:17:39', '2026-02-03 00:29:10'),
(19, 'Thay Băng &amp; Rửa Vết Loét', 'Chăm sóc vết thương nằm lâu', 'Vệ sinh và thay băng chuyên dụng cho người già nằm lâu ngày bị loét tì đè hoặc vết thương mãn tính.', 'assets/uploads/services/6980df0ab40c5.png', 300000.00, NULL, '45 phút', 2, 1, '2026-02-02 22:17:39', '2026-02-03 00:29:46'),
(20, 'Hỗ Trợ Thở Oxy Tại Nhà', 'Vận hành máy thở và bình oxy', 'Hướng dẫn và theo dõi việc sử dụng máy tạo oxy hoặc bình oxy cho người già gặp khó khăn về hô hấp.', 'assets/uploads/services/6980df3d1f648.png', 350000.00, 400000.00, '60 phút', 2, 1, '2026-02-02 22:17:39', '2026-02-03 00:30:37'),
(21, 'Phục Hồi Dinh Dưỡng Sau Ốm', 'Chăm sóc từ bữa ăn đến giấc ngủ', 'Gói hỗ trợ đặc biệt giúp người già lấy lại thể trạng thông qua chế độ ăn bồi bổ và nghỉ ngơi khoa học.', 'assets/uploads/services/6980df6dcbc4a.png', 500000.00, 600000.00, '3 giờ', 3, 1, '2026-02-02 22:17:39', '2026-02-03 00:31:25'),
(22, 'Tập Lý Trị Liệu Tại Nhà', 'Khôi phục vận động cơ bản', 'Kỹ thuật viên hướng dẫn các bài tập vật lý trị liệu để người già sớm vận động lại bình thường.', 'assets/uploads/services/6980df9fdd06c.png', 450000.00, NULL, '60 phút', 3, 1, '2026-02-02 22:17:39', '2026-02-03 00:32:15'),
(23, 'Theo Dõi Biến Chứng Sau Phẫu Thuật', 'Quan sát và xử lý dấu hiệu bất thường', 'Điều dưỡng chuyên môn theo dõi các dấu hiệu sốt, sưng tấy hoặc biến chứng để can thiệp kịp thời.', 'assets/uploads/services/6980dfd810a8a.png', 400000.00, NULL, '90 phút', 3, 1, '2026-02-02 22:17:39', '2026-02-03 00:33:12'),
(24, 'Gói Chăm Sóc Toàn Diện 7 Ngày', 'Hỗ trợ hồi phục cấp tốc', 'Sự kết hợp giữa y tế và sinh hoạt giúp người già nhanh chóng ổn định sức khỏe sau đợt điều trị dài.', 'assets/uploads/services/6980e034d70dc.png', 3000000.00, 3500000.00, '7 ngày', 3, 1, '2026-02-02 22:17:39', '2026-02-03 00:34:44');

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
(1, 'Chăm Sóc Người Già Tại Nhà', 'Hỗ trợ toàn diện các hoạt động sống và tinh thần cho người cao tuổi.', 'elderly', 1, '2026-02-02 22:16:49'),
(2, 'Hỗ Trợ Y Tế & Điều Dưỡng', 'Dịch vụ y tế chuyên biệt dành cho người già có bệnh nền hoặc sức yếu.', 'user-nurse', 1, '2026-02-02 22:16:49'),
(3, 'Gói Chăm Sóc Sau Xuất Viện', 'Chăm sóc đặc biệt giúp người già hồi phục nhanh sau khi điều trị tại viện.', 'home-heart', 1, '2026-02-02 22:16:49');

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
(1, 'admin', 'admin@mamacore.com', '$2y$10$0jNRVC4uYk6arWOtB/Q8b.nTniOnW7rzngpHlKBHS8ACNsrQVlMlW', 'Admin', NULL, NULL, NULL, 'admin', 'active', '2026-01-31 11:53:00', '2026-02-03 00:12:48');

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
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT cho bảng `service_category`
--
ALTER TABLE `service_category`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

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
