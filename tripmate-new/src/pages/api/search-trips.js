import { query } from '../../lib/db';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({
            success: false,
            message: '只支援 GET 請求'
        });
    }

    try {
        const { keyword, limit = 10, offset = 0 } = req.query;

        if (!keyword || keyword.trim() === '') {
            return res.status(400).json({
                success: false,
                message: '請提供搜尋關鍵字'
            });
        }

        const searchKeyword = keyword.trim();
        const limitNum = Math.min(parseInt(limit) || 10, 50);
        const offsetNum = parseInt(offset) || 0;

        console.log('search-trips API 被呼叫，關鍵字:', searchKeyword);

        // 使用簡化的搜索
        const trips = await performSimpleSearch(searchKeyword, limitNum, offsetNum);

        const response = {
            success: true,
            trips: trips,
            total: trips.length,
            searchType: 'simple',
            keyword: searchKeyword,
            pagination: {
                limit: limitNum,
                offset: offsetNum,
                hasMore: false
            },
            message: trips.length > 0 ?
                `找到 ${trips.length} 個相關行程` :
                '沒有找到相關行程，請嘗試其他關鍵字'
        };

        console.log('最終搜索結果:', response);
        return res.status(200).json(response);

    } catch (error) {
        console.error('search-trips API 錯誤:', error);
        return res.status(500).json({
            success: false,
            message: '伺服器內部錯誤',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

// 簡化的搜索函數
async function performSimpleSearch(searchKeyword, limit, offset) {
    const searchPattern = `%${searchKeyword}%`;

    const searchSql = `
        SELECT 
            t.trip_id,
            t.title,
            t.description,
            t.start_date,
            t.end_date,
            t.area,
            t.line_user_id,
            DATEDIFF(t.end_date, t.start_date) + 1 as duration_days
        FROM line_trips t
        WHERE (
            t.title LIKE ? OR 
            t.area LIKE ? OR 
            t.description LIKE ?
        )
        AND t.title IS NOT NULL 
        AND t.area IS NOT NULL
        ORDER BY t.start_date DESC
        LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
    `;

    const searchParams = [
        searchPattern, searchPattern, searchPattern // WHERE條件
    ];

    try {
        const results = await query(searchSql, searchParams);

        // 添加計算字段
        return results.map(trip => ({
            ...trip,
            season: getSeasonFromDate(trip.start_date),
            duration_type: getDurationType(trip.duration_days),
            status: getTripStatus(trip.start_date, trip.end_date)
        }));
    } catch (error) {
        console.error('搜索失敗:', error);
        return [];
    }
}

// 輔助函數
function getSeasonFromDate(startDate) {
    if (!startDate) return '未知';
    const month = new Date(startDate).getMonth() + 1;
    if ([3, 4, 5].includes(month)) return '春季';
    if ([6, 7, 8].includes(month)) return '夏季';
    if ([9, 10, 11].includes(month)) return '秋季';
    return '冬季';
}

function getDurationType(days) {
    if (!days) return '未知';
    if (days <= 2) return '週末遊';
    if (days <= 5) return '短期旅行';
    if (days <= 10) return '長假期';
    return '深度旅行';
}

function getTripStatus(startDate, endDate) {
    if (!startDate || !endDate) return '未知';
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > now) return '即將出發';
    if (start <= now && end >= now) return '進行中';
    return '已結束';
}
