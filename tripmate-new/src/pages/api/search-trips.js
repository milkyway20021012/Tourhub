import { query } from '../../lib/db';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({
            success: false,
            message: '不允許的請求方法'
        });
    }

    try {
        const {
            keyword = '',
            limit = 50,
            offset = 0
        } = req.query;

        console.log('search-trips API 被呼叫，關鍵字:', keyword);

        // 檢查關鍵字
        if (!keyword || keyword.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: '請提供搜尋關鍵字',
                trips: []
            });
        }

        const searchKeyword = keyword.trim();
        const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 50));
        const offsetNum = Math.max(0, parseInt(offset) || 0);

        console.log('搜尋參數:', {
            keyword: searchKeyword,
            limit: limitNum,
            offset: offsetNum
        });

        // 構建搜尋查詢
        // 搜尋範圍：標題、描述、地區
        const searchSql = `
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
                END as status,
                (
                    CASE WHEN t.title LIKE ? THEN 10 ELSE 0 END +
                    CASE WHEN t.area LIKE ? THEN 8 ELSE 0 END +
                    CASE WHEN t.description LIKE ? THEN 3 ELSE 0 END
                ) as relevance_score
            FROM line_trips t
            WHERE (
                t.title LIKE ? OR 
                t.area LIKE ? OR 
                t.description LIKE ?
            )
            AND t.title IS NOT NULL 
            AND t.area IS NOT NULL
            ORDER BY relevance_score DESC, t.start_date DESC
            LIMIT ? OFFSET ?
        `;

        // 準備搜尋參數（使用 LIKE 進行模糊搜尋）
        const searchPattern = `%${searchKeyword}%`;
        const searchParams = [
            searchPattern, // title 權重計算
            searchPattern, // area 權重計算  
            searchPattern, // description 權重計算
            searchPattern, // WHERE title
            searchPattern, // WHERE area
            searchPattern, // WHERE description
            limitNum,
            offsetNum
        ];

        console.log('執行搜尋 SQL:', searchSql);
        console.log('搜尋參數:', searchParams);

        // 執行搜尋
        const trips = await query(searchSql, searchParams);

        console.log('搜尋結果數量:', trips.length);

        // 獲取總數（用於分頁）
        const countSql = `
            SELECT COUNT(*) as total
            FROM line_trips t
            WHERE (
                t.title LIKE ? OR 
                t.area LIKE ? OR 
                t.description LIKE ?
            )
            AND t.title IS NOT NULL 
            AND t.area IS NOT NULL
        `;

        const countParams = [searchPattern, searchPattern, searchPattern];
        const countResult = await query(countSql, countParams);
        const total = countResult[0]?.total || 0;

        console.log('搜尋總數:', total);

        // 如果沒有找到結果，嘗試更寬鬆的搜尋
        if (trips.length === 0 && searchKeyword.length > 2) {
            console.log('嘗試更寬鬆的搜尋...');

            // 分割關鍵字進行更寬鬆的搜尋
            const keywords = searchKeyword.split(/\s+/).filter(k => k.length > 0);

            if (keywords.length > 1) {
                const looseSql = `
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
                    WHERE (
                        ${keywords.map(() => '(t.title LIKE ? OR t.area LIKE ? OR t.description LIKE ?)').join(' OR ')}
                    )
                    AND t.title IS NOT NULL 
                    AND t.area IS NOT NULL
                    ORDER BY t.start_date DESC
                    LIMIT ?
                `;

                const looseParams = [];
                keywords.forEach(keyword => {
                    const pattern = `%${keyword}%`;
                    looseParams.push(pattern, pattern, pattern);
                });
                looseParams.push(limitNum);

                console.log('執行寬鬆搜尋 SQL:', looseSql);
                const looseTrips = await query(looseSql, looseParams);

                if (looseTrips.length > 0) {
                    console.log('寬鬆搜尋找到結果:', looseTrips.length);
                    return res.status(200).json({
                        success: true,
                        trips: looseTrips,
                        total: looseTrips.length,
                        searchType: 'loose',
                        keyword: searchKeyword,
                        message: `找到 ${looseTrips.length} 個相關行程（擴展搜尋）`
                    });
                }
            }
        }

        // 返回搜尋結果
        res.status(200).json({
            success: true,
            trips: trips,
            total: total,
            searchType: 'exact',
            keyword: searchKeyword,
            pagination: {
                limit: limitNum,
                offset: offsetNum,
                hasMore: total > offsetNum + trips.length
            },
            message: trips.length > 0 ?
                `找到 ${trips.length} 個相關行程` :
                '沒有找到相關行程，請嘗試其他關鍵字'
        });

    } catch (error) {
        console.error('search-trips API 錯誤:', error);

        res.status(500).json({
            success: false,
            message: '搜尋失敗，請稍後再試',
            error: error.message,
            trips: [],
            total: 0
        });
    }
}