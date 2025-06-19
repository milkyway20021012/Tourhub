import { query } from '../../lib/db';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: '不允許的請求方法' });
    }

    try {
        const { line_user_id, trip_id, share_type = 'line' } = req.body;

        if (!line_user_id || !trip_id) {
            return res.status(400).json({
                success: false,
                message: '缺少必要參數'
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

        // 記錄分享
        await query(`
            INSERT INTO user_shares (line_user_id, trip_id, share_type, shared_at)
            VALUES (?, ?, ?, NOW())
        `, [line_user_id, trip_id, share_type]);

        res.status(200).json({
            success: true,
            message: '分享記錄已保存'
        });

    } catch (error) {
        console.error('user-shares API 錯誤:', error);
        res.status(500).json({
            success: false,
            message: '伺服器錯誤',
            error: error.message
        });
    }
}