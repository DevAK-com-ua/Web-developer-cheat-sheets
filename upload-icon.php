<?php
$response = ['success' => false];

if (isset($_FILES['icon'])) {
    $uploadDir = __DIR__ . '/src/img/icons/';
    $fileName = basename($_FILES['icon']['name']);
    $targetFile = $uploadDir . $fileName;

    // Перевірка на тип файлу (безпека)
    $fileType = strtolower(pathinfo($targetFile, PATHINFO_EXTENSION));
    $allowedTypes = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'];

    if (!in_array($fileType, $allowedTypes)) {
        $response['message'] = 'Недопустимий формат файлу.';
    } elseif (move_uploaded_file($_FILES['icon']['tmp_name'], $targetFile)) {
        $response['success'] = true;
        $response['filePath'] = 'src/img/icons/' . $fileName;
    } else {
        $response['message'] = 'Не вдалося завантажити файл.';
    }
} else {
    $response['message'] = 'Файл не надісланий.';
}

header('Content-Type: application/json');
echo json_encode($response);
