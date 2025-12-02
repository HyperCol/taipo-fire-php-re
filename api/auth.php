<?php
require_once 'db.php';

$action = $_GET['action'] ?? '';

// 登入
if ($action === 'login' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = getJsonInput();
    $email = $input['email'] ?? '';
    $password = $input['password'] ?? '';

    // 使用 mysqli 預處理語句
    $stmt = $conn->prepare("SELECT * FROM users WHERE email = ?");
    if (!$stmt) sendError("Database error: " . $conn->error, 500);

    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();
    $stmt->close();

    if ($user && password_verify($password, $user['password_hash'])) {
        $_SESSION['user'] = [
            'uid' => $user['uuid'],
            'email' => $user['email'],
            'username' => $user['username'],
            'isAdmin' => (bool)$user['is_admin']
        ];
        sendJson(['success' => true, 'user' => $_SESSION['user']]);
    } else {
        sendJson(['success' => false, 'error' => '電郵或密碼錯誤'], 401);
    }
}

// 檢查狀態
if ($action === 'check') {
    if (isset($_SESSION['user'])) {
        sendJson(['authenticated' => true, 'user' => $_SESSION['user']]);
    } else {
        sendJson(['authenticated' => false]);
    }
}

// 登出
if ($action === 'logout') {
    session_destroy();
    sendJson(['success' => true]);
}
