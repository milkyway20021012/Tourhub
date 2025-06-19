import { query } from '../../lib/db';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: '不允許的請求方法' });
    }

    try {
        console.log('trip-statistics API 被呼叫');

        // 獲取總行程數
        const totalTripsResult = await query(`
            SELECT COUNT(*) as total_trips 
            FROM line_trips
        `);

        // 獲取平均行程長度
        const avgDurationResult = await query(`
            SELECT AVG(DATEDIFF(end_date, start_date) + 1) as avg_duration 
            FROM line_trips 
            WHERE start_date IS NOT NULL AND end_date IS NOT NULL
        `);

        // 獲取最熱門地區 (前3名)
        const popularAreasResult = await query(`
            SELECT area, COUNT(*) as count 
            FROM line_trips 
            WHERE area IS NOT NULL AND area != ''
            GROUP BY area 
            ORDER BY count DESC 
            LIMIT 3
        `);

        // 獲取行程長度分布
        const durationDistributionResult = await query(`
            SELECT 
                CASE 
                    WHEN DATEDIFF(end_date, start_date) + 1 <= 2 THEN '週末遊 (1-2天)'
                    WHEN DATEDIFF(end_date, start_date) + 1 <= 5 THEN '短期旅行 (3-5天)'
                    WHEN DATEDIFF(end_date, start_date) + 1 <= 10 THEN '長假期 (6-10天)'
                    ELSE '深度旅行 (10天以上)'
                END as duration_type,
                COUNT(*) as count
            FROM line_trips 
            WHERE start_date IS NOT NULL AND end_date IS NOT NULL
            GROUP BY duration_type
            ORDER BY 
                CASE 
                    WHEN DATEDIFF(end_date, start_date) + 1 <= 2 THEN 1
                    WHEN DATEDIFF(end_date, start_date) + 1 <= 5 THEN 2
                    WHEN DATEDIFF(end_date, start_date) + 1 <= 10 THEN 3
                    ELSE 4
                END
        `);

        // 獲取季節分布
        const seasonDistributionResult = await query(`
            SELECT 
                CASE 
                    WHEN MONTH(start_date) IN (3,4,5) THEN '春季'
                    WHEN MONTH(start_date) IN (6,7,8) THEN '夏季'
                    WHEN MONTH(start_date) IN (9,10,11) THEN '秋季'
                    ELSE '冬季'
                END as season,
                COUNT(*) as count
            FROM line_trips 
            WHERE start_date IS NOT NULL
            GROUP BY season
            ORDER BY 
                CASE 
                    WHEN MONTH(start_date) IN (3,4,5) THEN 1
                    WHEN MONTH(start_date) IN (6,7,8) THEN 2
                    WHEN MONTH(start_date) IN (9,10,11) THEN 3
                    ELSE 4
                END
        `);

        // 獲取即將出發的行程數
        const upcomingTripsResult = await query(`
            SELECT COUNT(*) as upcoming_trips 
            FROM line_trips 
            WHERE start_date >= CURDATE() AND start_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
        `);

        // 獲取最近新增的行程數
        const recentTripsResult = await query(`
            SELECT COUNT(*) as recent_trips 
            FROM line_trips 
            WHERE start_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        `);

        // 組織回應資料
        const statistics = {
            overview: {
                totalTrips: totalTripsResult[0]?.total_trips || 0,
                avgDuration: Math.round(avgDurationResult[0]?.avg_duration || 0),
                upcomingTrips: upcomingTripsResult[0]?.upcoming_trips || 0,
                recentTrips: recentTripsResult[0]?.recent_trips || 0
            },
            popularAreas: popularAreasResult,
            durationDistribution: durationDistributionResult,
            seasonDistribution: seasonDistributionResult,
            timestamp: new Date().toISOString()
        };

        console.log('統計資料獲取成功');
        res.status(200).json(statistics);

    } catch (error) {
        console.error('trip-statistics API 錯誤:', error);
        res.status(500).json({
            success: false,
            message: '伺服器錯誤',
            error: error.message
        });
    }
}