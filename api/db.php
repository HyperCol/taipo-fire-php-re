<?php
// 設定標頭
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");

// 處理 OPTIONS 請求 (CORS 預檢)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// 引入資料庫設定
require_once '../dbconf.php';

// 啟動 Session
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

/**
 * 發送 JSON 回應並結束腳本
 */
if (!function_exists('sendJson')) {
    function sendJson($data, $code = 200)
    {
        http_response_code($code);
        echo json_encode($data, JSON_UNESCAPED_UNICODE);
        exit;
    }
}

/**
 * 發送錯誤回應並結束腳本
 */
if (!function_exists('sendError')) {
    function sendError($message, $code = 400)
    {
        sendJson(['success' => false, 'error' => $message], $code);
    }
}

/**
 * 取得 POST JSON 輸入數據
 */
if (!function_exists('getJsonInput')) {
    function getJsonInput()
    {
        $input = json_decode(file_get_contents('php://input'), true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            return [];
        }
        return $input;
    }
}

/**
 * 取得當前登入用戶資訊
 */
if (!function_exists('getCurrentUser')) {
    function getCurrentUser()
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        return $_SESSION['user'] ?? null;
    }
}
