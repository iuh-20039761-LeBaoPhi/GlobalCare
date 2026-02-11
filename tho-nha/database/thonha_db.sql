-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Feb 02, 2026 at 07:39 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `thonha_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `admins`
--

CREATE TABLE `admins` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `admins`
--

INSERT INTO `admins` (`id`, `username`, `password`) VALUES
(2, 'admin', '$2y$10$6bCPfmuIzA8RXWyVsGHS9eBK8erfGyEt6OjQt7ClA4u7WtyHbfkeO');

-- --------------------------------------------------------

--
-- Table structure for table `bookings`
--

CREATE TABLE `bookings` (
  `id` int(11) NOT NULL,
  `order_code` varchar(30) DEFAULT NULL,
  `customer_name` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `note` text DEFAULT NULL,
  `status` enum('new','confirmed','doing','done','cancel') DEFAULT 'new',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `bookings`
--

INSERT INTO `bookings` (`id`, `order_code`, `customer_name`, `phone`, `address`, `note`, `status`, `created_at`) VALUES
(7, 'TN709918', 'Nông Quốc Thương', '0394371259', 'Số 11  Phan Văn Trị', 'aa', 'cancel', '2026-01-22 07:28:30'),
(8, 'TN417873', 'Nông Quốc Thương', '0123456789', 'Số 11  Phan Văn Trị', 'aaa', 'new', '2026-01-22 07:31:23'),
(9, 'TN672259', 'Nông Quốc Thương', '0394371259', 'Số 11  Phan Văn Trị', '', 'new', '2026-01-22 07:32:20'),
(10, 'TN188042', 'Nông Quốc Thu', '0987654321', 'Gò Vấp', 'no', 'confirmed', '2026-01-25 08:36:23'),
(11, 'TN516460', 'thuong', '0987654321', 'Gò Vấp', 'ko', 'cancel', '2026-01-27 04:27:33'),
(12, 'TN735188', 'Nông Quốc Thương', '0394371259', 'Lê đức thọ', '99', 'cancel', '2026-01-28 04:11:00'),
(13, 'TN376090', 'Nông Quốc Thương', '0394371259', 'aa', 'a', 'cancel', '2026-01-28 04:34:07');

-- --------------------------------------------------------

--
-- Table structure for table `booking_services`
--

CREATE TABLE `booking_services` (
  `id` int(11) NOT NULL,
  `booking_id` int(11) DEFAULT NULL,
  `service_id` int(11) DEFAULT NULL,
  `price` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `booking_services`
--

INSERT INTO `booking_services` (`id`, `booking_id`, `service_id`, `price`) VALUES
(1, 1, 1, '300000'),
(2, 2, 10, '1500000'),
(3, 3, 1, '300000'),
(4, 3, 2, '450000'),
(5, 4, 5, '250000'),
(6, 5, 9, '250000'),
(7, 6, 3, '1200000'),
(8, 7, 6, '900000'),
(9, 8, 9, '250000'),
(10, 9, 8, '200000'),
(11, 10, 3, '1200000'),
(12, 11, 12, '200000'),
(13, 12, 6, '900000'),
(14, 13, 7, '350000');

-- --------------------------------------------------------

--
-- Table structure for table `cancel_requests`
--

CREATE TABLE `cancel_requests` (
  `id` int(11) NOT NULL,
  `booking_id` int(11) NOT NULL,
  `cancel_reason` text NOT NULL,
  `cancel_status` enum('pending','approved','rejected') DEFAULT 'pending',
  `cancel_requested_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `cancel_processed_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `cancel_requests`
--

INSERT INTO `cancel_requests` (`id`, `booking_id`, `cancel_reason`, `cancel_status`, `cancel_requested_at`, `cancel_processed_at`) VALUES
(1, 9, 'aa', 'pending', '2026-01-27 05:51:14', NULL),
(2, 7, 'aa', 'approved', '2026-01-27 05:54:34', '2026-01-27 06:00:42'),
(3, 11, 'aa', 'approved', '2026-01-27 06:23:49', '2026-01-29 09:59:14');

-- --------------------------------------------------------

--
-- Table structure for table `services`
--

CREATE TABLE `services` (
  `id` int(11) NOT NULL,
  `category_id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL,
  `price` varchar(50) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `services`
--

INSERT INTO `services` (`id`, `category_id`, `name`, `price`, `description`, `is_active`) VALUES
(1, 1, 'Vệ sinh máy lạnh', '300000', 'Vệ sinh toàn bộ dàn lạnh và dàn nóng, làm sạch bụi bẩn, giúp máy lạnh hoạt động hiệu quả và tiết kiệm điện.', 1),
(2, 1, 'Nạp gas máy lạnh', '450000', 'Nạp gas đúng loại và đúng áp suất, xử lý thiếu gas giúp máy lạnh làm mát nhanh và ổn định.', 1),
(3, 1, 'Thay block máy lạnh', '1200000', 'Thay block (máy nén) mới cho máy lạnh khi block cũ bị hư, kém lạnh hoặc không hoạt động.', 1),
(4, 1, 'Di dời máy lạnh', '500000', 'Tháo lắp, di chuyển máy lạnh sang vị trí mới an toàn, đảm bảo kỹ thuật và thẩm mỹ.', 1),
(5, 2, 'Sửa máy giặt không vắt', '280000', 'Khắc phục tình trạng máy giặt không vắt, vắt yếu do lỗi motor, dây curoa hoặc bo mạch.', 1),
(6, 2, 'Thay motor máy giặt', '900000', 'Thay motor máy giặt chính hãng, giúp máy giặt hoạt động mạnh mẽ và ổn định trở lại.', 1),
(7, 2, 'Vệ sinh máy giặt', '350000', 'Vệ sinh lồng giặt, loại bỏ cặn bẩn, vi khuẩn và mùi hôi, bảo vệ sức khỏe gia đình.', 1),
(8, 3, 'Thông tắc bồn cầu', '200000', 'Xử lý nhanh tình trạng bồn cầu bị nghẹt, thoát nước kém bằng thiết bị chuyên dụng.', 1),
(9, 3, 'Sửa bồn cầu rò nước', '250000', 'Sửa chữa bồn cầu bị rò rỉ nước, chảy nước liên tục gây lãng phí và mất vệ sinh.', 1),
(10, 3, 'Chống thấm nhà vệ sinh', '1500000', 'Chống thấm triệt để nhà vệ sinh, ngăn thấm nước, ẩm mốc và hư hỏng kết cấu.', 1),
(11, 4, 'Sửa chập điện', '180000', 'Sửa chữa sự cố chập điện, mất điện cục bộ, đảm bảo an toàn cho hệ thống điện gia đình.', 1),
(12, 4, 'Sửa rò rỉ nước', '200000', 'Xử lý rò rỉ nước âm tường, đường ống nước bị bể, xì nước nhanh chóng và hiệu quả.', 1),
(13, 4, 'Thay đường ống nước', '400000', 'Thay mới đường ống nước cũ, hư hỏng, đảm bảo nguồn nước sạch và ổn định.', 1),
(14, 5, 'Sửa tủ lạnh', '300000', 'Sửa chữa các lỗi thường gặp ở tủ lạnh như không lạnh, kêu to, chảy nước.', 1),
(15, 5, 'Sửa tivi', '250000', 'Sửa tivi bị mất hình, mất tiếng, không lên nguồn với đội ngũ kỹ thuật chuyên nghiệp.', 1),
(16, 5, 'Sửa bếp từ', '350000', 'Sửa chữa bếp từ không nóng, báo lỗi, không nhận nồi, đảm bảo an toàn khi sử dụng.', 1),
(17, 6, 'Sơn nhà', '5000000', 'Sơn mới hoặc sơn lại nhà ở, căn hộ với vật liệu chất lượng cao, bền đẹp theo thời gian.', 1),
(18, 6, 'Trần thạch cao', '7000000', 'Thi công trần thạch cao thẩm mỹ, cách âm, cách nhiệt, phù hợp nhà ở và văn phòng.', 1),
(19, 6, 'Lát nền gạch', '6000000', 'Lát nền gạch chuyên nghiệp, thẳng đẹp, bền chắc cho nhà ở và công trình.', 1);

-- --------------------------------------------------------

--
-- Table structure for table `service_categories`
--

CREATE TABLE `service_categories` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `service_categories`
--

INSERT INTO `service_categories` (`id`, `name`, `description`, `is_active`) VALUES
(1, 'Sửa máy lạnh', 'Các dịch vụ sửa chữa máy lạnh', 1),
(2, 'Sửa máy giặt', NULL, 1),
(3, 'Nhà vệ sinh', NULL, 1),
(4, 'Điện nước', NULL, 1),
(5, 'Đồ gia dụng', NULL, 1),
(6, 'Cải tạo nhà', NULL, 1);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admins`
--
ALTER TABLE `admins`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- Indexes for table `bookings`
--
ALTER TABLE `bookings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `order_code` (`order_code`);

--
-- Indexes for table `booking_services`
--
ALTER TABLE `booking_services`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `cancel_requests`
--
ALTER TABLE `cancel_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `booking_id` (`booking_id`);

--
-- Indexes for table `services`
--
ALTER TABLE `services`
  ADD PRIMARY KEY (`id`),
  ADD KEY `category_id` (`category_id`);

--
-- Indexes for table `service_categories`
--
ALTER TABLE `service_categories`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admins`
--
ALTER TABLE `admins`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `bookings`
--
ALTER TABLE `bookings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `booking_services`
--
ALTER TABLE `booking_services`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `cancel_requests`
--
ALTER TABLE `cancel_requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `services`
--
ALTER TABLE `services`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `service_categories`
--
ALTER TABLE `service_categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `cancel_requests`
--
ALTER TABLE `cancel_requests`
  ADD CONSTRAINT `cancel_requests_ibfk_1` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `services`
--
ALTER TABLE `services`
  ADD CONSTRAINT `services_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `service_categories` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
