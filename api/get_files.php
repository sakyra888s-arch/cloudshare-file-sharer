<?php
require_once 'db.php';
header('Content-Type: application/json');

if (isset($_SESSION['user_id'])) {
    
    $stmt = $pdo->prepare("SELECT id, original_name, file_size FROM files WHERE user_id = ? ORDER BY upload_date DESC");
    $stmt->execute([$_SESSION['user_id']]);
    $files = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($files);
} else {
    echo json_encode([]);
}
?>