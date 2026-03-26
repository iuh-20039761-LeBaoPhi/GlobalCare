-- SCHEMA THUÊ XE V5 (ChuÃ¡n 3NF - KhÃ´ng DÆ° Thừa)
-- Bảng: loaixe (Loại xe), xemau (Mẫu xe), xechiec (Chiếc xe)
-- Booking minimal + Invoice riêng
 
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET NAMES utf8mb4;

DROP DATABASE IF EXISTS `car_rental`;
CREATE DATABASE IF NOT EXISTS `car_rental`
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `car_rental`;

-- 1. LOẠI XE (loaixe)
CREATE TABLE IF NOT EXISTS `loaixe` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `ten` VARCHAR(100) NOT NULL UNIQUE,
  `mota` TEXT,
  `trangthai` TINYINT(1) DEFAULT 1,
  INDEX `idx_trangthai` (`trangthai`)
) ENGINE=InnoDB CHARSET=utf8mb4;

INSERT INTO `loaixe` (`ten`, `mota`) VALUES
  ('Sedan', 'Xe sedan 4-5 chỗ'),
  ('SUV', 'Xe SUV 5-7 chỗ'),
  ('MPV', 'Xe MPV 7 chỗ'),
  ('Bán tải', 'Xe bán tải'),
  ('Điện', 'Xe điện thân thiện môi trường');

-- 2. MẦU XE (xemau) - TEMPLATE
CREATE TABLE IF NOT EXISTS `xemau` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `ten` VARCHAR(255) NOT NULL UNIQUE,
  `thuonghieu` VARCHAR(100) NOT NULL,
  `model` VARCHAR(100) NOT NULL,
  `namsanxuat` INT DEFAULT 2023,
  `idloaixe` INT NOT NULL,
  `socho` INT DEFAULT 5,
  `hopso` VARCHAR(50) DEFAULT 'Tự động',
  `nhienlieu` VARCHAR(50) DEFAULT 'Xăng',
  `giathue_ngay` DECIMAL(12,0) NOT NULL,
  `tiledatcoc` DECIMAL(5,4) DEFAULT 0.30,
  `anhchinh` VARCHAR(255),
  `mota_chitiet` TEXT,
  `trangthai` ENUM('active','inactive') DEFAULT 'active',
  `ngaytao` DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`idloaixe`) REFERENCES `loaixe` (`id`),
  INDEX `idx_idloaixe` (`idloaixe`)
) ENGINE=InnoDB CHARSET=utf8mb4;

INSERT INTO `xemau` (`ten`, `thuonghieu`, `model`, `idloaixe`, `giathue_ngay`) VALUES
  ('Toyota Camry 2023', 'Toyota', 'Camry', 1, 1200000),
  ('Honda City 2023', 'Honda', 'City', 1, 750000),
  ('Honda CR-V 2022', 'Honda', 'CR-V', 2, 1500000),
  ('VinFast VF8 2023', 'VinFast', 'VF8', 5, 1800000);

-- 3. CHIẾC XE (xechiec) - INSTANCE VẬT LÝ (4 chiếc Camry, 2 City, v.v.)
CREATE TABLE IF NOT EXISTS `xechiec` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `idxemau` INT NOT NULL,
  `bienso` VARCHAR(50) NOT NULL UNIQUE,
  `km_hientai` INT DEFAULT 0,
  `tinhrang` ENUM('hoatdong','baodoi','baoduong','thaihoc') DEFAULT 'hoatdong',
  `ngaytao` DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`idxemau`) REFERENCES `xemau` (`id`),
  INDEX `idx_idxemau` (`idxemau`)
) ENGINE=InnoDB CHARSET=utf8mb4;

-- 4 chiếc Toyota Camry 2023 (idxemau = 1)
INSERT INTO `xechiec` (`idxemau`, `bienso`, `tinhrang`) VALUES
  (1, '71A-12345', 'hoatdong'),
  (1, '71A-12346', 'hoatdong'),
  (1, '71A-12347', 'baodoi'),
  (1, '71A-12348', 'hoatdong'),
  (2, '71B-11111', 'hoatdong'),
  (2, '71B-11112', 'hoatdong'),
  (3, '71C-22222', 'hoatdong'),
  (4, '71E-44444', 'hoatdong');

-- 4. NGƯỜI DÙNG (nguoidung)
CREATE TABLE IF NOT EXISTS `nguoidung` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `hoten` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `sodienthoai` VARCHAR(20),
  `matkhau` VARCHAR(255),
  `vaitro` ENUM('admin','customer','provider') DEFAULT 'customer',
  `trangthai` ENUM('active','pending','blocked') DEFAULT 'active',
  `ngaytao` DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  INDEX `idx_email` (`email`)
) ENGINE=InnoDB CHARSET=utf8mb4;

INSERT INTO `nguoidung` (`hoten`, `email`, `sodienthoai`, `vaitro`) VALUES
  ('Quản trị viên', 'admin@thuexe.vn', '0775472347', 'admin'),
  ('Nguyễn Văn An', 'nguyenvanan@gmail.com', '0901234567', 'customer');

-- 5. DỊCH VỤ (dichvu)
CREATE TABLE IF NOT EXISTS `dichvu` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `ten` VARCHAR(255) NOT NULL UNIQUE,
  `icon` VARCHAR(100) DEFAULT 'star',
  `gia` DECIMAL(12,0) NOT NULL DEFAULT 0,
  `donvi` ENUM('ngay','chuyen') DEFAULT 'chuyen',
  `mota` TEXT,
  `trangthai` TINYINT(1) DEFAULT 1
) ENGINE=InnoDB CHARSET=utf8mb4;

INSERT INTO `dichvu` (`ten`, `gia`, `donvi`, `mota`) VALUES
  ('Giao xe tận nơi', 100000, 'chuyen', 'Giao tận nơi nội thành TP.HCM'),
  ('Bảo hiểm mở rộng', 150000, 'ngay', 'Gói bảo hiểm toàn diện'),
  ('Tài xế chuyên nghiệp', 300000, 'ngay', 'Tài xế có kinh nghiệm'),
  ('GPS định vị', 50000, 'chuyen', 'Thiết bị GPS dẫn đường');

-- 6. BOOKING (datxe) - CHỈ FK & THÔNG TIN ĐẶT
CREATE TABLE IF NOT EXISTS `datxe` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `idkhachhang` INT NOT NULL,
  `idxechiec` INT NOT NULL,
  `ngaynhan` DATE NOT NULL,
  `gionhan` TIME DEFAULT '08:00:00',
  `ngaytra` DATE NOT NULL,
  `gioratra` TIME DEFAULT '08:00:00',
  `diachinhan` VARCHAR(255),
  `ghichu` TEXT,
  `songay` INT GENERATED ALWAYS AS (DATEDIFF(ngaytra, ngaynhan)) STORED,
  `trangthai` ENUM('pending','confirmed','completed','cancelled') DEFAULT 'pending',
  `ngaytao` DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`idkhachhang`) REFERENCES `nguoidung` (`id`),
  FOREIGN KEY (`idxechiec`) REFERENCES `xechiec` (`id`),
  INDEX `idx_trangthai` (`trangthai`)
) ENGINE=InnoDB CHARSET=utf8mb4
  COMMENT='Booking MINIMAL - KHÔNG lưu giá tiền (để ở hóa đơn)';

INSERT INTO `datxe` (`idkhachhang`, `idxechiec`, `ngaynhan`, `ngaytra`, `diachinhan`, `trangthai`) VALUES
  (2, 1, '2026-02-26', '2026-03-01', '12 Nguyễn Huệ, Q.1', 'confirmed'),
  (2, 2, '2026-03-05', '2026-03-07', '45 Lê Lợi, Đà Nẵng', 'pending');

-- 7. DỊCH VỤ TRONG BOOKING (datxe_dichvu) - MANY-TO-MANY
CREATE TABLE IF NOT EXISTS `datxe_dichvu` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `iddatxe` INT NOT NULL,
  `iddichvu` INT NOT NULL,
  `soluong` INT DEFAULT 1,
  
  UNIQUE KEY `uq_datxe_dichvu` (`iddatxe`, `iddichvu`),
  FOREIGN KEY (`iddatxe`) REFERENCES `datxe` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`iddichvu`) REFERENCES `dichvu` (`id`)
) ENGINE=InnoDB CHARSET=utf8mb4;

INSERT INTO `datxe_dichvu` (`iddatxe`, `iddichvu`, `soluong`) VALUES
  (1, 1, 1),
  (1, 3, 4),
  (2, 2, 2);

-- 8. HÓA ĐƠN (hoadon) - SNAPSHOT GIỚI THANH TOÁN
CREATE TABLE IF NOT EXISTS `hoadon` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `iddatxe` INT NOT NULL UNIQUE,
  `sohoadon` VARCHAR(50) NOT NULL UNIQUE,
  `giathue_ngay_luc_dat` DECIMAL(12,0) NOT NULL,
  `songay` INT NOT NULL,
  `tamtinh` DECIMAL(12,0) NOT NULL,
  `tiendichvu` DECIMAL(12,0) DEFAULT 0,
  `tienvat` DECIMAL(12,0) DEFAULT 0,
  `tiendatcoc` DECIMAL(12,0) DEFAULT 0,
  `tongcuoi` DECIMAL(12,0) NOT NULL,
  `trangthai` ENUM('draft','da_phat_hanh','dathanhcoan','hoyhuy') DEFAULT 'draft',
  `ngayphathanh` DATETIME,
  `ngaythanhcoan` DATETIME,
  `ngaytao` DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`iddatxe`) REFERENCES `datxe` (`id`),
  INDEX `idx_trangthai` (`trangthai`)
) ENGINE=InnoDB CHARSET=utf8mb4;

-- 9. LIÊN HỆ (lienhe)
CREATE TABLE IF NOT EXISTS `lienhe` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `ten` VARCHAR(255) NOT NULL,
  `sodienthoai` VARCHAR(20) NOT NULL,
  `email` VARCHAR(255),
  `chude` VARCHAR(255),
  `noidung` TEXT NOT NULL,
  `dadoc` TINYINT(1) DEFAULT 0,
  `ngaytao` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB CHARSET=utf8mb4;

-- END SCHEMA V5
