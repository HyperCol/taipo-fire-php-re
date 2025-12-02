<?php
// 請放在網站根目錄 (與 index.html 同層)
$host = 'localhost';
$db   = 'taipo_fire'; // 資料庫名稱
$user = 'root';       // 資料庫帳號
$pass = 'password';   // 資料庫密碼

// 建立 MySQLi 連線
$conn = new mysqli($host, $user, $pass, $db);

// 檢查連線
if ($conn->connect_error) {
    // 生產環境建議不要直接輸出錯誤細節
    die("Connection failed: " . $conn->connect_error);
}

// 設定字符集
$conn->set_charset("utf8mb4");
