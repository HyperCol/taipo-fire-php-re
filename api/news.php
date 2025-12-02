<?php
// api/news.php
require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
    $stmt = $pdo->prepare("SELECT * FROM news ORDER BY created_at DESC LIMIT ?");
    $stmt->execute([$limit]);
    $news = $stmt->fetchAll();
    echo json_encode($news);
    exit;
}

if ($method === 'POST') {
    require_once 'auth.php';
    $user = getCurrentUser();
    if (!$user || !$user['isAdmin']) {
        sendError('權限不足', 403);
    }

    $data = json_decode(file_get_contents('php://input'), true);

    $id = uniqid(); // 生成一個簡單的 ID
    $content = $data['content'];
    $link = $data['link'] ?? '';
    $linkText = $data['linkText'] ?? '';

    $stmt = $pdo->prepare("INSERT INTO news (id, content, link, link_text, created_at, created_by, created_by_email) VALUES (?, ?, ?, ?, NOW(), ?, ?)");
    $stmt->execute([$id, $content, $link, $linkText, $user['uuid'], $user['email']]);

    echo json_encode(['success' => true, 'id' => $id]);
    exit;
}

if ($method === 'DELETE') {
    $user = getCurrentUser();
    if (!$user || !$user['isAdmin']) {
        sendError('權限不足', 403);
    }

    $id = $_GET['id'];
    $stmt = $pdo->prepare("DELETE FROM news WHERE id = ?");
    $stmt->execute([$id]);

    echo json_encode(['success' => true]);
    exit;
}
