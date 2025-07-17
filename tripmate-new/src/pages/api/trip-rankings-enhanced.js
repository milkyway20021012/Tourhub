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
            area = '',
            page = 1,
            limit = 10,
            sort_by = 'date' // 新增：排序方式參數
        } = req.query;

        console.log('trip-rankings-enhanced API 被呼叫，類型:', type, '頁碼:', page, '排序:', sort_by);

        // 處理分頁參數
        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
        const offset = (pageNum - 1) * limitNum;

        let sql = '';
        let countSql = '';
        let whereConditions = [];

        // 確保行程統計表存在
        await ensureStatsTable();

        // 基本查詢 - 添加統計數據
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
                END as status,
                COALESCE(ts.favorite_count, 0) as favorite_count,
                COALESCE(ts.share_count, 0) as share_count,
                COALESCE(ts.view_count, 0) as view_count,
                COALESCE(ts.popularity_score, 0) as popularity_score
            FROM line_trips t
            LEFT JOIN trip_stats ts ON t.trip_id = ts.trip_id
        `;

        // 基本計數查詢
        const baseCount = `
            SELECT COUNT(*) as total
            FROM line_trips t
            LEFT JOIN trip_stats ts ON t.trip_id = ts.trip_id
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

        // 構建計數SQL
        countSql = `${baseCount} ${whereClause}`;

        // 根據排序方式構建不同的 ORDER BY
        let orderByClause = '';
        switch (sort_by) {
            case 'popularity':
                // 用戶行為驅動排行
                orderByClause = `ORDER BY 
                    COALESCE(ts.popularity_score, 0) DESC,
                    COALESCE(ts.favorite_count, 0) DESC,
                    COALESCE(ts.share_count, 0) DESC,
                    COALESCE(ts.view_count, 0) DESC,
                    t.start_date DESC`;
                break;
            case 'favorites':
                // 按收藏數排序
                orderByClause = `ORDER BY 
                    COALESCE(ts.favorite_count, 0) DESC,
                    COALESCE(ts.popularity_score, 0) DESC,
                    t.start_date DESC`;
                break;
            case 'shares':
                // 按分享數排序
                orderByClause = `ORDER BY 
                    COALESCE(ts.share_count, 0) DESC,
                    COALESCE(ts.popularity_score, 0) DESC,
                    t.start_date DESC`;
                break;
            case 'views':
                // 按查看數排序
                orderByClause = `ORDER BY 
                    COALESCE(ts.view_count, 0) DESC,
                    COALESCE(ts.popularity_score, 0) DESC,
                    t.start_date DESC`;
                break;
            case 'latest':
                // 按最新排序
                orderByClause = `ORDER BY t.trip_id DESC, t.start_date DESC`;
                break;
            case 'upcoming':
                // 按即將出發排序
                orderByClause = `ORDER BY t.start_date ASC`;
                break;
            case 'date':
            default:
                // 預設按日期排序
                orderByClause = `ORDER BY t.start_date DESC`;
                break;
        }

        // 如果是即將出發的特殊處理
        if (sort_by === 'upcoming') {
            const upcomingWhere = whereConditions.length > 0 ?
                `WHERE t.start_date >= CURDATE() AND ${whereConditions.join(' AND ')}` :
                'WHERE t.start_date >= CURDATE()';

            sql = `
                ${baseSelect}
                ${upcomingWhere}
                ${orderByClause}
                LIMIT ${limitNum} OFFSET ${offset}
            `;

            countSql = `
                ${baseCount}
                ${upcomingWhere}
            `;
        } else {
            sql = `
                ${baseSelect}
                ${whereClause}
                ${orderByClause}
                LIMIT ${limitNum} OFFSET ${offset}
            `;
        }

        console.log('執行查詢，排序方式:', sort_by);

        // 同時執行數據查詢和計數查詢
        const [trips, countResult] = await Promise.all([
            query(sql),
            query(countSql)
        ]);

        const total = countResult[0]?.total || 0;
        const totalPages = Math.ceil(total / limitNum);
        const hasNextPage = pageNum < totalPages;
        const hasPrevPage = pageNum > 1;

        console.log('查詢結果:', {
            trips: trips.length,
            total: total,
            totalPages: totalPages,
            currentPage: pageNum,
            sortBy: sort_by
        });

        res.status(200).json({
            success: true,
            data: trips,
            ranking_type: type,
            sort_by: sort_by,
            count: trips.length,
            pagination: {
                currentPage: pageNum,
                totalPages: totalPages,
                total: total,
                limit: limitNum,
                hasNextPage: hasNextPage,
                hasPrevPage: hasPrevPage,
                offset: offset
            },
            filters: {
                duration_type,
                season,
                area,
                sort_by
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('trip-rankings-enhanced API 錯誤:', error);
        res.status(500).json({
            success: false,
            message: '伺服器錯誤',
            error: error.message,
            pagination: {
                currentPage: 1,
                totalPages: 0,
                total: 0,
                limit: parseInt(req.query.limit) || 10,
                hasNextPage: false,
                hasPrevPage: false,
                offset: 0
            }
        });
    }
}

// 確保統計表存在
async function ensureStatsTable() {
    try {
        const createTableSQL = `
            CREATE TABLE IF NOT EXISTS trip_stats (
                trip_id INT PRIMARY KEY,
                favorite_count INT DEFAULT 0 COMMENT '收藏次數',
                share_count INT DEFAULT 0 COMMENT '分享次數',
                view_count INT DEFAULT 0 COMMENT '查看次數',
                popularity_score DECIMAL(10,2) DEFAULT 0 COMMENT '綜合熱度分數',
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (trip_id) REFERENCES line_trips(trip_id) ON DELETE CASCADE,
                INDEX idx_popularity (popularity_score DESC),
                INDEX idx_favorites (favorite_count DESC),
                INDEX idx_shares (share_count DESC),
                INDEX idx_views (view_count DESC)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='行程統計表'
        `;

        await query(createTableSQL);
        console.log('統計表確認存在');
    } catch (error) {
        console.error('創建統計表失敗:', error);
    }
}