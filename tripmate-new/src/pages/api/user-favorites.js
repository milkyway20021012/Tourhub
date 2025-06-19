import { query } from '../../lib/db';

export default async function handler(req, res) {
    const { method } = req;

    try {
        switch (method) {
            case 'GET':
                // 獲取用戶收藏列表
                const { line_user_id, limit = 50, offset = 0 } = req.query;

                if (!line_user_id) {
                    return res.status(400).json({
                        success: false,
                        message: '缺少 line_user_id'
                    });
                }

                const favorites = await query(`
                    SELECT 
                        f.favorite_id,
                        f.trip_id,
                        f.created_at as favorited_at,
                        t.title,
                        t.description,
                        t.area,
                        t.start_date,
                        t.end_date,
                        DATEDIFF(t.end_date, t.start_date) + 1 as duration_days,
                        CASE 
                            WHEN t.start_date > CURDATE() THEN '即將出發'
                            WHEN t.start_date <= CURDATE() AND t.end_date >= CURDATE() THEN '進行中'
                            ELSE '已結束'
                        END as status
                    FROM user_favorites f
                    JOIN line_trips t ON f.trip_id = t.trip_id
                    WHERE f.line_user_id = ?
                    ORDER BY f.created_at DESC
                    LIMIT ? OFFSET ?
                `, [line_user_id, parseInt(limit), parseInt(offset)]);

                // 獲取收藏總數
                const countResult = await query(`
                    SELECT COUNT(*) as total
                    FROM user_favorites 
                    WHERE line_user_id = ?
                `, [line_user_id]);

                return res.status(200).json({
                    success: true,
                    favorites: favorites,
                    count: favorites.length,
                    total: countResult[0]?.total || 0,
                    pagination: {
                        limit: parseInt(limit),
                        offset: parseInt(offset),
                        hasMore: favorites.length === parseInt(limit)
                    }
                });

            case 'POST':
                // 新增收藏
                const { line_user_id: userId, trip_id } = req.body;

                if (!userId || !trip_id) {
                    return res.status(400).json({
                        success: false,
                        message: '缺少必要參數 (line_user_id, trip_id)'
                    });
                }

                // 檢查行程是否存在
                const tripExists = await query(`
                    SELECT trip_id FROM line_trips WHERE trip_id = ?
                `, [trip_id]);

                if (tripExists.length === 0) {
                    return res.status(404).json({
                        success: false,
                        message: '行程不存在'
                    });
                }

                // 檢查是否已收藏
                const existing = await query(`
                    SELECT favorite_id FROM user_favorites 
                    WHERE line_user_id = ? AND trip_id = ?
                `, [userId, trip_id]);

                if (existing.length > 0) {
                    return res.status(400).json({
                        success: false,
                        message: '已經收藏過此行程'
                    });
                }

                // 新增收藏
                const insertResult = await query(`
                    INSERT INTO user_favorites (line_user_id, trip_id, created_at)
                    VALUES (?, ?, NOW())
                `, [userId, trip_id]);

                return res.status(200).json({
                    success: true,
                    message: '收藏成功',
                    favorite_id: insertResult.insertId
                });

            case 'DELETE':
                // 移除收藏
                const { line_user_id: delUserId, trip_id: delTripId } = req.body;

                if (!delUserId || !delTripId) {
                    return res.status(400).json({
                        success: false,
                        message: '缺少必要參數 (line_user_id, trip_id)'
                    });
                }

                const deleteResult = await query(`
                    DELETE FROM user_favorites 
                    WHERE line_user_id = ? AND trip_id = ?
                `, [delUserId, delTripId]);

                if (deleteResult.affectedRows === 0) {
                    return res.status(404).json({
                        success: false,
                        message: '找不到該收藏記錄'
                    });
                }

                return res.status(200).json({
                    success: true,
                    message: '取消收藏成功'
                });

            default:
                return res.status(405).json({
                    success: false,
                    message: '不允許的請求方法'
                });
        }

    } catch (error) {
        console.error('user-favorites API 錯誤:', error);
        res.status(500).json({
            success: false,
            message: '伺服器錯誤',
            error: error.message
        });
    }
}
