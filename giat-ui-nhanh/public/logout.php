<?php
session_start();

// Xóa toàn bộ session
$_SESSION = [];

// Hủy session
session_destroy();

echo json_encode([
    "success" => true
]);