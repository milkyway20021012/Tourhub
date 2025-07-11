import { query } from '../../lib/db';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: '不允許的請求方法' });
    }

    try {
        const {
            type = 'all',
            budget_min = '',
            budget_max = '',
            duration_type = '',
            season = '',
            area = ''
        } = req.query;

        console.log('trip-rankings-enhanced API 被呼叫，類型:', type);

        let sql = '';
        let whereConditions = [];

        // 基本查詢
        const baseSelect = `
            SELECT 
                t.trip_id,
                t.title,
                t.description,
                t.start_date,
                t.end_date,
                t.area,
                t.line_user_id,
                DATEDIFF(t.end_date, t.start_date) + 1 as duration_days,
                CASE 
                    WHEN MONTH(t.start_date) IN (3,4,5) THEN '春季'
                    WHEN MONTH(t.start_date) IN (6,7,8) THEN '夏季'
                    WHEN MONTH(t.start_date) IN (9,10,11) THEN '秋季'
                    ELSE '冬季'
                END as season,
                CASE 
                    WHEN DATEDIFF(t.end_date, t.start_date) + 1 <= 2 THEN '週末遊'
                    WHEN DATEDIFF(t.end_date, t.start_date) + 1 <= 5 THEN '短期旅行'
                    WHEN DATEDIFF(t.end_date, t.start_date) + 1 <= 10 THEN '長假期'
                    ELSE '深度旅行'
                END as duration_type,
                CASE 
                    WHEN t.start_date > CURDATE() THEN '即將出發'
                    WHEN t.start_date <= CURDATE() AND t.end_date >= CURDATE() THEN '進行中'
                    ELSE '已結束'
                END as status
            FROM line_trips t
        `;

        // 添加篩選條件
        if (area && area.trim()) {
            whereConditions.push(`t.area = '${area.trim().replace(/'/g, "''")}'`);
        }

        if (duration_type) {
            switch (duration_type) {
                case '週末遊':
                    whereConditions.push('DATEDIFF(t.end_date, t.start_date) + 1 <= 2');
                    break;
                case '短期旅行':
                    whereConditions.push('DATEDIFF(t.end_date, t.start_date) + 1 BETWEEN 3 AND 5');
                    break;
                case '長假期':
                    whereConditions.push('DATEDIFF(t.end_date, t.start_date) + 1 BETWEEN 6 AND 10');
                    break;
                case '深度旅行':
                    whereConditions.push('DATEDIFF(t.end_date, t.start_date) + 1 > 10');
                    break;
            }
        }

        if (season) {
            switch (season) {
                case '春季':
                    whereConditions.push('MONTH(t.start_date) IN (3,4,5)');
                    break;
                case '夏季':
                    whereConditions.push('MONTH(t.start_date) IN (6,7,8)');
                    break;
                case '秋季':
                    whereConditions.push('MONTH(t.start_date) IN (9,10,11)');
                    break;
                case '冬季':
                    whereConditions.push('MONTH(t.start_date) IN (12,1,2)');
                    break;
            }
        }

        const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

        switch (type) {
            case 'all':
                // 全部行程 - 按開始日期排序
                sql = `
                    ${baseSelect}
                    ${whereClause}
                    ORDER BY t.start_date DESC
                    LIMIT 50
                `;
                break;

            case 'popular':
                // 熱門推薦 - 基於多種因素的綜合排序
                sql = `
                    ${baseSelect}
                    ${whereClause}
                    ORDER BY 
                        (CASE WHEN t.start_date >= CURDATE() THEN 3 ELSE 1 END) DESC,
                        DATEDIFF(t.end_date, t.start_date) DESC,
                        t.start_date ASC
                    LIMIT 50
                `;
                break;

            case 'latest':
                // 最新行程 - 按建立時間排序（這裡用 trip_id 代替，因為通常 ID 越大越新）
                sql = `
                    ${baseSelect}
                    ${whereClause}
                    ORDER BY t.trip_id DESC
                    LIMIT 50
                `;
                break;

            case 'upcoming':
                // 即將出發 - 只顯示未來的行程
                sql = `
                    ${baseSelect}
                    WHERE t.start_date >= CURDATE()
                    ${whereConditions.length > 0 ? 'AND ' + whereConditions.join(' AND ') : ''}
                    ORDER BY t.start_date ASC
                    LIMIT 50
                `;
                break;

            case 'duration':
                // 按行程長度排行
                sql = `
                    ${baseSelect}
                    ${whereClause}
                    ORDER BY duration_days DESC, t.start_date ASC
                    LIMIT 50
                `;
                break;

            case 'season':
                // 季節性排行榜
                sql = `
                    ${baseSelect}
                    ${whereClause}
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

            case 'area':
                // 按地區分組，每個地區最新的行程
                sql = `
                    ${baseSelect}
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
                    ${whereConditions.length > 0 ? 'AND ' + whereConditions.join(' AND ') : ''}
                    ORDER BY t.area ASC, t.start_date DESC
                    LIMIT 50
                `;
                break;

            default:
                // 預設情況，顯示所有行程
                sql = `
                    ${baseSelect}
                    ${whereClause}
                    ORDER BY t.start_date DESC
                    LIMIT 50
                `;
                break;
        }

        console.log('執行增強排行榜查詢...');
        const trips = await query(sql);
        console.log('增強排行榜結果:', trips.length, '筆');

        res.status(200).json({
            success: true,
            data: trips,
            ranking_type: type,
            count: trips.length,
            filters: {
                duration_type,
                season,
                area
            },
            timestamp: new Date().toISOString()
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