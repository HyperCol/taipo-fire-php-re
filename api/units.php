<?php
// api/units.php
require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

// 獲取某一座的所有單位狀態
if ($method === 'GET') {
    $block = $_GET['block'] ?? 'A';

    $stmt = $pdo->prepare("SELECT * FROM safety_status_v2 WHERE block = ?");
    $stmt->execute([$block]);
    $rows = $stmt->fetchAll();

    $units = [];
    foreach ($rows as $row) {
        // 組合鍵值 (e.g., "31_5") 以符合前端格式
        $key = $row['room'];
        $units[$key] = [
            'status' => $row['status'],
            'remark' => $row['remark'],
            'source' => $row['source'],
            'sourceUrl' => $row['source_url'],
            // 轉換時間格式以符合前端顯示需求
            'updatedAt' => $row['updated_at'] ? date('Y-m-d H:i:s', strtotime($row['updated_at'])) : null,
            'updatedBy' => $row['updated_by']
        ];
    }

    echo json_encode(['units' => $units]);
    exit;
}

// 更新狀態
if ($method === 'POST') {
    $user = getCurrentUser();
    if (!$user) {
        sendError('請先登入', 401);
    }
    // 如果需要限制只有管理員能修改，請取消註釋下一行
    // if (!$user['isAdmin']) sendError('權限不足', 403);

    $data = json_decode(file_get_contents('php://input'), true);

    $block = $data['block'];
    $floor = $data['floor'];
    $unit = $data['unit'];
    $room = "{$floor}_{$unit}";

    $status = $data['status'];
    $remark = $data['remark'];
    $source = $data['source'];
    $sourceUrl = $data['sourceUrl'];

    // Upsert
    $sql = "INSERT INTO safety_status_v2 
            (block, room, status, remark, source, source_url, updated_by, updated_by_email, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE
            status = VALUES(status),
            remark = VALUES(remark),
            source = VALUES(source),
            source_url = VALUES(source_url),
            updated_by = VALUES(updated_by),
            updated_by_email = VALUES(updated_by_email),
            updated_at = NOW()";

    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            $block,
            $room,
            $status,
            $remark,
            $source,
            $sourceUrl,
            $user['uuid'],
            $user['email']
        ]);
        echo json_encode(['success' => true]);
    } catch (PDOException $e) {
        sendError('更新失敗: ' . $e->getMessage());
    }
    exit;
}
