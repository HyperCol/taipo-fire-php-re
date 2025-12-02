SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 用戶表 (管理員)
-- DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(36) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `username` varchar(100) DEFAULT 'Admin',
  `is_admin` tinyint(1) DEFAULT 0,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `uuid` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 預設管理員 (密碼: admin123) - 請在部署後修改
-- INSERT INTO `users` (`uuid`, `email`, `password_hash`, `username`, `is_admin`) 
-- VALUES (UUID(), 'admin@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin', 1);

-- 新聞表
-- DROP TABLE IF EXISTS `news`;
CREATE TABLE `news` (
  `id` varchar(36) NOT NULL,
  `content` text NOT NULL,
  `link` varchar(255) DEFAULT '',
  `link_text` varchar(255) DEFAULT '',
  `created_by_uuid` varchar(36) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 單位狀態表 (使用 safety_status_v2)
-- DROP TABLE IF EXISTS `safety_status_v2`;
CREATE TABLE `safety_status_v2` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `block` varchar(10) NOT NULL,
  `room` varchar(20) NOT NULL, -- 格式如 "1_1"
  `status` varchar(20) DEFAULT NULL, -- safe, danger, deceased, mixed, missing
  `remark` text,
  `source` varchar(50) DEFAULT NULL,
  `source_url` varchar(255) DEFAULT NULL,
  `updated_by_uuid` varchar(36) DEFAULT NULL,
  `updated_by_email` varchar(255) DEFAULT NULL,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_unit` (`block`, `room`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;