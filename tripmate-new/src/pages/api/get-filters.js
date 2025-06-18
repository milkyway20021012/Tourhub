// pages/api/get-filters.js - 確保從資料庫獲取地區和標籤
import { query } from '../../lib/db';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: '不允許的請求方法' });
    }

    try {
        console.log('get-filters API 被呼叫');

        // 獲取所有地區 - 直接從資料庫查詢
        const areasResult = await query(`
            SELECT DISTINCT area 
            FROM trip 
            WHERE area IS NOT NULL AND area != '' AND TRIM(area) != ''
            ORDER BY area
        `);

        // 獲取所有標籤 - 從資料庫查詢並處理
        const tagsResult = await query(`
            SELECT DISTINCT tags
            FROM trip 
            WHERE tags IS NOT NULL AND tags != '' AND TRIM(tags) != ''
        `);

        // 處理地區資料
        const areas = areasResult.map(row => row.area.trim()).filter(area => area.length > 0);

        // 處理標籤資料 - 分割逗號分隔的標籤
        const allTagsSet = new Set();
        tagsResult.forEach(row => {
            if (row.tags && row.tags.trim()) {
                const tagArray = row.tags.split(',');
                tagArray.forEach(tag => {
                    const trimmedTag = tag.trim();
                    if (trimmedTag.length > 0) {
                        allTagsSet.add(trimmedTag);
                    }
                });
            }
        });

        const tags = Array.from(allTagsSet).sort();

        console.log('從資料庫找到的地區:', areas.length, '個');
        console.log('地區列表:', areas);
        console.log('從資料庫找到的標籤:', tags.length, '個');
        console.log('標籤列表:', tags.slice(0, 10), tags.length > 10 ? '...' : '');

        // 驗證資料
        if (areas.length === 0) {
            console.warn('警告: 資料庫中沒有找到任何地區資料');
        }

        if (tags.length === 0) {
            console.warn('警告: 資料庫中沒有找到任何標籤資料');
        }

        res.status(200).json({
            success: true,
            areas: areas,
            tags: tags,
            metadata: {
                areas_count: areas.length,
                tags_count: tags.length,
                source: 'database',
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('get-filters API 錯誤:', error);
        res.status(500).json({
            success: false,
            message: '伺服器錯誤',
            error: error.message,
            areas: [],
            tags: []
        });
    }
}

// pages/api/trips-paged.js - 繁體中文版本
import { query } from '../../lib/db';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: '不允許的請求方法' });
    }

    try {
        console.log('trips-paged API 被呼叫');
        console.log('查詢參數:', req.query);

        const {
            page = 1,
            limit = 10,
            sort = 'created_at',
            order = 'DESC',
            area = '',
            tag = '',
            startDate = '',
            endDate = '',
            search = ''
        } = req.query;

        // 基本查詢，只包含行程基本資訊
        let baseSql = `
            SELECT 
                t.trip_id,
                t.title,
                t.description,
                t.start_date,
                t.end_date,
                t.area,
                t.tags,
                t.budget,
                t.created_at,
                t.updated_at
            FROM trip t
        `;

        // 建構篩選條件
        let whereConditions = [];

        if (area && area.trim()) {
            whereConditions.push("t.area = '" + area.trim().replace(/'/g, "''") + "'");
            console.log('套用地區篩選:', area.trim());
        }

        if (search && search.trim()) {
            const searchTerm = search.trim().replace(/'/g, "''");
            whereConditions.push("(t.title LIKE '%" + searchTerm + "%' OR t.description LIKE '%" + searchTerm + "%')");
            console.log('套用搜尋篩選:', searchTerm);
        }

        if (tag && tag.trim()) {
            const tagTerm = tag.trim().replace(/'/g, "''");
            whereConditions.push("t.tags LIKE '%" + tagTerm + "%'");
            console.log('套用標籤篩選:', tagTerm);
        }

        if (startDate && startDate.trim()) {
            whereConditions.push("t.start_date >= '" + startDate.trim() + "'");
            console.log('套用開始日期篩選:', startDate.trim());
        }

        if (endDate && endDate.trim()) {
            whereConditions.push("t.end_date <= '" + endDate.trim() + "'");
            console.log('套用結束日期篩選:', endDate.trim());
        }

        // 組建 WHERE 子句
        let whereSql = '';
        if (whereConditions.length > 0) {
            whereSql = ' WHERE ' + whereConditions.join(' AND ');
        }

        // 計算總數
        const countSql = `
            SELECT COUNT(*) as total 
            FROM trip t
            ${whereSql}
        `;

        console.log('計數 SQL:', countSql);
        const countResult = await query(countSql, []);
        const total = countResult[0].total;

        // 處理分頁
        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
        const offset = (pageNum - 1) * limitNum;
        const totalPages = Math.ceil(total / limitNum);

        // 處理排序
        const allowedSortFields = ['title', 'start_date', 'end_date', 'area', 'created_at'];
        const sortField = allowedSortFields.includes(sort) ? sort : 'created_at';
        const sortOrder = (order && order.toUpperCase() === 'ASC') ? 'ASC' : 'DESC';

        // 組建資料查詢
        const dataSql = `
            ${baseSql}
            ${whereSql}
            ORDER BY t.${sortField} ${sortOrder}
            LIMIT ${limitNum} OFFSET ${offset}
        `;

        console.log('資料 SQL:', dataSql);
        const trips = await query(dataSql, []);

        console.log('查詢成功，行數:', trips.length);

        res.status(200).json({
            success: true,
            data: trips,
            pagination: {
                total: parseInt(total),
                total_pages: totalPages,
                current_page: pageNum,
                limit: limitNum
            },
            filters_applied: {
                area: area || null,
                tag: tag || null,
                startDate: startDate || null,
                endDate: endDate || null,
                search: search || null
            }
        });

    } catch (error) {
        console.error('trips-paged 錯誤:', error);
        res.status(500).json({
            success: false,
            message: '伺服器錯誤',
            error: error.message,
            code: error.code
        });
    }
}

// pages/api/trip-rankings-simplified.js - 繁體中文簡化版排行榜 API
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
                        t.tags,
                        t.budget,
                        t.created_at
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
                        t.tags,
                        t.budget,
                        t.created_at
                    FROM trip t 
                    WHERE t.start_date >= CURDATE()
                    ORDER BY t.start_date ASC, t.created_at DESC
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
            count: trips.length
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

// pages/api/trip-detail.js - 繁體中文簡化版行程詳情 API
import { query } from '../../lib/db';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: '不允許的請求方法' });
    }

    try {
        const { id } = req.query;

        console.log('trip-detail API 被呼叫，ID:', id);

        if (!id) {
            return res.status(400).json({ message: '缺少行程 ID' });
        }

        // 獲取行程資訊 - 簡化版本，不包含建立者資訊
        const tripSql = `
            SELECT 
                t.trip_id,
                t.user_id,
                t.title,
                t.description,
                t.start_date,
                t.end_date,
                t.area,
                t.tags,
                t.budget,
                t.created_at,
                t.updated_at
            FROM trip t 
            WHERE t.trip_id = ?
        `;

        console.log('執行行程查詢，ID:', id);
        const tripResult = await query(tripSql, [parseInt(id)]);

        if (tripResult.length === 0) {
            return res.status(404).json({ message: '找不到該行程' });
        }

        console.log('找到行程:', tripResult[0].title);

        // 獲取行程細節
        const detailsSql = `
            SELECT 
                detail_id,
                trip_id,
                location,
                date,
                start_time,
                end_time
            FROM trip_detail 
            WHERE trip_id = ? 
            ORDER BY date ASC, start_time ASC
        `;

        console.log('獲取行程細節...');
        const details = await query(detailsSql, [parseInt(id)]);
        console.log('找到細節:', details.length, '筆');

        // 獲取參與者 - 簡化版本，不包含使用者名稱
        const participantsSql = `
            SELECT 
                tp.participant_id,
                tp.trip_id,
                tp.user_id,
                tp.status,
                tp.created_at
            FROM trip_participants tp 
            WHERE tp.trip_id = ?
            ORDER BY tp.created_at ASC
        `;

        console.log('獲取參與者...');
        const participants = await query(participantsSql, [parseInt(id)]);
        console.log('找到參與者:', participants.length, '位');

        res.status(200).json({
            success: true,
            trip: tripResult[0],
            details: details,
            participants: participants,
            metadata: {
                details_count: details.length,
                participants_count: participants.length
            }
        });

    } catch (error) {
        console.error('trip-detail API 錯誤:', error);
        res.status(500).json({
            success: false,
            message: '伺服器錯誤',
            error: error.message
        });
    }
}