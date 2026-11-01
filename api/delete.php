<?php
require_once 'db.php';
header('Content-Type: application/json');

if (!isset($_SESSION['user_id']) || !isset($_GET['id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Ошибка доступа']);
    exit;
}

$id = $_GET['id'];
$user_id = $_SESSION['user_id'];


$stmt = $pdo->prepare("SELECT file_path FROM files WHERE id = ? AND user_id = ?");
$stmt->execute([$id, $user_id]);
$file = $stmt->fetch();

if ($file) {
    // Удаляем физический файл с сервера
    $filepath = __DIR__ . '/../uploads/' . basename($file['file_path']);
    if (file_exists($filepath)) {
        unlink($filepath); 
    }
    
    // Удаляем запись из БД
    $stmt = $pdo->prepare("DELETE FROM files WHERE id = ?");
    $stmt->execute([$id]);
    
    echo json_encode(['status' => 'success']);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Файл не найден или нет прав на удаление']);
}
?>