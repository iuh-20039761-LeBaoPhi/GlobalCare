<?php
session_start();
require_once 'db.php';

// Check if user is logged in
if (!isset($_SESSION['nguoi_dung_id'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$invoiceId = isset($_GET['hoa_don_id']) ? intval($_GET['hoa_don_id']) : 0;

if ($invoiceId === 0) {
    echo json_encode(['success' => false, 'message' => 'Invalid invoice ID']);
    exit;
}

// Get media for invoice
$sql = "SELECT im.*, u.ten as uploader_name, u.vai_tro as uploader_role 
        FROM media_hoa_don im 
        LEFT JOIN nguoi_dung u ON im.nguoi_dung_id = u.id 
        WHERE im.hoa_don_id = ? 
        ORDER BY im.ngay_tao DESC";
$stmt = $conn->prepare($sql);
$stmt->bind_param('i', $invoiceId);
$stmt->execute();
$result = $stmt->get_result();

$media = [];
while ($row = $result->fetch_assoc()) {
    $media[] = $row;
}

echo json_encode([
    'success' => true,
    'media' => $media
]);

$stmt->close();
$conn->close();
?>
