import { query } from '../../lib/db';

export default async function handler(req, res) {
    const { method } = req;

    try {
        switch (method) {
            case 'GET':
                // 獲取用戶收藏列表
                const { line_user_id } = req.query;

                if (!line_user_id) {
                    return res.status(400).json({ message: '缺少 line_user_id' });
                }

                // 注意：這裡假設您有一個 user_favorites 表格
                // 如果沒有，需要先創建這個表格
                const favorites = await query(`
                    SELECT 
                        f.trip_id,
                        t.title,
                        t.area,
                        t.start_date,
                        t.end_date,
                        f.created_at as favorited_at
                    FROM user_favorites f
                    JOIN line_trips t ON f.trip_id = t.trip_id
                    WHERE f.line_user_id = ?
                    ORDER BY f.created_at DESC
                `, [line_user_id]);

                return res.status(200).json({
                    success: true,
                    favorites: favorites,
                    count: favorites.length
                });

            case 'POST':
                // 新增收藏
                const { line_user_id: userId, trip_id } = req.body;

                if (!userId || !trip_id) {
                    return res.status(400).json({ message: '缺少必要參數' });
                }

                // 檢查是否已收藏
                const existing = await query(`
                    SELECT * FROM user_favorites 
                    WHERE line_user_id = ? AND trip_id = ?
                `, [userId, trip_id]);

                if (existing.length > 0) {
                    return res.status(400).json({ message: '已經收藏過此行程' });
                }

                // 新增收藏
                await query(`
                    INSERT INTO user_favorites (line_user_id, trip_id, created_at)
                    VALUES (?, ?, NOW())
                `, [userId, trip_id]);

                return res.status(200).json({
                    success: true,
                    message: '收藏成功'
                });

            case 'DELETE':
                // 移除收藏
                const { line_user_id: delUserId, trip_id: delTripId } = req.body;

                if (!delUserId || !delTripId) {
                    return res.status(400).json({ message: '缺少必要參數' });
                }

                await query(`
                    DELETE FROM user_favorites 
                    WHERE line_user_id = ? AND trip_id = ?
                `, [delUserId, delTripId]);

                return res.status(200).json({
                    success: true,
                    message: '取消收藏成功'
                });

            default:
                return res.status(405).json({ message: '不允許的請求方法' });
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