<?php
session_start();

if (!isset($_SESSION['admin'])) {
    header("Location: dang-nhap-admin.html");
    exit();
}

$email = isset($_SESSION['admin']['email']) ? $_SESSION['admin']['email'] : '';
echo "Xin chào admin: " . $email;