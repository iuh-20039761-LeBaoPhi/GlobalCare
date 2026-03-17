# Giao Hàng Nhanh - Hệ thống quản lý vận chuyển chuyên biệt

Giao Hàng Nhanh là nền tảng logistics và giao nhận hàng hóa (Shipper) được xây dựng với kiến trúc Frontend tĩnh kết hợp Backend PHP + MySQL. Hệ thống tập trung cung cấp giải pháp đặt đơn, tra cứu vận đơn, và quản lý giao nhận cho khách hàng cá nhân, shipper và quản trị viên.

## Đặc điểm Hệ thống

- Trang chủ độc lập: `index.html` (Landing page giới thiệu dịch vụ, tính cước siêu tốc, theo dõi đơn hàng mã vạch).
- Xử lý nghiệp vụ: Đặt tại thư mục `public/*.php` (Authentication, Xử lý đơn, Thống kê).
- Quản lý trạng thái và UI: Framework JS thuần tối ưu đặt tại `public/assets/js`. Modular hóa mạnh mẽ.
- Pop-up thông minh: Mọi thao tác chọn dịch vụ mở modal trung tâm `public/assets/partials/shared-modals.html`.
- **Hệ thống Tin tức & Hướng dẫn**: Module bài viết tĩnh (`news-data.json`) hỗ trợ SEO, tìm kiếm, lọc theo Tags và gợi ý bài viết liên quan.
- **Tối ưu hóa Cơ sở dữ liệu**: Dữ liệu cấu hình tĩnh (quy định dịch vụ, thiết lập hệ thống) được quản lý qua JSON phía Frontend, giảm tải Database và tránh xung đột dữ liệu.

## Trải nghiệm người dùng cải tiến

- **Luồng đặt đơn linh hoạt**:
  - Khách vãng lai (Guest) có thể tham khảo bảng giá và điền đơn ngay lập tức.
  - Hệ thống chỉ yêu cầu xác thực (Login/Register) ở bước cuối cùng trước khi chốt đơn.
  - Tự động lưu trạng thái bảo toàn dữ liệu thao tác sau khi đăng nhập thành công.
- **Tính cước thời gian thực & Hiển thị minh bạch**:
  - Giao diện báo giá tự động (Real-time Calculator) khi thay đổi khu vực nội thành/ngoại thành/quốc tế và cân nặng.
  - Trình bày tách rời chi tiết các khoản phí (Phí vận chuyển gốc, Phụ phí bảo hiểm hàng hóa, Tiền thu hộ COD, Phí vượt kích cỡ) cho tất cả góc nhìn (Customer, Shipper, Admin) để người dùng dễ đối chiếu.
- **Đa dạng Phương thức Vận chuyển**:
  - Tích hợp thêm UI/UX tiện lợi: Hỗ trợ nút Back riêng trên nền tảng di động và hiển thị Icon sinh động.
  - Nội địa: Giao Tiêu Chuẩn, Giao Nhanh, Hỏa Tốc.
  - Quốc tế: Tiêu chuẩn quốc tế, Chuyển phát nhanh. Tự động tắt tính năng COD (thu hộ) đối với đơn xuất ngoại.

## Phân quyền & Vai trò (Role-based functions)

### 1) Khách vãng lai (Guest)

- Mở bảng tính cước nhanh tính phí trước khi đặt.
- Kiểm tra lộ trình đơn hàng từ đối tác qua mã bưu phẩm.
- Truy cập FAQ, tư vấn và các thông tin dịch vụ.

### 2) Khách hàng (Customer)

- Quản lý danh bạ địa chỉ nhận hàng/ gửi hàng.
- Theo dõi đơn hàng đã tạo, tải In bill PDF/Mã vạch cho từng kiện.
- Cập nhật hồ sơ người dùng.

### 3) Đối tác Giao nhận (Shipper)

- Bảng điều khiển (Dashboard) tiếp nhận đơn hàng phân bổ dựa trên khu vực.
- Cập nhật tiến trình: "Đang lấy hàng", "Đang giao", "Hoàn thành".
- Upload hình ảnh bằng chứng giao hàng (POD).

### 4) Quản trị viên (Admin)

- Dashboard phân tích chỉ số kinh doanh, tỷ lệ giao thành công.
- Quản lý mạng lưới khách hàng, thiết lập giá sàn, cước vận chuyển động.
- Duyệt đối tác tài xế mới, phân phối công việc.
- Quản lý Luồng xử lý đơn hàng đa dạng: Hỗ trợ xử lý thông tin Xuất Hóa đơn điện tử (VAT) cho doanh nghiệp, tra cứu chi tiết mặt hàng, và lộ trình gửi hàng quốc tế.

## Logic tính cước & Thuật toán

- Sử dụng Module `pricing-data.js` kết xuất dữ liệu phân vùng cấp ba (Tỉnh/Thành ➔ Quận/Huyện ➔ Phường/Xã) từ `QUOTE_SHIPPING_DATA`.
- Phí = [Giá gốc gói dịch vụ] + [Phụ thu khối lượng vượt mức] + [Dung sai thể tích VWA] + [Bảo hiểm giá trị] + [COD]
- Quốc tế: Tính theo phân nhóm Vùng lãnh thổ (Zone-based Pricing) phụ thuộc thủ tục hải quan và phụ phí nhiên liệu bay.

## Cấu trúc Thư mục

```text
Web shipper/
├── index.html
├── public/bai-viet.html            # Trang danh sách tin tức
├── public/bai-viet-chi-tiet.html   # Trang chi tiết bài viết
├── README.md
├── config/
│   ├── db.php
│   └── settings_helper.php
├── database/
│   └── shipper_db.sql
├── includes/
│   ├── header.php / footer.php
│   └── header.html / footer.html
└── public/
    ├── assets/
    │   ├── css/          # Các tệp phong cách theo module (landing, dashboard, modal, ...)
    │   ├── js/           # Các script nghiệp vụ (Core logic, Order, Tracking, Chart)
    │   ├── data/news-data.json # Dữ liệu bài viết & hướng dẫn
    │   ├── images/
    │   └── partials/shared-modals.html
    ├── \*.php             # (login, register, order, profile...)
    ├── dashboard.php / shipper_dashboard.php / admin_stats.php
    └── ...các trang quản lý người dùng tương ứng
```

## Các API Endpoint phổ biến (AJAX)

- `public/login_ajax.php` / `public/register_ajax.php`: Xác thực JWT / Session.
- `public/tracking_ajax.php`: Trả về mốc thời gian hành trình kiện hàng.
- `public/order.php`: Bóc tách payload tính phí, lưu vào cơ sở dữ liệu và Push Notification đến shipper.
- `public/cancel_order_ajax.php`: Xử lý hủy đơn hàng từ phía người dùng (chỉ đơn pending).
- `public/webhook_payment.php`: Cổng Webhook nhận thông báo thanh toán tự động từ ngân hàng/cổng thanh toán.
