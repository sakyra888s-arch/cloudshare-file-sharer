<?php
require_once 'db.php';
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Вы должны войти в систему для загрузки файлов!']);
    exit;
}

$user_id = $_SESSION['user_id'];

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['file'])) {
    $file = $_FILES['file'];
    
    if ($file['error'] !== UPLOAD_ERR_OK) {
        echo json_encode(['status' => 'error', 'message' => 'Ошибка загрузки файла на сервер']);
        exit;
    }

    $originalName = basename($file['name']);
    $fileExt = pathinfo($originalName, PATHINFO_EXTENSION);
    
    // 🛡️ ЗАЩИТА: Проверка на запрещенные расширения
    $forbiddenExts = ['php', 'phtml', 'php3', 'php4', 'exe', 'sh', 'bat'];
    if (in_array(strtolower($fileExt), $forbiddenExts)) {
        echo json_encode(['status' => 'error', 'message' => 'Запрещено загружать исполняемые файлы!']);
        exit;
    }

    $newFileName = uniqid('file_') . '.' . $fileExt;
    $uploadDir = '../uploads/'; 
    $filePath = $uploadDir . $newFileName;
    $shareToken = bin2hex(random_bytes(5)); 

    if (move_uploaded_file($file['tmp_name'], $filePath)) {
        try {
            $stmt = $pdo->prepare("INSERT INTO files (user_id, original_name, file_size, file_path, share_token) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$user_id, $originalName, $file['size'], $filePath, $shareToken]);
            echo json_encode(['status' => 'success', 'message' => 'Файл загружен!']);
        } catch (PDOException $e) {
            echo json_encode(['status' => 'error', 'message' => 'Ошибка БД: ' . $e->getMessage()]);
        }
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Не удалось сохранить файл.']);
    }
} else {
    echo json_encode(['status' => 'error', 'message' => 'Неверный метод запроса']);
}
?>