<?php
/**
 * Booking Controller — v2
 *
 * P0 fixes:
 *  - Server tự đọc price_per_day / addon prices từ DB, bỏ qua giá client gửi.
 *  - Kiểm tra trùng lịch xe (status pending/confirmed) trước khi insert.
 *  - Gắn user_id từ session khi khách đăng nhập.
 *  - Gắn provider_id từ cars.provider_id.
 *
 * P1 additions:
 *  - Hỗ trợ pickup_time / return_time (giờ nhận/trả).
 *  - Lưu subtotal, tax_amount, deposit_amount, weekend_surcharge_amount, final_total.
 *  - Fallback tương thích schema cũ (khi migration_v2.sql chưa chạy).
 */

ini_set('display_errors', 0);
error_reporting(0);

// session phải khởi tạo trước khi gửi bất kỳ header nào
require_once __DIR__ . '/session.php';

header('Content-Type: application/json; charset=utf-8');
require_once '../config/database.php';

class BookingController {
    private $conn;

    public function __construct() {
        $db = new Database();
        $this->conn = $db->getConnection();
    }

    // ─────────────────────────────────────────────────────────────
    // POST ?action=create
    // ─────────────────────────────────────────────────────────────
    public function create() {
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            if (!is_array($data)) {
                echo json_encode(['success' => false, 'message' => 'Dữ liệu không hợp lệ']);
                return;
            }

            /* ── 1. Đọc user_id từ session ── */
            $user_id = (
                isset($_SESSION['user_id'], $_SESSION['user_role'])
                && $_SESSION['user_role'] === 'customer'
            ) ? (int)$_SESSION['user_id'] : null;

            /* ── 2. Validate input bắt buộc ── */
            $car_id      = (int)($data['car_id']      ?? 0);
            $pickup_date = trim($data['pickup_date']   ?? '');
            $return_date = trim($data['return_date']   ?? '');

            // Giờ nhận/trả: "HH:MM"; mặc định 08:00
            $pickup_time = preg_match('/^\d{2}:\d{2}$/', $data['pickup_time'] ?? '')
                               ? $data['pickup_time'] : '08:00';
            $return_time = preg_match('/^\d{2}:\d{2}$/', $data['return_time'] ?? '')
                               ? $data['return_time'] : '08:00';

            if (!$car_id || !$pickup_date || !$return_date) {
                echo json_encode(['success' => false, 'message' => 'Thiếu thông tin bắt buộc']);
                return;
            }

            /* ── 3. Validate datetime ── */
            $pickupDT = DateTime::createFromFormat('Y-m-d H:i', "$pickup_date $pickup_time");
            $returnDT = DateTime::createFromFormat('Y-m-d H:i', "$return_date $return_time");

            if (!$pickupDT || !$returnDT) {
                echo json_encode(['success' => false, 'message' => 'Ngày hoặc giờ không hợp lệ']);
                return;
            }
            if ($returnDT <= $pickupDT) {
                echo json_encode(['success' => false, 'message' => 'Thời gian trả xe phải sau thời gian nhận xe']);
                return;
            }
            if ($pickupDT < new DateTime('today')) {
                echo json_encode(['success' => false, 'message' => 'Ngày nhận xe không được ở quá khứ']);
                return;
            }

            $diff       = $pickupDT->diff($returnDT);
            $total_days = max(1, (int)$diff->days);

            /* ── 4. Lấy xe từ DB — KHÔNG tin giá từ client ── */
            $carStmt = $this->conn->prepare('SELECT * FROM `cars` WHERE `id` = :id LIMIT 1');
            $carStmt->execute([':id' => $car_id]);
            $car = $carStmt->fetch(PDO::FETCH_ASSOC);

            if (!$car) {
                echo json_encode(['success' => false, 'message' => 'Xe không tồn tại']);
                return;
            }
            if ($car['status'] !== 'available') {
                echo json_encode(['success' => false, 'message' => 'Xe hiện không còn khả dụng để đặt']);
                return;
            }

            $price_per_day = (float)$car['price_per_day'];
            // Fallback về default nếu migration chưa chạy
            $weekend_rate  = array_key_exists('weekend_surcharge_rate', $car)
                                 ? (float)$car['weekend_surcharge_rate'] : 0.10;
            $deposit_rate  = array_key_exists('deposit_rate', $car)
                                 ? (float)$car['deposit_rate'] : 0.30;
            $provider_id   = $car['provider_id'] ?? null;

            /* ── 5. Kiểm tra trùng lịch xe ── */
            $overlapStmt = $this->conn->prepare(
                "SELECT COUNT(*) FROM `bookings`
                 WHERE `car_id`      = :car_id
                   AND `status`      IN ('pending', 'confirmed')
                   AND `pickup_date` < :return_date
                   AND `return_date` > :pickup_date"
            );
            $overlapStmt->execute([
                ':car_id'      => $car_id,
                ':return_date' => $return_date,
                ':pickup_date' => $pickup_date,
            ]);
            if ((int)$overlapStmt->fetchColumn() > 0) {
                echo json_encode([
                    'success' => false,
                    'message' => 'Xe đã được đặt trong khoảng thời gian này. '
                               . 'Vui lòng chọn ngày khác hoặc gọi hotline 0775 472 347.',
                ]);
                return;
            }

            /* ── 6. Tính phụ thu cuối tuần ── */
            $weekend_days = 0;
            $cur  = new DateTime($pickup_date);
            $endD = new DateTime($return_date);
            while ($cur < $endD) {
                if ((int)$cur->format('N') >= 6) { // 6=Thứ Bảy, 7=Chủ Nhật
                    $weekend_days++;
                }
                $cur->modify('+1 day');
            }
            $weekend_surcharge_amount = (int)round($weekend_days * $price_per_day * $weekend_rate);

            /* ── 7. Tính addon từ DB — KHÔNG tin addon_total từ client ── */
            $addon_services_names = array_values(
                array_filter((array)($data['addon_services'] ?? []), 'is_string')
            );
            $addon_total_float = 0.0;

            if (!empty($addon_services_names)) {
                $ph      = implode(',', array_fill(0, count($addon_services_names), '?'));
                $svcStmt = $this->conn->prepare(
                    "SELECT `name`, `price`, `unit` FROM `services`
                     WHERE `name` IN ($ph) AND `status` = 1"
                );
                $svcStmt->execute($addon_services_names);
                foreach ($svcStmt->fetchAll(PDO::FETCH_ASSOC) as $svc) {
                    $unit = $svc['unit'] ?? 'chuyến'; // fallback trước khi migration chạy
                    $addon_total_float += ($unit === 'ngày')
                        ? (float)$svc['price'] * $total_days
                        : (float)$svc['price'];
                }
            }

            /* ── 8. Công thức tính tiền server-side ──
             *
             *   subtotal                = total_days × price_per_day
             *   weekend_surcharge       = weekend_days × price_per_day × weekend_rate
             *   addon_total             = Σ service.price (×days nếu unit='ngày')
             *   tax_base                = subtotal + weekend_surcharge + addon_total
             *   tax_amount              = ROUND(tax_base × 0.10)
             *   deposit_amount          = ROUND(subtotal × deposit_rate)   [chỉ thông tin]
             *   final_total             = subtotal + weekend_surcharge + addon_total
             *                            + tax_amount − discount_amount
             *   total_price             = final_total  (backward compat)
             */
            $subtotal         = (int)round($total_days * $price_per_day);
            $addon_total      = (int)round($addon_total_float);
            $tax_base         = $subtotal + $weekend_surcharge_amount + $addon_total;
            $tax_amount       = (int)round($tax_base * 0.10);
            $deposit_amount   = (int)round($subtotal * $deposit_rate);
            $discount_amount  = 0;
            $surcharge_amount = 0; // phụ phí trả trễ, cập nhật sau khi trả xe
            $final_total      = $subtotal + $weekend_surcharge_amount + $addon_total
                              + $tax_amount - $discount_amount;

            $addon_json = json_encode($addon_services_names, JSON_UNESCAPED_UNICODE);

            /* ── 9. INSERT ──
             * Thử với schema v2 (đầy đủ cột mới).
             * Nếu cột chưa tồn tại (migration chưa chạy) → fallback schema cũ.
             */
            $booking_id = null;

            try {
                $sql = "INSERT INTO `bookings` (
                            `user_id`, `provider_id`, `car_id`, `car_name`,
                            `customer_name`, `customer_email`, `customer_phone`, `customer_address`,
                            `id_number`, `pickup_date`, `return_date`, `pickup_time`, `return_time`,
                            `pickup_location`, `notes`,
                            `total_days`, `total_price`, `addon_services`, `addon_total`,
                            `subtotal`, `discount_amount`, `tax_amount`, `deposit_amount`,
                            `surcharge_amount`, `weekend_surcharge_amount`, `final_total`,
                            `status`
                        ) VALUES (
                            :user_id, :provider_id, :car_id, :car_name,
                            :name, :email, :phone, :address,
                            :id_number, :pickup, :return, :pickup_time, :return_time,
                            :location, :notes,
                            :days, :total_price, :addon_services, :addon_total,
                            :subtotal, :discount, :tax, :deposit,
                            :surcharge, :weekend_surcharge, :final_total,
                            'pending'
                        )";
                $stmt = $this->conn->prepare($sql);
                $stmt->execute([
                    ':user_id'           => $user_id,
                    ':provider_id'       => $provider_id,
                    ':car_id'            => $car_id,
                    ':car_name'          => $car['name'] ?? ($data['car_name'] ?? ''),
                    ':name'              => $data['customer_name']    ?? '',
                    ':email'             => $data['customer_email']   ?? '',
                    ':phone'             => $data['customer_phone']   ?? '',
                    ':address'           => $data['customer_address'] ?? '',
                    ':id_number'         => $data['id_number']        ?? '',
                    ':pickup'            => $pickup_date,
                    ':return'            => $return_date,
                    ':pickup_time'       => $pickup_time . ':00',
                    ':return_time'       => $return_time . ':00',
                    ':location'          => $data['pickup_location']  ?? '',
                    ':notes'             => $data['notes']            ?? '',
                    ':days'              => $total_days,
                    ':total_price'       => $final_total,   // backward compat
                    ':addon_services'    => $addon_json,
                    ':addon_total'       => $addon_total,
                    ':subtotal'          => $subtotal,
                    ':discount'          => $discount_amount,
                    ':tax'               => $tax_amount,
                    ':deposit'           => $deposit_amount,
                    ':surcharge'         => $surcharge_amount,
                    ':weekend_surcharge' => $weekend_surcharge_amount,
                    ':final_total'       => $final_total,
                ]);
                $booking_id = (int)$this->conn->lastInsertId();

            } catch (PDOException $insertErr) {
                // migration_v2.sql chưa chạy → fallback schema cũ
                $msg = $insertErr->getMessage();
                if (stripos($msg, 'Unknown column') !== false
                    || stripos($msg, "doesn't exist") !== false) {
                    $sql_fb = "INSERT INTO `bookings` (
                                    `user_id`, `provider_id`, `car_id`, `car_name`,
                                    `customer_name`, `customer_email`, `customer_phone`, `customer_address`,
                                    `id_number`, `pickup_date`, `return_date`,
                                    `pickup_location`, `notes`,
                                    `total_days`, `total_price`, `addon_services`, `addon_total`,
                                    `status`
                               ) VALUES (
                                    :user_id, :provider_id, :car_id, :car_name,
                                    :name, :email, :phone, :address,
                                    :id_number, :pickup, :return,
                                    :location, :notes,
                                    :days, :total_price, :addon_services, :addon_total,
                                    'pending'
                               )";
                    $stmt2 = $this->conn->prepare($sql_fb);
                    $stmt2->execute([
                        ':user_id'        => $user_id,
                        ':provider_id'    => $provider_id,
                        ':car_id'         => $car_id,
                        ':car_name'       => $car['name'] ?? ($data['car_name'] ?? ''),
                        ':name'           => $data['customer_name']    ?? '',
                        ':email'          => $data['customer_email']   ?? '',
                        ':phone'          => $data['customer_phone']   ?? '',
                        ':address'        => $data['customer_address'] ?? '',
                        ':id_number'      => $data['id_number']        ?? '',
                        ':pickup'         => $pickup_date,
                        ':return'         => $return_date,
                        ':location'       => $data['pickup_location']  ?? '',
                        ':notes'          => $data['notes']            ?? '',
                        ':days'           => $total_days,
                        ':total_price'    => $final_total,
                        ':addon_services' => $addon_json,
                        ':addon_total'    => $addon_total,
                    ]);
                    $booking_id = (int)$this->conn->lastInsertId();
                } else {
                    throw $insertErr;
                }
            }

            echo json_encode([
                'success'                  => true,
                'booking_id'               => $booking_id,
                // Trả giá server-tính về client để hiển thị ngay trên trang success
                'total_days'               => $total_days,
                'subtotal'                 => $subtotal,
                'addon_total'              => $addon_total,
                'weekend_surcharge_amount' => $weekend_surcharge_amount,
                'tax_amount'               => $tax_amount,
                'deposit_amount'           => $deposit_amount,
                'final_total'              => $final_total,
            ]);

        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => 'Lỗi hệ thống: ' . $e->getMessage()]);
        }
    }

    // ─────────────────────────────────────────────────────────────
    // GET ?action=getById&id=X
    // ─────────────────────────────────────────────────────────────
    public function getById() {
        try {
            $id = (int)($_GET['id'] ?? 0);
            if (!$id) {
                echo json_encode(['success' => false, 'message' => 'ID không hợp lệ']);
                return;
            }
            $stmt = $this->conn->prepare('SELECT * FROM `bookings` WHERE `id` = :id');
            $stmt->execute([':id' => $id]);
            $booking = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($booking) {
                echo json_encode(['success' => true, 'data' => $booking]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Không tìm thấy đơn đặt xe']);
            }
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    // ─────────────────────────────────────────────────────────────
    // GET ?action=trackByPhone&phone=X
    // ─────────────────────────────────────────────────────────────
    public function trackByPhone() {
        try {
            $phone = trim($_GET['phone'] ?? '');
            if (empty($phone)) {
                echo json_encode(['success' => false, 'message' => 'Vui lòng nhập số điện thoại']);
                return;
            }
            $stmt = $this->conn->prepare(
                'SELECT * FROM `bookings` WHERE `customer_phone` = :phone ORDER BY `created_at` DESC'
            );
            $stmt->execute([':phone' => $phone]);
            echo json_encode(['success' => true, 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }
}

/* ── Router ── */
$controller = new BookingController();
$action     = $_GET['action'] ?? 'create';

match ($action) {
    'create'       => $controller->create(),
    'getById'      => $controller->getById(),
    'trackByPhone' => $controller->trackByPhone(),
    default        => print(json_encode(['success' => false, 'message' => 'Invalid action'])),
};
