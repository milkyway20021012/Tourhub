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
                        t.line_user_id
                    FROM line_trips t 
                    WHERE t.trip_id IN (
                        SELECT trip_id 
                        FROM (
                            SELECT trip_id, area, start_date,
                                   ROW_NUMBER() OVER (PARTITION BY area ORDER BY start_date DESC) as rn
                            FROM line_trips
                            WHERE area IS NOT NULL AND area != ''
                        ) ranked
                        WHERE rn = 1
                    )
                    ORDER BY t.area ASC, t.start_date DESC
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
                        t.line_user_id
                    FROM line_trips t 
                    WHERE t.start_date >= CURDATE()
                    ORDER BY t.start_date ASC
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
            count: trips.length,
            table_source: 'line_trips'
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
