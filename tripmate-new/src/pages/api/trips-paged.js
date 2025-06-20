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
            sort = 'start_date',
            order = 'DESC',
            area = '',
            startDate = '',
            endDate = '',
            search = ''
        } = req.query;

        // 基本查詢，從 line_trips 表格獲取資料
        let baseSql = `
            SELECT 
                t.trip_id,
                t.title,
                t.description,
                t.start_date,
                t.end_date,
                t.area,
                t.line_user_id
            FROM line_trips t
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
            FROM line_trips t
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
        const allowedSortFields = ['title', 'area', 'start_date', 'end_date'];
        const sortField = allowedSortFields.includes(sort) ? sort : 'start_date';
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
                startDate: startDate || null,
                endDate: endDate || null,
                search: search || null
            },
            sort_info: {
                field: sortField,
                order: sortOrder
            },
            table_source: 'line_trips'
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
