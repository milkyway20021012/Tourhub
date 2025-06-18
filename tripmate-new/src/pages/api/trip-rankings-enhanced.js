// pages/api/trip-rankings-enhanced.js - 增強版排行榜 API
import { query } from '../../lib/db';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: '不允許的請求方法' });
    }

    try {
        const { type = 'date' } = req.query;

        console.log('trip-rankings-enhanced API 被呼叫，類型:', type);

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
                        t.created_at,
                        DATEDIFF(t.end_date, t.start_date) + 1 as duration_days
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
                    LIMIT 50
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
                        t.created_at,
                        DATEDIFF(t.end_date, t.start_date) + 1 as duration_days
                    FROM trip t 
                    WHERE t.start_date >= CURDATE()
                    ORDER BY t.start_date ASC, t.created_at DESC
                    LIMIT 50
                `;
                break;

            case 'budget':
                // 按預算區間分類
                sql = `
                    SELECT 
                        t.trip_id,
                        t.title,
                        t.description,
                        t.start_date,
                        t.end_date,
                        t.area,
                        t.budget,
                        t.created_at,
                        DATEDIFF(t.end_date, t.start_date) + 1 as duration_days,
                        CASE 
                            WHEN t.budget < 10000 THEN '經濟型 (<1萬)'
                            WHEN t.budget < 30000 THEN '中等型 (1-3萬)' 
                            WHEN t.budget < 50000 THEN '豪華型 (3-5萬)'
                            WHEN t.budget >= 50000 THEN '頂級型 (>5萬)'
                            ELSE '未設定'
                        END as budget_range
                    FROM trip t 
                    ORDER BY 
                        CASE 
                            WHEN t.budget IS NULL THEN 5
                            WHEN t.budget < 10000 THEN 1
                            WHEN t.budget < 30000 THEN 2
                            WHEN t.budget < 50000 THEN 3
                            ELSE 4
                        END,
                        t.budget DESC, t.created_at DESC
                    LIMIT 50
                `;
                break;

            case 'duration':
                // 按行程長度分類
                sql = `
                    SELECT 
                        t.trip_id,
                        t.title,
                        t.description,
                        t.start_date,
                        t.end_date,
                        t.area,
                        t.budget,
                        t.created_at,
                        DATEDIFF(t.end_date, t.start_date) + 1 as duration_days,
                        CASE 
                            WHEN DATEDIFF(t.end_date, t.start_date) + 1 <= 3 THEN '短途 (1-3天)'
                            WHEN DATEDIFF(t.end_date, t.start_date) + 1 <= 7 THEN '中程 (4-7天)'
                            ELSE '長途 (8天以上)'
                        END as duration_type
                    FROM trip t 
                    ORDER BY duration_days DESC, t.created_at DESC
                    LIMIT 50
                `;
                break;

            case 'season':
                // 按季節分類
                sql = `
                    SELECT 
                        t.trip_id,
                        t.title,
                        t.description,
                        t.start_date,
                        t.end_date,
                        t.area,
                        t.budget,
                        t.created_at,
                        DATEDIFF(t.end_date, t.start_date) + 1 as duration_days,
                        CASE 
                            WHEN MONTH(t.start_date) IN (3,4,5) THEN '春季'
                            WHEN MONTH(t.start_date) IN (6,7,8) THEN '夏季'
                            WHEN MONTH(t.start_date) IN (9,10,11) THEN '秋季'
                            ELSE '冬季'
                        END as season
                    FROM trip t 
                    ORDER BY 
                        CASE 
                            WHEN MONTH(t.start_date) IN (3,4,5) THEN 1
                            WHEN MONTH(t.start_date) IN (6,7,8) THEN 2
                            WHEN MONTH(t.start_date) IN (9,10,11) THEN 3
                            ELSE 4
                        END,
                        t.start_date ASC
                    LIMIT 50
                `;
                break;

            case 'trending':
                // 趨勢分析 - 最近30天建立的行程
                sql = `
                    SELECT 
                        t.trip_id,
                        t.title,
                        t.description,
                        t.start_date,
                        t.end_date,
                        t.area,
                        t.budget,
                        t.created_at,
                        DATEDIFF(t.end_date, t.start_date) + 1 as duration_days,
                        DATEDIFF(CURDATE(), t.created_at) as days_since_created
                    FROM trip t 
                    WHERE t.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
                    ORDER BY t.created_at DESC, t.start_date ASC
                    LIMIT 50
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
        console.error('trip-rankings-enhanced API 錯誤:', error);
        res.status(500).json({
            success: false,
            message: '伺服器錯誤',
            error: error.message
        });
    }
}