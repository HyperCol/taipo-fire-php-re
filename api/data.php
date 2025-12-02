<?php
require_once 'db.php';

$action = $_GET['action'] ?? '';

// 確保輔助函數存在 (如果 db.php 沒有定義或定義在條件區塊內)
if (!function_exists('getCurrentUser')) {
    function getCurrentUser()
    {
        if (session_status() === PHP_SESSION_NONE) session_start();
        return $_SESSION['user'] ?? null;
    }
}

if (!function_exists('sendError')) {
    function sendError($message, $code = 400)
    {
        http_response_code($code);
        echo json_encode(['success' => false, 'error' => $message]);
        exit;
    }
}

if (!function_exists('sendJson')) {
    function sendJson($data, $code = 200)
    {
        http_response_code($code);
        echo json_encode($data);
        exit;
    }
}

if (!function_exists('getJsonInput')) {
    function getJsonInput()
    {
        return json_decode(file_get_contents('php://input'), true);
    }
}

$user = getCurrentUser();

// 獲取某座數據
if ($action === 'get_block' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    $block = $_GET['block'] ?? 'A';

    $stmt = $conn->prepare("SELECT * FROM safety_status_v2 WHERE block = ?");
    if (!$stmt) sendError("Database error: " . $conn->error, 500);

    $stmt->bind_param("s", $block);
    $stmt->execute();
    $result = $stmt->get_result();

    $units = [];
    while ($row = $result->fetch_assoc()) {
        $units[$row['room']] = [
            'status' => $row['status'],
            'remark' => $row['remark'],
            'source' => $row['source'],
            'sourceUrl' => $row['source_url'],
            'updatedAt' => $row['updated_at'],
            'updatedBy' => $row['updated_by_uuid']
        ];
    }
    $stmt->close();
    sendJson(['units' => $units]);
}

// 更新狀態
if ($action === 'update_status' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!$user) sendError('Unauthorized', 401);

    $input = getJsonInput();
    $room = $input['floor'] . '_' . $input['unit'];

    // MySQLi 的 Upsert 寫法
    $sql = "INSERT INTO safety_status_v2 (block, room, status, remark, source, source_url, updated_by_uuid, updated_by_email, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE
            status = VALUES(status), remark = VALUES(remark), source = VALUES(source), 
            source_url = VALUES(source_url), updated_by_uuid = VALUES(updated_by_uuid), 
            updated_by_email = VALUES(updated_by_email), updated_at = NOW()";

    $stmt = $conn->prepare($sql);
    if (!$stmt) sendError("Database error: " . $conn->error, 500);

    // bind_param 參數類型: s=string (8個字串參數)
    $stmt->bind_param(
        "ssssssss",
        $input['block'],
        $room,
        $input['status'],
        $input['remark'],
        $input['source'],
        $input['sourceUrl'],
        $user['uid'],
        $user['email']
    );

    if ($stmt->execute()) {
        sendJson(['success' => true]);
    } else {
        sendError("Execute failed: " . $stmt->error, 500);
    }
    $stmt->close();
}

// 獲取新聞
if ($action === 'get_news') {
    $result = $conn->query("SELECT * FROM news ORDER BY created_at DESC LIMIT 50");
    if ($result) {
        // fetch_all(MYSQLI_ASSOC) 返回關聯數組
        sendJson($result->fetch_all(MYSQLI_ASSOC));
    } else {
        sendError("Query failed: " . $conn->error, 500);
    }
}

// 發佈新聞
if ($action === 'add_news' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!$user || !$user['isAdmin']) sendError('Forbidden', 403);

    $input = getJsonInput();
    $id = uniqid(); // 使用 PHP 生成 ID

    $stmt = $conn->prepare("INSERT INTO news (id, content, link, link_text, created_by_uuid, created_at) VALUES (?, ?, ?, ?, ?, NOW())");
    if (!$stmt) sendError("Database error: " . $conn->error, 500);

    // 5個字串參數
    $stmt->bind_param("sssss", $id, $input['content'], $input['link'], $input['linkText'], $user['uid']);

    if ($stmt->execute()) {
        sendJson(['success' => true]);
    } else {
        sendError("Execute failed: " . $stmt->error, 500);
    }
    $stmt->close();
}

// 刪除新聞
if ($action === 'delete_news' && $_SERVER['REQUEST_METHOD'] === 'DELETE') {
    if (!$user || !$user['isAdmin']) sendError('Forbidden', 403);

    $id = $_GET['id'];

    $stmt = $conn->prepare("DELETE FROM news WHERE id = ?");
    if (!$stmt) sendError("Database error: " . $conn->error, 500);

    $stmt->bind_param("s", $id);

    if ($stmt->execute()) {
        sendJson(['success' => true]);
    } else {
        sendError("Execute failed: " . $stmt->error, 500);
    }
    $stmt->close();
}
