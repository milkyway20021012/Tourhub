import { query } from '../../lib/db';

export default async function handler(req, res) {
    console.log('🔥 user-shares API 被調用:', req.method);
    console.log('📝 查詢參數:', req.query);
    console.log('📝 請求主體:', req.body);

    try {
        if (req.method === 'POST') {
            return await recordShare(req, res);
        } else if (req.method === 'GET') {
            return await getUserShares(req, res);
        } else {
            return res.status(405).json({
                success: false,
                message: '不允許的請求方法'
            });
        }
    } catch (error) {
        console.error('💥 user-shares API 錯誤:', error);
        return res.status(500).json({
            success: false,
            message: '伺服器錯誤',
            error: error.message
        });
    }
}

async function recordShare(req, res) {
    const { line_user_id, trip_id, share_type, share_content } = req.body;

    console.log('📤 記錄分享:', { line_user_id, trip_id, share_type });

    if (!line_user_id || !trip_id || !share_type) {
        return res.status(400).json({
            success: false,
            message: '缺少必要參數'
        });
    }

    try {
        // 1. 確保分享記錄表存在
        console.log('🏗️ 確保分享記錄表存在...');
        const createTableSQL = `
            CREATE TABLE IF NOT EXISTS user_shares (
                id INT AUTO_INCREMENT PRIMARY KEY,
                line_user_id VARCHAR(255) NOT NULL,
                trip_id INT NOT NULL,
                share_type VARCHAR(50) NOT NULL COMMENT '分享類型: text, link, image',
                share_content JSON COMMENT '分享內容詳情',
                shared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_user_id (line_user_id),
                INDEX idx_trip_id (trip_id),
                INDEX idx_shared_at (shared_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `;
        await query(createTableSQL);
        console.log('✅ 分享記錄表確認存在');

        // 2. 驗證行程是否存在
        const tripCheckSQL = `SELECT trip_id, title FROM line_trips WHERE trip_id = ${parseInt(trip_id)}`;
        console.log('🔍 檢查行程SQL:', tripCheckSQL);

        const tripExists = await query(tripCheckSQL);

        if (tripExists.length === 0) {
            console.log('❌ 行程不存在，ID:', trip_id);
            return res.status(404).json({
                success: false,
                message: '行程不存在',
                trip_id: trip_id
            });
        }

        console.log('✅ 行程存在:', tripExists[0].title);

        // 3. 記錄分享活動
        const shareContentJson = share_content ? JSON.stringify(share_content) : null;
        const insertSQL = `
            INSERT INTO user_shares (line_user_id, trip_id, share_type, share_content) 
            VALUES ('${line_user_id}', ${parseInt(trip_id)}, '${share_type}', ${shareContentJson ? `'${shareContentJson.replace(/'/g, "''")}'` : 'NULL'})
        `;
        console.log('💾 插入分享記錄SQL:', insertSQL);

        const result = await query(insertSQL);

        console.log('✅ 分享記錄成功，ID:', result.insertId);

        // 4. 更新行程分享統計（可選）
        try {
            const updateShareCountSQL = `
                UPDATE line_trips 
                SET share_count = COALESCE(share_count, 0) + 1,
                    last_shared_at = CURRENT_TIMESTAMP
                WHERE trip_id = ${parseInt(trip_id)}
            `;
            await query(updateShareCountSQL);
            console.log('✅ 行程分享統計更新成功');
        } catch (statsError) {
            console.warn('⚠️ 更新分享統計失敗:', statsError);
            // 不影響主要功能，繼續執行
        }

        return res.status(201).json({
            success: true,
            message: '分享記錄成功',
            share_id: result.insertId,
            trip_title: tripExists[0].title,
            shared_at: new Date().toISOString()
        });

    } catch (error) {
        console.error('💥 記錄分享失敗:', error);

        return res.status(500).json({
            success: false,
            message: '記錄分享失敗',
            error: error.message
        });
    }
}

async function getUserShares(req, res) {
    const { line_user_id, limit = 50, offset = 0 } = req.query;

    console.log('📊 獲取用戶分享記錄:', { line_user_id, limit, offset });

    if (!line_user_id) {
        return res.status(400).json({
            success: false,
            message: '缺少用戶 ID'
        });
    }

    try {
        // 1. 確保表存在
        const createTableSQL = `
            CREATE TABLE IF NOT EXISTS user_shares (
                id INT AUTO_INCREMENT PRIMARY KEY,
                line_user_id VARCHAR(255) NOT NULL,
                trip_id INT NOT NULL,
                share_type VARCHAR(50) NOT NULL,
                share_content JSON,
                shared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_user_id (line_user_id),
                INDEX idx_trip_id (trip_id),
                INDEX idx_shared_at (shared_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `;
        await query(createTableSQL);

        // 2. 查詢用戶分享記錄
        const sharesSQL = `
            SELECT 
                s.id,
                s.trip_id,
                s.share_type,
                s.share_content,
                s.shared_at,
                t.title as trip_title,
                t.area,
                t.start_date,
                t.end_date
            FROM user_shares s
            LEFT JOIN line_trips t ON s.trip_id = t.trip_id
            WHERE s.line_user_id = '${line_user_id}'
            ORDER BY s.shared_at DESC
            LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
        `;

        console.log('🔍 查詢分享記錄SQL:', sharesSQL);
        const shares = await query(sharesSQL);

        // 3. 獲取總數
        const countSQL = `
            SELECT COUNT(*) as total 
            FROM user_shares 
            WHERE line_user_id = '${line_user_id}'
        `;
        const countResult = await query(countSQL);
        const total = countResult[0].total;

        // 4. 處理分享內容
        const processedShares = shares.map(share => {
            let shareContent = null;
            if (share.share_content) {
                try {
                    shareContent = typeof share.share_content === 'string'
                        ? JSON.parse(share.share_content)
                        : share.share_content;
                } catch (e) {
                    console.warn('解析分享內容失敗:', e);
                }
            }

            return {
                id: share.id,
                trip_id: share.trip_id,
                trip_title: share.trip_title,
                area: share.area,
                start_date: share.start_date,
                end_date: share.end_date,
                share_type: share.share_type,
                share_content: shareContent,
                shared_at: share.shared_at
            };
        });

        console.log('✅ 分享記錄查詢成功:', processedShares.length, '筆');

        return res.status(200).json({
            success: true,
            shares: processedShares,
            total: total,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

    } catch (error) {
        console.error('💥 獲取分享記錄失敗:', error);
        return res.status(500).json({
            success: false,
            message: '獲取分享記錄失敗',
            error: error.message,
            shares: [],
            total: 0
        });
    }
}