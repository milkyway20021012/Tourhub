import { query } from '../../lib/db';

export default async function handler(req, res) {
    const { method } = req;

    try {
        switch (method) {
            case 'GET':
                return await getUserFavorites(req, res);
            case 'POST':
                return await addFavorite(req, res);
            case 'DELETE':
                return await removeFavorite(req, res);
            default:
                return res.status(405).json({ message: '不允許的請求方法' });
        }
    } catch (error) {
        console.error('user-favorites API 錯誤:', error);
        return res.status(500).json({
            success: false,
            message: '伺服器錯誤',
            error: error.message
        });
    }
}

// 獲取用戶收藏列表
async function getUserFavorites(req, res) {
    const { line_user_id, limit = 50 } = req.query;

    if (!line_user_id) {
        return res.status(400).json({ message: '缺少用戶 ID' });
    }

    try {
        // 檢查是否存在 user_favorites 表，如果不存在則創建
        await query(`
            CREATE TABLE IF NOT EXISTS user_favorites (
                id INT AUTO_INCREMENT PRIMARY KEY,
                line_user_id VARCHAR(255) NOT NULL,
                trip_id INT NOT NULL,
                favorited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_user_trip (line_user_id, trip_id),
                UNIQUE KEY unique_user_trip (line_user_id, trip_id)
            )
        `);

        // 獲取用戶收藏的行程
        const sql = `
            SELECT 
                t.trip_id,
                t.title,
                t.description,
                t.start_date,
                t.end_date,
                t.area,
                DATEDIFF(t.end_date, t.start_date) + 1 as duration_days,
                CASE 
                    WHEN t.start_date > CURDATE() THEN '即將出發'
                    WHEN t.start_date <= CURDATE() AND t.end_date >= CURDATE() THEN '進行中'
                    ELSE '已結束'
                END as status,
                uf.favorited_at
            FROM user_favorites uf
            JOIN line_trips t ON uf.trip_id = t.trip_id
            WHERE uf.line_user_id = ?
            ORDER BY uf.favorited_at DESC
            LIMIT ?
        `;

        const favorites = await query(sql, [line_user_id, parseInt(limit)]);

        return res.status(200).json({
            success: true,
            favorites: favorites,
            count: favorites.length
        });

    } catch (error) {
        console.error('獲取收藏列表失敗:', error);
        return res.status(500).json({
            success: false,
            message: '獲取收藏列表失敗',
            error: error.message
        });
    }
}

// 添加收藏
async function addFavorite(req, res) {
    const { line_user_id, trip_id } = req.body;

    if (!line_user_id || !trip_id) {
        return res.status(400).json({ message: '缺少必要參數' });
    }

    try {
        // 檢查行程是否存在
        const tripExists = await query('SELECT trip_id FROM line_trips WHERE trip_id = ?', [trip_id]);
        if (tripExists.length === 0) {
            return res.status(404).json({ message: '行程不存在' });
        }

        // 檢查是否已經收藏
        const existingFavorite = await query(
            'SELECT id FROM user_favorites WHERE line_user_id = ? AND trip_id = ?',
            [line_user_id, trip_id]
        );

        if (existingFavorite.length > 0) {
            return res.status(409).json({ message: '已經收藏此行程' });
        }

        // 添加收藏
        await query(
            'INSERT INTO user_favorites (line_user_id, trip_id) VALUES (?, ?)',
            [line_user_id, trip_id]
        );

        return res.status(201).json({
            success: true,
            message: '收藏成功'
        });

    } catch (error) {
        console.error('添加收藏失敗:', error);
        return res.status(500).json({
            success: false,
            message: '添加收藏失敗',
            error: error.message
        });
    }
}

// 移除收藏
async function removeFavorite(req, res) {
    const { line_user_id, trip_id } = req.body;

    if (!line_user_id || !trip_id) {
        return res.status(400).json({ message: '缺少必要參數' });
    }

    try {
        const result = await query(
            'DELETE FROM user_favorites WHERE line_user_id = ? AND trip_id = ?',
            [line_user_id, trip_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: '收藏不存在' });
        }

        return res.status(200).json({
            success: true,
            message: '取消收藏成功'
        });

    } catch (error) {
        console.error('移除收藏失敗:', error);
        return res.status(500).json({
            success: false,
            message: '移除收藏失敗',
            error: error.message
        });
    }
}