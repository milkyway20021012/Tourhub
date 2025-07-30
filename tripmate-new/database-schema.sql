-- 行程詳細內容管理功能的資料庫結構

-- 行程詳細內容表格
CREATE TABLE IF NOT EXISTS `line_trip_details` (
  `detail_id` int(11) NOT NULL AUTO_INCREMENT,
  `trip_id` int(11) NOT NULL,
  `location` varchar(255) NOT NULL COMMENT '景點名稱',
  `date` date NOT NULL COMMENT '日期',
  `start_time` time NOT NULL COMMENT '開始時間',
  `end_time` time NOT NULL COMMENT '結束時間',
  `description` text COMMENT '景點描述',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`detail_id`),
  KEY `idx_trip_id` (`trip_id`),
  KEY `idx_date` (`date`),
  CONSTRAINT `fk_trip_details_trip_id` FOREIGN KEY (`trip_id`) REFERENCES `line_trips` (`trip_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='行程詳細內容表';

-- 如果表格已存在但缺少 description 欄位，執行以下 SQL
-- ALTER TABLE `line_trip_details` ADD COLUMN `description` text COMMENT '景點描述' AFTER `end_time`;

-- 索引優化
CREATE INDEX IF NOT EXISTS `idx_trip_details_trip_date` ON `line_trip_details` (`trip_id`, `date`);
CREATE INDEX IF NOT EXISTS `idx_trip_details_date_time` ON `line_trip_details` (`date`, `start_time`);

-- 檢查表格結構的查詢
-- DESCRIBE line_trip_details;

-- 檢查是否有行程沒有詳細內容的查詢
-- SELECT 
--   t.trip_id,
--   t.title,
--   t.area,
--   t.start_date,
--   t.end_date,
--   DATEDIFF(t.end_date, t.start_date) + 1 as duration_days
-- FROM line_trips t
-- LEFT JOIN line_trip_details d ON t.trip_id = d.trip_id
-- WHERE d.trip_id IS NULL
-- ORDER BY t.start_date DESC; 