import { query } from '../../lib/db';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: '不允許的請求方法' });
    }

    try {
        console.log('trip-stats API 被呼叫');

        // 獲取總行程數
        const totalTripsResult = await query(`
            SELECT COUNT(*) as total_trips 
            FROM line_trips
        `);

        // 獲取最熱門地區
        const popularAreaResult = await query(`
            SELECT area, COUNT(*) as area_count 
            FROM line_trips 
            WHERE area IS NOT NULL AND area != ''
            GROUP BY area 
            ORDER BY area_count DESC 
            LIMIT 1
        `);

        // 獲取平均行程長度
        const avgDurationResult = await query(`
            SELECT AVG(DATEDIFF(end_date, start_date) + 1) as avg_duration 
            FROM line_trips 
            WHERE start_date IS NOT NULL AND end_date IS NOT NULL
        `);

        // 獲取地區分布統計
        const areaDistributionResult = await query(`
            SELECT area, COUNT(*) as count 
            FROM line_trips 
            WHERE area IS NOT NULL AND area != ''
            GROUP BY area 
            ORDER BY count DESC 
            LIMIT 10
        `);

        // 獲取最近30天新增行程數
        const recentTripsResult = await query(`
            SELECT COUNT(*) as recent_trips 
            FROM line_trips 
            WHERE start_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        `);

        // 獲取即將出發的行程數
        const upcomingTripsResult = await query(`
            SELECT COUNT(*) as upcoming_trips 
            FROM line_trips 
            WHERE start_date >= CURDATE()
        `);

        // 組織回應資料
        const stats = {
            totalTrips: totalTripsResult[0]?.total_trips || 0,
            popularArea: popularAreaResult[0]?.area || '無',
            avgDuration: avgDurationResult[0]?.avg_duration || 0,
            recentTrips: recentTripsResult[0]?.recent_trips || 0,
            upcomingTrips: upcomingTripsResult[0]?.upcoming_trips || 0,
            areaDistribution: areaDistributionResult,
            table_source: 'line_trips'
        };

        console.log('統計資料獲取成功:', stats);

        res.status(200).json(stats);

    } catch (error) {
        console.error('trip-stats API 錯誤:', error);
        res.status(500).json({
            success: false,
            message: '伺服器錯誤',
            error: error.message,
            // 返回預設值以防錯誤
            totalTrips: 0,
            popularArea: '無',
            avgDuration: 0,
            recentTrips: 0,
            upcomingTrips: 0,
            areaDistribution: []
        });
    }
}