<?php
$host = "localhost";
$user = "root";
$pass = "";
$db = "giaohang";
$conn = new mysqli($host, $user, $pass, $db);
if ($conn->connect_error) {
    header('Content-Type: application/json');
    echo json_encode(['status' => 'error', 'message' => 'DB Connection Failed']);
    exit;
}
$conn->set_charset("utf8");
?>
