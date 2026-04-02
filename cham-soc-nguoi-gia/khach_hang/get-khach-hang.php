<?php
declare(strict_types=1);

/**
 * Goi API list de lay danh sach ban ghi theo bang.
 * Tra ve mang row da duoc chuan hoa.
 */
function kh_list_table_rows(string $table): array
{
    $url = 'https://api.dvqt.vn/list/';
    $payload = json_encode(['table' => $table], JSON_UNESCAPED_UNICODE);
    if ($payload === false) {
        return [];
    }

    $raw = false;
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
            CURLOPT_POSTFIELDS => $payload,
            CURLOPT_CONNECTTIMEOUT => 8,
            CURLOPT_TIMEOUT => 20,
        ]);
        $raw = curl_exec($ch);
        curl_close($ch);
    } else {
        $context = stream_context_create([
            'http' => [
                'method' => 'POST',
                'header' => "Content-Type: application/json\r\n",
                'content' => $payload,
                'timeout' => 20,
            ],
        ]);
        $raw = @file_get_contents($url, false, $context);
    }

    if (!is_string($raw) || $raw === '') {
        return [];
    }

    $decoded = json_decode($raw, true);
    if (!is_array($decoded) || !empty($decoded['error']) || (isset($decoded['success']) && $decoded['success'] === false)) {
        return [];
    }

    $rows = $decoded;
    if (isset($decoded['data']) && is_array($decoded['data'])) {
        $rows = $decoded['data'];
    } elseif (isset($decoded['rows']) && is_array($decoded['rows'])) {
        $rows = $decoded['rows'];
    } elseif (isset($decoded['items']) && is_array($decoded['items'])) {
        $rows = $decoded['items'];
    }

    if (!is_array($rows)) {
        return [];
    }

    return array_values(array_filter($rows, static fn($row): bool => is_array($row)));
}

/**
 * Lay thong tin 1 khach hang theo id.
 */
function get_khach_hang_by_id(int $customerId): ?array
{
    if ($customerId <= 0) {
        return null;
    }

    $rows = kh_list_table_rows('khachhang');
    foreach ($rows as $row) {
        if ((int)($row['id'] ?? 0) === $customerId) {
            return $row;
        }
    }

    return null;
}

/**
 * Ham dung chung: lay thong tin khach hang tu session id.
 * Tra ve bo ket qua gom success, error va row.
 */
function getKhachHangBySessionId($sessionCustomerId): array
{
    $customerId = (int)$sessionCustomerId;
    if ($customerId <= 0) {
        return [
            'success' => false,
            'error' => 'Khong tim thay id khach hang trong session.',
            'row' => null,
        ];
    }

    $customer = get_khach_hang_by_id($customerId);
    if (!is_array($customer)) {
        return [
            'success' => false,
            'error' => 'Khong tim thay du lieu khach hang trong bang khachhang.',
            'row' => null,
        ];
    }

    return [
        'success' => true,
        'error' => '',
        'row' => $customer,
    ];
}
