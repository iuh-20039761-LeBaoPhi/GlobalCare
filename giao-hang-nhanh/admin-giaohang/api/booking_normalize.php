<?php

/**
 * booking_normalize.php
 * Gom các helper normalize / alias / fallback cho booking API:
 * - map field cũ/mới của payload
 * - chuẩn hóa payment method, vehicle key, item type
 * - bóc tách note reorder và kiểm tra điều kiện xe máy
 *
 * Liên quan trực tiếp:
 * - booking.php: file API chính require_once helper này
 * - dat-lich/flow-submit.js, customer-portal.js, shipper-portal.js:
 *   có thể gửi payload cũ/mới nên backend cần normalize tập trung ở đây
 */

function first_non_empty_value(...$values) {
    foreach ($values as $value) {
        if ($value !== null && $value !== '') {
            return $value;
        }
    }
    return '';
}

function normalize_booking_payload(array $data): array {
    $aliases = [
        'sender_name' => ['nguoi_gui_ho_ten'],
        'sender_phone' => ['nguoi_gui_so_dien_thoai'],
        'receiver_name' => ['nguoi_nhan_ho_ten'],
        'receiver_phone' => ['nguoi_nhan_so_dien_thoai'],
        'search_pickup' => ['dia_chi_lay_hang'],
        'search_delivery' => ['dia_chi_giao_hang'],
        'pickup_date' => ['ngay_lay_hang'],
        'pickup_slot' => ['khung_gio_lay_hang'],
        'pickup_slot_label' => ['ten_khung_gio_lay_hang'],
        'notes' => ['ghi_chu_tai_xe'],
        'cod_value' => ['gia_tri_thu_ho_cod'],
        'payment_method' => ['phuong_thuc_thanh_toan'],
        'fee_payer' => ['nguoi_tra_cuoc'],
        'service' => ['dich_vu'],
        'service_name' => ['ten_dich_vu'],
        'estimated_eta' => ['du_kien_giao_hang'],
        'vehicle' => ['phuong_tien'],
        'vehicle_label' => ['ten_phuong_tien'],
        'total_fee' => ['tong_cuoc'],
        'pricing_breakdown' => ['chi_tiet_gia_cuoc'],
        'pickup_lat' => ['vi_do_lay_hang'],
        'pickup_lng' => ['kinh_do_lay_hang'],
        'delivery_lat' => ['vi_do_giao_hang'],
        'delivery_lng' => ['kinh_do_giao_hang'],
        'service_condition_key' => ['ma_dieu_kien_dich_vu'],
        'weather_source' => ['nguon_thoi_tiet'],
        'weather_note' => ['ghi_chu_thoi_tiet'],
        'items' => ['mat_hang'],
    ];

    foreach ($aliases as $legacyKey => $newKeys) {
        if (!array_key_exists($legacyKey, $data) || $data[$legacyKey] === null || $data[$legacyKey] === '') {
            foreach ($newKeys as $newKey) {
                if (array_key_exists($newKey, $data) && $data[$newKey] !== null && $data[$newKey] !== '') {
                    $data[$legacyKey] = $data[$newKey];
                    break;
                }
            }
        }
    }

    if ((!array_key_exists('items', $data) || !is_array($data['items'])) && isset($data['mat_hang']) && is_array($data['mat_hang'])) {
        $data['items'] = $data['mat_hang'];
    }

    return $data;
}

function with_booking_prefill_aliases(array $payload): array {
    return array_merge($payload, [
        'nguoi_gui_ho_ten' => $payload['sender_name'] ?? '',
        'nguoi_gui_so_dien_thoai' => $payload['sender_phone'] ?? '',
        'dia_chi_lay_hang' => $payload['pickup_address'] ?? '',
    ]);
}

function with_booking_reorder_aliases(array $payload): array {
    return array_merge($payload, [
        'nguoi_gui_ho_ten' => $payload['sender_name'] ?? '',
        'nguoi_gui_so_dien_thoai' => $payload['sender_phone'] ?? '',
        'nguoi_nhan_ho_ten' => $payload['receiver_name'] ?? '',
        'nguoi_nhan_so_dien_thoai' => $payload['receiver_phone'] ?? '',
        'dia_chi_lay_hang' => $payload['pickup_address'] ?? '',
        'dia_chi_giao_hang' => $payload['delivery_address'] ?? '',
        'dich_vu' => $payload['service_type'] ?? '',
        'phuong_tien' => $payload['vehicle'] ?? '',
        'phuong_thuc_thanh_toan' => $payload['payment_method'] ?? '',
        'nguoi_tra_cuoc' => $payload['fee_payer'] ?? 'gui',
        'gia_tri_thu_ho_cod' => $payload['cod_value'] ?? 0,
        'ghi_chu_tai_xe' => $payload['notes'] ?? '',
        'mat_hang' => $payload['items'] ?? [],
    ]);
}

function extract_slot_start_time($slotValue, $fallback = '08:00') {
    $slotText = trim((string)$slotValue);
    if ($slotText === '') {
        return $fallback;
    }

    if (preg_match('/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/', $slotText, $matches)) {
        return $matches[1];
    }

    if (preg_match('/(\d{1,2})_(\d{2})_(\d{1,2})_(\d{2})/', $slotText, $matches)) {
        return sprintf('%02d:%02d', intval($matches[1]), intval($matches[2]));
    }

    if (preg_match('/(\d{1,2}:\d{2})/', $slotText, $matches)) {
        return $matches[1];
    }

    return $fallback;
}

function map_package_type_to_item_type($packageType) {
    $normalized = strtolower(trim((string) $packageType));
    $map = [
        'document' => 'thuong',
        'clothes' => 'thuong',
        'food' => 'thuong',
        'other' => 'thuong',
        'electronic' => 'gia-tri-cao',
        'fragile' => 'de-vo',
        'frozen' => 'dong-lanh',
        'liquid' => 'chat-long',
    ];

    return $map[$normalized] ?? 'thuong';
}

function normalize_reorder_payment_method($paymentMethod) {
    $normalized = strtolower(trim((string) $paymentMethod));
    if (in_array($normalized, ['bank', 'bank_transfer', 'transfer', 'chuyen_khoan'], true)) {
        return 'chuyen_khoan';
    }

    return 'tien_mat';
}

function normalize_db_payment_method($paymentMethod) {
    $normalized = strtolower(trim((string) $paymentMethod));
    if (in_array($normalized, ['bank', 'bank_transfer', 'transfer', 'chuyen_khoan'], true)) {
        return 'bank_transfer';
    }

    return 'cod';
}

function normalize_reorder_vehicle_key($vehicleType) {
    $normalized = strtolower(trim((string) $vehicleType));
    if ($normalized === '') {
        return 'auto';
    }
    if (strpos($normalized, 'xe_may') !== false || strpos($normalized, 'xe máy') !== false) {
        return 'xe_may';
    }
    if (
        strpos($normalized, 'xe_4_banh_nho') !== false ||
        strpos($normalized, '4 bánh nhỏ') !== false ||
        strpos($normalized, 'xe_loi') !== false ||
        strpos($normalized, 'xe lôi') !== false ||
        strpos($normalized, 'ba gác') !== false ||
        strpos($normalized, 'xe_ban_tai') !== false ||
        strpos($normalized, 'bán tải') !== false ||
        strpos($normalized, 'van') !== false
    ) {
        return 'xe_4_banh_nho';
    }
    if (
        strpos($normalized, 'xe_4_banh_vua') !== false ||
        strpos($normalized, '4 bánh vừa') !== false ||
        strpos($normalized, 'xe_tai_vua') !== false ||
        strpos($normalized, 'xe tải vừa') !== false ||
        strpos($normalized, 'tải nhẹ') !== false
    ) {
        return 'xe_4_banh_vua';
    }
    if (
        strpos($normalized, 'xe_4_banh_lon') !== false ||
        strpos($normalized, 'xe tải <') !== false ||
        strpos($normalized, 'xe tải ≤') !== false ||
        strpos($normalized, 'xe_tai') !== false ||
        strpos($normalized, 'xe tải') !== false ||
        strpos($normalized, '3500kg') !== false ||
        strpos($normalized, '3.500kg') !== false ||
        strpos($normalized, 'tải lớn') !== false ||
        strpos($normalized, 'tải 3 tấn') !== false
    ) {
        return 'xe_4_banh_lon';
    }

    return 'auto';
}

function lay_gioi_han_hang_hoa_xe_may() {
    return [
        'trong_luong_toi_da_kg' => 50,
        'chieu_dai_toi_da_cm' => 200,
        'chieu_rong_toi_da_cm' => 120,
        'chieu_cao_toi_da_cm' => 130,
    ];
}

function kiem_tra_hang_hoa_xe_may(array $mat_hang, $loaiXe) {
    $khoa_loai_xe = normalize_reorder_vehicle_key($loaiXe);
    $gioi_han = lay_gioi_han_hang_hoa_xe_may();

    if ($khoa_loai_xe !== 'xe_may') {
        return [
            'hop_le' => true,
            'ly_do' => '',
            'gioi_han' => $gioi_han,
        ];
    }

    $tong_trong_luong = 0;
    $chieu_dai_lon_nhat = 0;
    $chieu_rong_lon_nhat = 0;
    $chieu_cao_lon_nhat = 0;

    foreach ($mat_hang as $hang) {
        $so_luong = max(1, intval($hang['so_luong'] ?? $hang['quantity'] ?? 1));
        $tong_trong_luong += floatval($hang['can_nang'] ?? $hang['weight'] ?? 0) * $so_luong;
        $chieu_dai_lon_nhat = max($chieu_dai_lon_nhat, floatval($hang['chieu_dai'] ?? $hang['length'] ?? 0));
        $chieu_rong_lon_nhat = max($chieu_rong_lon_nhat, floatval($hang['chieu_rong'] ?? $hang['width'] ?? 0));
        $chieu_cao_lon_nhat = max($chieu_cao_lon_nhat, floatval($hang['chieu_cao'] ?? $hang['height'] ?? 0));
    }

    if ($tong_trong_luong > $gioi_han['trong_luong_toi_da_kg']) {
        return [
            'hop_le' => false,
            'ly_do' => 'Hàng hóa vượt ngưỡng ' . $gioi_han['trong_luong_toi_da_kg'] . 'kg của xe máy. Vui lòng chuyển sang xe 4 bánh.',
            'gioi_han' => $gioi_han,
        ];
    }

    if ($chieu_dai_lon_nhat > $gioi_han['chieu_dai_toi_da_cm']) {
        return [
            'hop_le' => false,
            'ly_do' => 'Chiều dài hàng hóa vượt ngưỡng ' . $gioi_han['chieu_dai_toi_da_cm'] . 'cm của xe máy. Vui lòng chuyển sang xe 4 bánh.',
            'gioi_han' => $gioi_han,
        ];
    }

    if ($chieu_rong_lon_nhat > $gioi_han['chieu_rong_toi_da_cm']) {
        return [
            'hop_le' => false,
            'ly_do' => 'Chiều rộng hàng hóa vượt ngưỡng ' . $gioi_han['chieu_rong_toi_da_cm'] . 'cm của xe máy. Vui lòng chuyển sang xe 4 bánh.',
            'gioi_han' => $gioi_han,
        ];
    }

    if ($chieu_cao_lon_nhat > $gioi_han['chieu_cao_toi_da_cm']) {
        return [
            'hop_le' => false,
            'ly_do' => 'Chiều cao hàng hóa vượt ngưỡng ' . $gioi_han['chieu_cao_toi_da_cm'] . 'cm của xe máy. Vui lòng chuyển sang xe 4 bánh.',
            'gioi_han' => $gioi_han,
        ];
    }

    return [
        'hop_le' => true,
        'ly_do' => '',
        'gioi_han' => $gioi_han,
    ];
}

function extract_reorder_note_and_fee_payer($note) {
    $noteText = trim((string) $note);
    if ($noteText === '') {
        return ['note' => '', 'fee_payer' => 'gui'];
    }

    $noteText = preg_replace('/--- THÔNG TIN DỊCH VỤ ---.*?(?=(\n--- [A-ZÀ-Ỹ ]+ ---)|$)/us', '', $noteText);
    $noteText = preg_replace('/--- CHI TIẾT PHÍ ---.*?(?=(\n--- [A-ZÀ-Ỹ ]+ ---)|$)/us', '', $noteText);
    $noteText = preg_replace('/--- CHI TIET DICH VU ---.*?(?=(\n--- [A-ZÀ-Ỹ ]+ ---)|$)/us', '', $noteText);
    $noteText = preg_replace('/--- CHI TIET PHI ---.*?(?=(\n--- [A-ZÀ-Ỹ ]+ ---)|$)/us', '', $noteText);

    $feePayer = 'gui';
    $cleanLines = [];
    foreach (preg_split('/\r\n|\r|\n/', $noteText) as $line) {
        $trimmedLine = trim($line);
        if ($trimmedLine === '') {
            continue;
        }
        if (stripos($trimmedLine, 'Người trả cước:') === 0) {
            if (preg_match('/người nhận/ui', $trimmedLine)) {
                $feePayer = 'nhan';
            }
            continue;
        }
        $cleanLines[] = $trimmedLine;
    }

    return [
        'note' => implode("\n", $cleanLines),
        'fee_payer' => $feePayer,
    ];
}

function fee_payer_label($feePayer) {
    return $feePayer === 'nhan' ? 'Người nhận' : 'Người gửi';
}

function payment_method_label($paymentMethod) {
    return normalize_db_payment_method($paymentMethod) === 'bank_transfer' ? 'Chuyển khoản' : 'Tiền mặt';
}
