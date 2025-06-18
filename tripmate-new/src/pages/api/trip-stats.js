// pages/api/trip-stats.js - 行程統計 API
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
            FROM trip
        `);

        // 獲取平均預算（排除 NULL 值）
        const avgBudgetResult = await query(`
            SELECT AVG(budget) as avg_budget 
            FROM trip 
            WHERE budget IS NOT NULL AND budget > 0
        `);

        // 獲取最熱門地區
        const popularAreaResult = await query(`
            SELECT area, COUNT(*) as area_count 
            FROM trip 
            WHERE area IS NOT NULL AND area != ''
            GROUP BY area 
            ORDER BY area_count DESC 
            LIMIT 1
        `);

        // 獲取平均行程長度
        const avgDurationResult = await query(`
            SELECT AVG(DATEDIFF(end_date, start_date) + 1) as avg_duration 
            FROM trip 
            WHERE start_date IS NOT NULL AND end_date IS NOT NULL
        `);

        // 獲取預算分布統計
        const budgetDistributionResult = await query(`
            SELECT 
                CASE 
                    WHEN budget < 10000 THEN '經濟型'
                    WHEN budget < 30000 THEN '中等型'
                    WHEN budget < 50000 THEN '豪華型'
                    WHEN budget >= 50000 THEN '頂級型'
                    ELSE '未設定'
                END as budget_range,
                COUNT(*) as count
            FROM trip 
            GROUP BY budget_range
            ORDER BY 
                CASE 
                    WHEN budget < 10000 THEN 1
                    WHEN budget < 30000 THEN 2
                    WHEN budget < 50000 THEN 3
                    WHEN budget >= 50000 THEN 4
                    ELSE 5
                END
        `);

        // 獲取地區分布統計
        const areaDistributionResult = await query(`
            SELECT area, COUNT(*) as count 
            FROM trip 
            WHERE area IS NOT NULL AND area != ''
            GROUP BY area 
            ORDER BY count DESC 
            LIMIT 10
        `);

        // 獲取最近30天新增行程數
        const recentTripsResult = await query(`
            SELECT COUNT(*) as recent_trips 
            FROM trip 
            WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        `);

        // 獲取即將出發的行程數
        const upcomingTripsResult = await query(`
            SELECT COUNT(*) as upcoming_trips 
            FROM trip 
            WHERE start_date >= CURDATE()
        `);

        // 組織回應資料
        const stats = {
            totalTrips: totalTripsResult[0]?.total_trips || 0,
            avgBudget: avgBudgetResult[0]?.avg_budget || 0,
            popularArea: popularAreaResult[0]?.area || '無',
            avgDuration: avgDurationResult[0]?.avg_duration || 0,
            recentTrips: recentTripsResult[0]?.recent_trips || 0,
            upcomingTrips: upcomingTripsResult[0]?.upcoming_trips || 0,
            budgetDistribution: budgetDistributionResult,
            areaDistribution: areaDistributionResult
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
            avgBudget: 0,
            popularArea: '無',
            avgDuration: 0,
            recentTrips: 0,
            upcomingTrips: 0,
            budgetDistribution: [],
            areaDistribution: []
        });
    }
}