<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Upload to Google Drive</title>
</head>
<body>

<h2>Upload File</h2>

<form method="post" enctype="multipart/form-data">
    <input type="file" name="file" required><br><br>
    <input type="text" name="name" placeholder="Tên file" required><br><br>
    <button type="submit" name="upload">Upload</button>
</form>

<hr>

<h2>Lấy file theo tên</h2>

<form method="get">
    <input type="text" name="search" placeholder="Nhập tên file"><br><br>
    <button type="submit">Lấy file</button>
</form>

<hr>

<?php

$scriptUrl = "https://script.google.com/macros/s/AKfycbyk-fc3BdfgFDNkU5zuDGm6uvQTHFx3EEuE8I_GplYJAWkZlevuFH09VjTpIiuVmel5hQ/exec"; // thay link

// ================= UPLOAD =================
if (isset($_POST['upload'])) {

    $fileTmp = $_FILES['file']['tmp_name'];
    $fileName = $_POST['name'];
    $fileType = $_FILES['file']['type'];

    $fileContent = base64_encode(file_get_contents($fileTmp));

    $data = json_encode([
        "name" => $fileName,
        "file" => $fileContent,
        "type" => $fileType
    ]);

    $ch = curl_init($scriptUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json'
    ]);

    $response = curl_exec($ch);
    curl_close($ch);

    echo "<pre>Upload result: $response</pre>";
}

// ================= GET FILE =================
if (isset($_GET['search'])) {

    $name = $_GET['search'];
    $url = $scriptUrl . "?name=" . urlencode($name);

    $result = file_get_contents($url);
    $data = json_decode($result, true);

    if ($data['status'] == 'success') {
        $fileUrl = $data['url'];

        echo "<h3>Hiển thị:</h3>";

        // thử hiển thị ảnh
        echo "<img src='$fileUrl' width='300'><br><br>";

        // video
        echo "
        <video width='400' controls>
            <source src='$fileUrl'>
        </video>
        ";

    } else {
        echo "Không tìm thấy file!";
    }
}
?>

</body>
</html>