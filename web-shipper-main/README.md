# 🚚 FastGo - Hệ Thống Quản Lý Vận Chuyển & Giao Hàng

> **FastGo** là một nền tảng web quản lý dịch vụ giao hàng (Logistics/Shipper) toàn diện, được xây dựng bằng **PHP thuần** và **MySQL**. Hệ thống mô phỏng quy trình vận hành thực tế của một công ty vận chuyển.

---

## 📋 Mục Lục

1. [Tổng Quan Dự Án](#-tổng-quan-dự-án)
2. [Tính Năng Nổi Bật](#-tính-năng-nổi-bật)
3. [Hướng Dẫn Cài Đặt](#-hướng-dẫn-cài-đặt)
4. [Thông Tin Thêm](#-thông-tin-thêm)

---

## 🌟 Tổng Quan Dự Án

Hệ thống được thiết kế để giải quyết các bài toán cốt lõi trong vận hành giao nhận:

- **Tự động hóa quy trình:** Khách đặt đơn -> Hệ thống ghi nhận -> Admin phân công -> Shipper nhận việc -> Giao hàng & Chụp ảnh bằng chứng (POD).
- **Minh bạch thông tin:** Khách hàng có thể theo dõi hành trình đơn hàng (Tracking Timeline) chi tiết từng phút.
- **Quản lý tập trung:** Admin nắm toàn bộ số liệu, doanh thu, hiệu suất nhân viên qua Dashboard trực quan.

### ✨ Tính năng nổi bật

- ✅ **Timeline Tracking:** Theo dõi trạng thái đơn hàng dạng dòng thời gian dọc (Vertical Timeline) hiện đại.
- ✅ **Proof of Delivery (POD):** Shipper cần tải lên ảnh chụp khi hoàn tất đơn hàng.
- ✅ **Tính giá tự động:** Hệ thống tự tính phí ship dựa trên khoảng cách (Nội/Ngoại thành), khối lượng và phí COD.
- ✅ **AJAX Experience:** Đăng nhập, Đăng ký, Tra cứu đơn hàng, Tính giá... đều xử lý không cần tải lại trang.
- ✅ **Responsive Design:** Giao diện tối ưu hoàn toàn cho Mobile (đặc biệt là giao diện Shipper).

---

## 🚀 Tính Năng Chi Tiết

Hệ thống phân chia thành 4 nhóm người dùng chính:

### 1. Khách Vãng Lai (Guest)

- **Trang chủ (Landing Page):** Giới thiệu dịch vụ, bảng giá, quy trình làm việc.
- **Tính giá cước nhanh (Quick Quote):** Công cụ ước tính phí vận chuyển dựa trên điểm đi/đến và loại dịch vụ (AJAX).
- **Tra cứu đơn hàng (Tracking):** Xem trạng thái đơn hàng bằng mã vận đơn mà không cần đăng nhập.
- **Hỏi đáp & Liên hệ:** Xem FAQ và gửi thắc mắc trực tuyến.
- **Đăng ký / Đăng nhập:** Hệ thống xác thực bảo mật (Popup Modal AJAX).

### 2. Khách Hàng (Customer)

- **Đặt hàng trực tuyến:** Form đặt hàng chi tiết, tự động điền thông tin cá nhân, hỗ trợ chọn dịch vụ (Tiêu chuẩn, Hỏa tốc, COD...).
  - **MỚI:** Hỗ trợ lưu thông tin xuất hóa đơn công ty.
  - **MỚI:** Tích hợp "Sổ địa chỉ" giúp chọn nhanh điểm giao/nhận.
- **Quản lý đơn hàng:**
  - **Thanh toán QR:** Tích hợp VietQR tự động tạo mã thanh toán chuyển khoản.
  - Xem lịch sử đơn hàng đã đặt.
  - Bộ lọc tìm kiếm theo trạng thái, ngày tháng.
  - **Đặt lại (Re-order):** Tạo đơn mới nhanh chóng từ thông tin đơn cũ.
- **Chi tiết đơn hàng:**
  - Xem **Timeline hành trình** chi tiết (Ngày giờ, trạng thái, ghi chú).
  - Xem ảnh bằng chứng giao hàng (POD) khi đơn hoàn tất.
  - **In hóa đơn:** Xuất phiếu gửi hàng để dán lên kiện hàng.
  - **Đánh giá & Phản hồi:** Chấm điểm sao và gửi nhận xét về dịch vụ.
- **Hồ sơ cá nhân:** Cập nhật thông tin, đổi mật khẩu.
- **Thông báo:** Nhận thông báo thời gian thực về trạng thái đơn hàng.
- **Sổ địa chỉ (Address Book):** Lưu và quản lý các địa chỉ thường dùng.

### 3. Tài Xế (Shipper)

- **Dashboard riêng biệt:**
  - Xem danh sách đơn hàng được Admin phân công.
  - Bộ lọc trạng thái: Chờ lấy hàng, Đang giao, Hoàn tất.
  - **Thông báo:** Nhận cảnh báo khi có đơn mới hoặc Admin thay đổi trạng thái.
- **Xử lý đơn hàng:**
  - Xem chi tiết: Địa chỉ (tích hợp link Google Maps), SĐT khách (Click-to-call).
  - **Cập nhật trạng thái:** Chuyển đổi trạng thái theo quy trình (Đã lấy -> Đang giao -> Hoàn tất/Hủy).
  - **Upload POD:** Bắt buộc chụp ảnh giao hàng thành công để hoàn tất đơn.
  - Ghi chú sự cố (Shipper Note).
- **Thống kê thu nhập:** Xem tổng số đơn đã giao, tổng thu nhập, tỷ lệ hoàn thành.
- **Quy trình xét duyệt:** Tài khoản Shipper mới cần được Admin phê duyệt trước khi bắt đầu nhận đơn.
- **Hồ sơ Shipper:** Cập nhật thông tin cá nhân và xem báo cáo hiệu suất chi tiết.

### 4. Quản Trị Viên (Admin)

- **Dashboard Thống kê (Analytics):**
  - KPIs: Tổng doanh thu, Tổng đơn hàng, Khách hàng mới.
  - Biểu đồ (Chart.js): Doanh thu 7 ngày gần nhất, Phân loại dịch vụ, Top khách hàng thân thiết.
- **Quản lý đơn hàng:**
  - Xem danh sách toàn bộ đơn hàng.
  - **Phân công Shipper:** Chỉ định tài xế cho từng đơn.
  - **Xử lý sự cố:** Có quyền Override (ghi đè) trạng thái, hoàn tiền (Refund) và ghi chú nội bộ.
  - Xem Log lịch sử thay đổi của đơn hàng.
- **Quản lý người dùng:**
  - Thêm/Sửa/Xóa/Phân quyền.
  - Duyệt tài khoản Shipper mới đăng ký.
  - Khóa/Mở khóa tài khoản vi phạm.
- **Quản lý Dịch vụ:** Thêm/Sửa/Xóa các gói cước và bảng giá.
- **Cấu hình hệ thống:** Cài đặt thông tin Ngân hàng (QR Code), Thông tin công ty.
- **Quản lý Nội dung:** Quản lý FAQ, Đánh giá (Testimonials) và Hộp thư liên hệ.
- **Quản lý Đánh giá (Testimonials):** Duyệt và hiển thị đánh giá tiêu biểu lên trang chủ.
- **Công cụ tính giá (Pricing Guide):** Trang mô phỏng công thức tính cước phí vận chuyển.

---

## Công Nghệ Sử Dụng

- **Backend:** PHP (Native - Không Framework) - Dễ dàng triển khai và tùy biến.
- **Database:** MySQL (Sử dụng Prepared Statements để bảo mật).
- **Frontend:** HTML5, CSS3 (Flexbox/Grid), JavaScript (Vanilla).
- **Thư viện:**
  - `Chart.js`: Vẽ biểu đồ thống kê.
  - `Google Fonts`: Font Poppins & Inter.
- **Kỹ thuật nổi bật:**
  - **AJAX:** Xử lý bất đồng bộ cho trải nghiệm mượt mà.
  - **Security:** Password Hashing (Bcrypt), chống SQL Injection, XSS Protection.
  - **Session Management:** Quản lý phiên đăng nhập và phân quyền.

---

## 🗄 Cơ Sở Dữ Liệu

Hệ thống sử dụng các bảng chính:

1.  **`users`**: Lưu thông tin người dùng (Admin, Shipper, Customer).
2.  **`orders`**: Lưu thông tin đơn hàng (Mã đơn, người gửi/nhận, trạng thái, phí ship, COD, ảnh POD...).
3.  **`services`**: Lưu cấu hình các gói dịch vụ và giá cước cơ bản.
4.  **`order_logs`**: Lưu lịch sử thay đổi trạng thái của đơn hàng (Ai đổi? Đổi khi nào? Từ trạng thái nào sang trạng thái nào?).
5.  **`contact_messages`**: Lưu tin nhắn liên hệ và khiếu nại.
6.  **`saved_addresses`**: Lưu sổ địa chỉ của khách hàng.
7.  **`testimonials`**: Lưu đánh giá và phản hồi hiển thị công khai.
8.  **`notifications`**: Lưu thông báo hệ thống gửi đến người dùng.
9.  **`system_settings`**: Lưu cấu hình hệ thống (Ngân hàng, Thông tin công ty).
10. **`faqs`**: Lưu danh sách câu hỏi thường gặp.

---

## 💻 Hướng Dẫn Cài Đặt

### Yêu cầu hệ thống

- Web Server: XAMPP, WAMP, Laragon hoặc Docker.
- PHP Version: 7.4 trở lên.
- MySQL/MariaDB.

### Các bước cài đặt

1.  **Clone dự án:**
    Tải mã nguồn về thư mục `htdocs` (XAMPP) hoặc `www` (WAMP).

2.  **Cài đặt Database:**
    - Mở phpMyAdmin (thường là `http://localhost/phpmyadmin`).
    - Tạo database mới tên: `shipper_db`.
    - Import file `database.sql` (đã đính kèm trong mã nguồn) vào database vừa tạo.

3.  **Cấu hình kết nối:**
    Mở file `config/db.php` và chỉnh sửa thông tin:

    ```php
    $host = "localhost";
    $user = "root";      // Username database
    $pass = "";          // Password database
    $db = "shipper_db";  // Tên database
    ```

4.  **Tạo tài khoản Admin:**
    - Đăng ký một tài khoản mới qua giao diện web.
    - Vào phpMyAdmin, bảng `users`, sửa cột `role` của tài khoản vừa tạo thành `admin`.

5.  **Chạy dự án:**
    - Tạo thư mục `uploads/` tại thư mục gốc để lưu ảnh bằng chứng giao hàng (POD).
    - Đảm bảo thư mục này có quyền ghi (Write permission).
      Truy cập `http://localhost/Web%20shipper/` (hoặc đường dẫn tương ứng).

---

## 💡 Logic tính phí (tham khảo)

Giá cước được tính dựa trên các yếu tố sau:

- **Giá cơ bản:**
  - Giao tiêu chuẩn: 30.000đ
  - Giao hỏa tốc: 50.000đ
- **Phụ phí (có thể có):**
  - Phí COD: 1% giá trị đơn hàng (tối thiểu 5.000đ)
  - Phí cân nặng: +5.000đ/kg (áp dụng cho các đơn hàng > 2kg)

_Lưu ý: Giá trên chỉ mang tính chất tham khảo và có thể thay đổi._

---

## ℹ️ Thông tin thêm

<details>
<summary><b>Tài khoản Demo</b></summary>
<br>

| Vai trò  | Tên đăng nhập | Mật khẩu |
| -------- | ------------- | -------- |
| Admin    | `admin`       | `123456` |
| Shipper  | `Thien`       | `123456` |
| Customer | `Anguyen`     | `291503` |

> _Lưu ý: Bạn cần tạo các tài khoản này thủ công hoặc import file `database.sql` có sẵn._

</details>

<details>
<summary><b>Công nghệ & Kỹ thuật</b></summary>
<br>

- **Backend:** **PHP** (Native - Không Framework).
- **Database:** **MySQL** (Sử dụng **Prepared Statements** để chống SQL Injection).
- **Frontend:** HTML5, CSS3 (Flexbox/Grid), **JavaScript** (Vanilla).
- **Kỹ thuật nổi bật:**
  - **AJAX:** Xử lý bất đồng bộ cho đăng nhập, đăng ký, tra cứu, tính giá...
  - **Bảo mật:** Password Hashing (**Bcrypt**), chống XSS, Session Fixation.
  - **Responsive Design:** Tối ưu giao diện cho Mobile, Tablet và Desktop.

</details>

<details>
<summary><b>Cấu trúc thư mục</b></summary>
<br>

```
Web shipper/
├──  assets/                  # Tài nguyên tĩnh (CSS, JS, Images)
├──  config/                  # Cấu hình hệ thống (db.php)
├──  includes/                # Các đoạn mã dùng chung (Header, Footer)
│
├──  index.php                # Trang chủ (Landing Page)
├──  login.php / register.php # Trang đăng nhập / đăng ký
├──  tracking.php             # Trang tra cứu đơn hàng công khai
│
├──  dashboard.php            # Dashboard Khách hàng & Lịch sử đơn
├──  order.php                # File xử lý tạo đơn hàng
│
├──  shipper_dashboard.php    # Dashboard cho Shipper
├──  shipper_order_detail.php # Chi tiết & Xử lý đơn của Shipper
│
├──  orders_manage.php        # Quản lý toàn bộ đơn hàng (Admin)
├──  users_manage.php         # Quản lý người dùng (Admin)
├──  services_manage.php      # Quản lý dịch vụ & giá cước (Admin)
├──  admin_settings.php       # Cấu hình hệ thống (Admin)
│
└── ... (các file xử lý AJAX và chi tiết khác)
```

</details>

<details>
<summary><b>Cơ sở dữ liệu</b></summary>
<br>

Hệ thống sử dụng 4 bảng chính:

1.  **`users`**: Lưu thông tin người dùng (Admin, Shipper, Customer).
2.  **`orders`**: Lưu thông tin đơn hàng (Mã đơn, người gửi/nhận, trạng thái, phí ship, COD, ảnh POD...).
3.  **`services`**: Lưu cấu hình các gói dịch vụ và giá cước cơ bản.
4.  **`order_logs`**: Lưu lịch sử thay đổi trạng thái của đơn hàng.

</details>

---

## 👤 Thông Tin Tác Giả

**Tên dự án:** FastGo - Nền tảng giao hàng  
**Phiên bản:** 1.2.1
**Ngày tạo:** 2026  
**Mục đích:** Dự án thực tập lập trình web

---

Cảm ơn bạn đã sử dụng FastGo! 🚀
