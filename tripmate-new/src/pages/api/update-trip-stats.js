import { query } from '../../lib/db';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: '不允許的請求方法' });
    }

    try {
        const { trip_id, action } = req.body;

        console.log('統計更新 API 被呼叫:', { trip_id, action });

        if (!trip_id || !action) {
            return res.status(400).json({
                success: false,
                message: '缺少必要參數 trip_id 或 action'
            });
        }

        // 驗證 action 類型
        const validActions = ['view', 'favorite_add', 'favorite_remove', 'share'];
        if (!validActions.includes(action)) {
            return res.status(400).json({
                success: false,
                message: '無效的 action 類型'
            });
        }

        // 確保統計表存在
        await ensureStatsTable();

        // 確保該行程的統計記錄存在
        await ensureTripStats(trip_id);

        // 根據操作類型更新統計
        let updateSQL = '';
        switch (action) {
            case 'view':
                updateSQL = `
                    UPDATE trip_stats 
                    SET view_count = view_count + 1,
                        last_updated = CURRENT_TIMESTAMP
                    WHERE trip_id = ?
                `;
                break;
            case 'favorite_add':
                updateSQL = `
                    UPDATE trip_stats 
                    SET favorite_count = favorite_count + 1,
                        last_updated = CURRENT_TIMESTAMP
                    WHERE trip_id = ?
                `;
                break;
            case 'favorite_remove':
                updateSQL = `
                    UPDATE trip_stats 
                    SET favorite_count = GREATEST(0, favorite_count - 1),
                        last_updated = CURRENT_TIMESTAMP
                    WHERE trip_id = ?
                `;
                break;
            case 'share':
                updateSQL = `
                    UPDATE trip_stats 
                    SET share_count = share_count + 1,
                        last_updated = CURRENT_TIMESTAMP
                    WHERE trip_id = ?
                `;
                break;
        }

        await query(updateSQL, [trip_id]);

        // 重新計算熱度分數
        await updatePopularityScore(trip_id);

        // 獲取更新後的統計數據
        const statsResult = await query(`
            SELECT * FROM trip_stats WHERE trip_id = ?
        `, [trip_id]);

        const stats = statsResult[0] || null;

        console.log('統計更新成功:', stats);

        res.status(200).json({
            success: true,
            message: '統計更新成功',
            action: action,
            trip_id: trip_id,
            stats: stats
        });

    } catch (error) {
        console.error('統計更新失敗:', error);
        res.status(500).json({
            success: false,
            message: '統計更新失敗',
            error: error.message
        });
    }
}

// 確保統計表存在
async function ensureStatsTable() {
    try {
        const createTableSQL = `
            CREATE TABLE IF NOT EXISTS trip_stats (
                trip_id INT PRIMARY KEY,
                favorite_count INT DEFAULT 0 COMMENT '收藏次數',
                share_count INT DEFAULT 0 COMMENT '分享次數',
                view_count INT DEFAULT 0 COMMENT '查看次數',
                popularity_score DECIMAL(10,2) DEFAULT 0 COMMENT '綜合熱度分數',
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (trip_id) REFERENCES line_trips(trip_id) ON DELETE CASCADE,
                INDEX idx_popularity (popularity_score DESC),
                INDEX idx_favorites (favorite_count DESC),
                INDEX idx_shares (share_count DESC),
                INDEX idx_views (view_count DESC)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='行程統計表'
        `;

        await query(createTableSQL);
    } catch (error) {
        console.error('創建統計表失敗:', error);
    }
}

// 確保行程統計記錄存在
async function ensureTripStats(tripId) {
    try {
        const insertSQL = `
            INSERT IGNORE INTO trip_stats (trip_id, favorite_count, share_count, view_count, popularity_score)
            VALUES (?, 0, 0, 0, 0)
        `;
        await query(insertSQL, [tripId]);
    } catch (error) {
        console.error('創建行程統計記錄失敗:', error);
    }
}

// 更新熱度分數
async function updatePopularityScore(tripId) {
    try {
        // 熱度分數計算公式：
        // 熱度分數 = (收藏數 * 3) + (分享數 * 2) + (查看數 * 0.1)
        const updateScoreSQL = `
            UPDATE trip_stats 
            SET popularity_score = LEAST(5, ((favorite_count * 3) + (share_count * 2) + (view_count * 0.1)) / 1000 * 5)
            WHERE trip_id = ?
        `;
        await query(updateScoreSQL, [tripId]);
    } catch (error) {
        console.error('更新熱度分數失敗:', error);
    }
}