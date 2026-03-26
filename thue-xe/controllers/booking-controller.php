<?php
/**
 * Booking Controller
 * Đồng bộ với database hiện tại: datxe, xechiec, xemau, nguoidung, dichvu.
 */

ini_set('display_errors', 0);
error_reporting(0);

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
            ) ? (int)$_SESSION['user_id'] : 0;

            /* ── 2. Validate input bắt buộc ── */
            $car_id      = (int)($data['car_id']     ?? 0);
            $pickup_date = trim($data['pickup_date'] ?? '');
            $return_date = trim($data['return_date'] ?? '');
            $customer_name  = trim((string)($data['customer_name'] ?? ''));
            $customer_phone = trim((string)($data['customer_phone'] ?? ''));
            $customer_email = trim((string)($data['customer_email'] ?? ''));

            $pickup_time = preg_match('/^\d{2}:\d{2}$/', $data['pickup_time'] ?? '')
                               ? $data['pickup_time'] : '08:00';
            $return_time = preg_match('/^\d{2}:\d{2}$/', $data['return_time'] ?? '')
                               ? $data['return_time'] : '08:00';

            if (!$car_id || !$pickup_date || !$return_date || $customer_name === '' || $customer_phone === '') {
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

            $seconds = $returnDT->getTimestamp() - $pickupDT->getTimestamp();
            $total_days = max(1, (int)ceil($seconds / 86400));

            /* ── 4. Lấy xe từ bảng `xe` — KHÔNG tin giá từ client ── */
            $carStmt = $this->conn->prepare(
                "SELECT
                    xc.id AS car_id,
                    xc.tinhrang AS car_status,
                    xc.bienso AS license_plate,
                    xm.ten AS car_name,
                    xm.giathue_ngay AS price_per_day,
                    xm.tiledatcoc AS deposit_rate
                 FROM xechiec xc
                 INNER JOIN xemau xm ON xm.id = xc.idxemau
                 WHERE xc.id = :id
                 LIMIT 1"
            );
            $carStmt->execute([':id' => $car_id]);
            $car = $carStmt->fetch(PDO::FETCH_ASSOC);

            if (!$car) {
                echo json_encode(['success' => false, 'message' => 'Xe không tồn tại']);
                return;
            }
            if (($car['car_status'] ?? '') !== 'hoatdong') {
                echo json_encode(['success' => false, 'message' => 'Xe hiện không còn khả dụng để đặt']);
                return;
            }

            $price_per_day = (float)$car['price_per_day'];
            $deposit_rate  = (float)($car['deposit_rate']           ?? 0.30);

            /* ── 5. Kiểm tra trùng lịch xe trong `datxe` ── */
            $overlapStmt = $this->conn->prepare(
                "SELECT COUNT(*) FROM `datxe`
                 WHERE `idxechiec` = :car_id
                   AND `trangthai` IN ('pending', 'confirmed')
                   AND `ngaynhan`  < :return_date
                   AND `ngaytra`   > :pickup_date"
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

            /* ── 7. Tính addon từ bảng `dichvu` — KHÔNG tin addon_total từ client ── */
            $addon_services_names = array_values(
                array_filter((array)($data['addon_services'] ?? []), 'is_string')
            );
            $addon_total_float = 0.0;

            if (!empty($addon_services_names)) {
                $ph      = implode(',', array_fill(0, count($addon_services_names), '?'));
                $svcStmt = $this->conn->prepare(
                    "SELECT ten AS name, gia AS price, donvi AS unit
                     FROM `dichvu`
                     WHERE `ten` IN ($ph) AND `trangthai` = 1"
                );
                $svcStmt->execute($addon_services_names);
                foreach ($svcStmt->fetchAll(PDO::FETCH_ASSOC) as $svc) {
                    $unit = $svc['unit'] ?? 'chuyen';
                    $addon_total_float += (in_array($unit, ['ngay', 'ngày'], true))
                        ? (float)$svc['price'] * $total_days
                        : (float)$svc['price'];
                }
            }

            /* ── 8. Công thức tính tiền server-side ── */
            $subtotal         = (int)round($total_days * $price_per_day);
            $addon_total      = (int)round($addon_total_float);
            $tax_base         = $subtotal + $addon_total;
            $tax_amount       = (int)round($tax_base * 0.10);
            $deposit_amount   = (int)round($subtotal * $deposit_rate);
            $final_total      = $subtotal + $addon_total + $tax_amount;

            /* ── 9. Resolve/đăng ký khách hàng theo DB hiện tại ── */
            if ($user_id <= 0) {
                $findUserStmt = $this->conn->prepare(
                    "SELECT id FROM nguoidung
                     WHERE (sodienthoai = :phone OR email = :email)
                       AND vaitro = 'customer'
                     LIMIT 1"
                );
                $findUserStmt->execute([
                    ':phone' => $customer_phone,
                    ':email' => $customer_email,
                ]);
                $user = $findUserStmt->fetch(PDO::FETCH_ASSOC);

                if ($user) {
                    $user_id = (int)$user['id'];
                } else {
                    $createUserStmt = $this->conn->prepare(
                        "INSERT INTO nguoidung (hoten, email, sodienthoai, matkhau, vaitro, trangthai)
                         VALUES (:name, :email, :phone, NULL, 'customer', 'active')"
                    );
                    $createUserStmt->execute([
                        ':name'  => $customer_name,
                        ':email' => $customer_email ?: ('guest_' . time() . '@local.tx'),
                        ':phone' => $customer_phone,
                    ]);
                    $user_id = (int)$this->conn->lastInsertId();
                }
            }

            /* ── 9. INSERT vào bảng `datxe` ── */
            $sql = "INSERT INTO `datxe` (
                        `idkhachhang`, `idxechiec`, `ngaynhan`, `ngaytra`, `gionhan`, `gioratra`,
                        `diachinhan`, `ghichu`,
                        `trangthai`
                    ) VALUES (
                        :user_id, :car_id, :pickup, :return, :pickup_time, :return_time,
                        :location, :notes,
                        'pending'
                    )";

            $stmt = $this->conn->prepare($sql);
            $stmt->execute([
                ':user_id'           => $user_id,
                ':car_id'            => $car_id,
                ':pickup'            => $pickup_date,
                ':return'            => $return_date,
                ':pickup_time'       => $pickup_time . ':00',
                ':return_time'       => $return_time . ':00',
                ':location'          => $data['pickup_location']  ?? '',
                ':notes'             => $data['notes']            ?? '',
            ]);

            $booking_id = (int)$this->conn->lastInsertId();

            echo json_encode([
                'success'                  => true,
                'booking_id'               => $booking_id,
                'total_days'               => $total_days,
                'subtotal'                 => $subtotal,
                'addon_total'              => $addon_total,
                'weekend_surcharge_amount' => 0,
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

            // SELECT với alias để output JSON giữ nguyên field name cũ
            $stmt = $this->conn->prepare(
                "SELECT
                    d.id,
                    d.idkhachhang           AS user_id,
                    d.idxechiec             AS car_id,
                    xm.ten                  AS car_name,
                    nd.hoten                AS customer_name,
                    nd.email                AS customer_email,
                    nd.sodienthoai          AS customer_phone,
                    d.ngaynhan              AS pickup_date,
                    d.gionhan               AS pickup_time,
                    d.ngaytra               AS return_date,
                    d.gioratra              AS return_time,
                    d.diachinhan            AS pickup_location,
                    d.ghichu                AS notes,
                    DATEDIFF(d.ngaytra, d.ngaynhan) AS total_days,
                    d.trangthai             AS status,
                    d.ngaytao               AS created_at
                 FROM datxe d
                 INNER JOIN xechiec xc ON xc.id = d.idxechiec
                 INNER JOIN xemau xm ON xm.id = xc.idxemau
                 INNER JOIN nguoidung nd ON nd.id = d.idkhachhang
                 WHERE d.id = :id"
            );
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
                "SELECT
                    d.id,
                    d.idxechiec             AS car_id,
                    xm.ten                  AS car_name,
                    nd.hoten                AS customer_name,
                    nd.email                AS customer_email,
                    nd.sodienthoai          AS customer_phone,
                    d.ngaynhan              AS pickup_date,
                    d.gionhan               AS pickup_time,
                    d.ngaytra               AS return_date,
                    d.gioratra              AS return_time,
                    d.diachinhan            AS pickup_location,
                    d.ghichu                AS notes,
                    DATEDIFF(d.ngaytra, d.ngaynhan) AS total_days,
                    d.trangthai             AS status,
                    d.ngaytao               AS created_at
                 FROM datxe d
                 INNER JOIN nguoidung nd ON nd.id = d.idkhachhang
                 INNER JOIN xechiec xc ON xc.id = d.idxechiec
                 INNER JOIN xemau xm ON xm.id = xc.idxemau
                 WHERE nd.sodienthoai = :phone
                 ORDER BY d.ngaytao DESC"
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
