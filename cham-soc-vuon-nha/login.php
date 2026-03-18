<?php
session_start();
header("Content-Type: application/json");

include "database.php";

$data = json_decode(file_get_contents("php://input"), true);

$email = $data['email'] ?? '';
$password = $data['password'] ?? '';

if ($email == "" || $password == "") {
    echo json_encode(["status"=>"error","message"=>"Thiếu thông tin"]);
    exit;
}

// Tìm user theo email
$sql = "SELECT * FROM users WHERE email = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $email);
$stmt->execute();

$result = $stmt->get_result();

if ($result->num_rows > 0) {
    $user = $result->fetch_assoc();

    $isValid = false;

    // ✅ 1. bcrypt (chuẩn nhất)
    if (password_verify($password, $user['password'])) {
        $isValid = true;
    }
    // ✅ 2. md5
    else if (md5($password) === $user['password']) {
        $isValid = true;
    }
    // ✅ 3. plain text (không khuyến khích)
    else if ($password === $user['password']) {
        $isValid = true;
    }

    if ($isValid) {

        $_SESSION['user_id'] = $user['id'];
        $_SESSION['role_id'] = $user['role_id'];
        $_SESSION['email'] = $user['email'];

        echo json_encode([
            "status"=>"success",
            "role_id"=>$user['role_id'],
            "message"=>"Đăng nhập thành công"
        ]);

    } else {
        echo json_encode(["status"=>"error","message"=>"Sai mật khẩu"]);
    }

} else {
    echo json_encode(["status"=>"error","message"=>"Email không tồn tại"]);
}

$stmt->close();
$conn->close();
?>