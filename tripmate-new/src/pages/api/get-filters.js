import { query } from '../../lib/db';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: '不允許的請求方法' });
    }

    try {
        console.log('get-filters API 被呼叫');

        // 獲取所有地區 - 從 line_trips 表格查詢
        const areasResult = await query(`
            SELECT DISTINCT area 
            FROM line_trips 
            WHERE area IS NOT NULL AND area != '' AND TRIM(area) != ''
            ORDER BY area
        `);

        // 處理地區資料
        const areas = areasResult.map(row => row.area.trim()).filter(area => area.length > 0);

        // 驗證資料
        if (areas.length === 0) {
            console.warn('警告: 資料庫中沒有找到任何地區資料');
        }

        res.status(200).json({
            success: true,
            areas: areas,
            metadata: {
                areas_count: areas.length,
                source: 'line_trips table',
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('get-filters API 錯誤:', error);
        res.status(500).json({
            success: false,
            message: '伺服器錯誤',
            error: error.message,
            areas: []
        });
    }
}
