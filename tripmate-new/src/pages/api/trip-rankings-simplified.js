// pages/api/trip-rankings-simplified.js - 繁體中文簡化版排行榜 API，移除標籤
import { query } from '../../lib/db';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: '不允許的請求方法' });
    }

    try {
        const { type = 'date' } = req.query;

        console.log('trip-rankings-simplified API 被呼叫，類型:', type);

        let sql = '';

        switch (type) {
            case 'area':
                // 按地區分組，每個地區選擇最新的行程
                sql = `
                    SELECT 
                        t.trip_id,
                        t.title,
                        t.description,
                        t.start_date,
                        t.end_date,
                        t.area,
                        t.budget,
                        t.created_at
                    FROM trip t 
                    WHERE t.trip_id IN (
                        SELECT trip_id 
                        FROM (
                            SELECT trip_id, area, created_at,
                                   ROW_NUMBER() OVER (PARTITION BY area ORDER BY created_at DESC) as rn
                            FROM trip
                            WHERE area IS NOT NULL AND area != ''
                        ) ranked
                        WHERE rn = 1
                    )
                    ORDER BY t.area ASC, t.created_at DESC
                    LIMIT 20
                `;
                break;

            case 'date':
                // 即將出發的行程
                sql = `
                    SELECT 
                        t.trip_id,
                        t.title,
                        t.description,
                        t.start_date,
                        t.end_date,
                        t.area,
                        t.budget,
                        t.created_at
                    FROM trip t 
                    WHERE t.start_date >= CURDATE()
                    ORDER BY t.start_date ASC, t.created_at DESC
                    LIMIT 20
                `;
                break;

            default:
                return res.status(400).json({ message: '無效的排行榜類型' });
        }

        console.log('執行排行榜查詢...');
        const trips = await query(sql);
        console.log('排行榜結果:', trips.length, '筆');

        res.status(200).json({
            success: true,
            data: trips,
            ranking_type: type,
            count: trips.length
        });

    } catch (error) {
        console.error('trip-rankings-simplified API 錯誤:', error);
        res.status(500).json({
            success: false,
            message: '伺服器錯誤',
            error: error.message
        });
    }
}