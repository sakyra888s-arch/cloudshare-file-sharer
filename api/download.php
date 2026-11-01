<?php
require_once 'db.php';

if (!isset($_GET['id'])) {
    die("ID файла не передан");
}

$id = $_GET['id'];
$stmt = $pdo->prepare("SELECT * FROM files WHERE id = ?");
$stmt->execute([$id]);
$file = $stmt->fetch();

if ($file) {
    $filename = basename($file['file_path']); 
    $filepath = __DIR__ . '/../uploads/' . $filename; 

    if (file_exists($filepath)) {
        $etag = md5_file($filepath);
        header('Cache-Control: public, max-age=86400');
        header('ETag: "' . $etag . '"');

        if (isset($_SERVER['HTTP_IF_NONE_MATCH']) && $_SERVER['HTTP_IF_NONE_MATCH'] === '"' . $etag . '"') {
            header('HTTP/1.1 304 Not Modified');
            exit;
        }

        header('Content-Description: File Transfer');
        header('Content-Type: application/octet-stream');
        header('Content-Disposition: attachment; filename="' . basename($file['original_name']) . '"');
        header('Expires: 0');
        header('Pragma: public');
        header('Content-Length: ' . filesize($filepath));
        readfile($filepath);
        exit;
    } else {
        echo "Файл не найден на сервере по пути: " . $filepath;
    }
} else {
    echo "Файл с таким ID не найден в базе данных.";
}
?>
