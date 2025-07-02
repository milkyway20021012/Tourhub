import { query } from '../../lib/db';

export default async function handler(req, res) {
    const { method } = req;

    console.log('🔥 user-favorites API 被調用:', method);
    console.log('📝 請求數據:', req.body || req.query);

    try {
        switch (method) {
            case 'GET':
                return await getUserFavorites(req, res);
            case 'POST':
                return await addFavorite(req, res);
            case 'DELETE':
                return await removeFavorite(req, res);
            default:
                console.log('❌ 不支持的方法:', method);
                return res.status(405).json({
                    success: false,
                    message: '不允許的請求方法',
                    method: method
                });
        }
    } catch (error) {
        console.error('💥 user-favorites API 全局錯誤:', error);
        return res.status(500).json({
            success: false,
            message: '伺服器錯誤',
            error: error.message
        });
    }
}

// 獲取用戶收藏列表
async function getUserFavorites(req, res) {
    const { line_user_id, limit = 50 } = req.query;

    console.log('📋 獲取收藏列表 - 用戶ID:', line_user_id, '限制:', limit);

    if (!line_user_id) {
        console.log('❌ 缺少用戶 ID');
        return res.status(400).json({
            success: false,
            message: '缺少用戶 ID'
        });
    }

    try {
        // 首先檢查 user_favorites 表是否存在
        console.log('🔍 檢查 user_favorites 表是否存在...');

        const checkTableQuery = `
            SELECT COUNT(*) as table_exists 
            FROM information_schema.tables 
            WHERE table_schema = DATABASE() 
            AND table_name = 'user_favorites'
        `;

        const tableCheck = await query(checkTableQuery);
        console.log('📊 表檢查結果:', tableCheck);

        if (tableCheck[0].table_exists === 0) {
            console.log('⚠️ user_favorites 表不存在，嘗試創建...');

            // 創建表
            const createTableSQL = `
                CREATE TABLE user_favorites (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    line_user_id VARCHAR(255) NOT NULL,
                    trip_id INT NOT NULL,
                    favorited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE KEY unique_favorite (line_user_id, trip_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
            `;

            await query(createTableSQL);
            console.log('✅ user_favorites 表創建成功');
        }

        // 查詢用戶收藏
        console.log('🔍 查詢用戶收藏...');

        // 簡化查詢 - 先檢查是否有任何收藏記錄
        const simpleCheckSQL = `
            SELECT COUNT(*) as count 
            FROM user_favorites 
            WHERE line_user_id = ?
        `;

        const countResult = await query(simpleCheckSQL, [line_user_id]);
        console.log('📊 用戶收藏數量:', countResult[0].count);

        if (countResult[0].count === 0) {
            // 沒有收藏記錄
            console.log('📭 用戶沒有收藏記錄');
            return res.status(200).json({
                success: true,
                favorites: [],
                count: 0,
                user_id: line_user_id,
                message: '暫無收藏記錄'
            });
        }

        // 如果有收藏記錄，執行關聯查詢
        console.log('🔗 執行關聯查詢...');

        const joinSQL = `
            SELECT 
                t.trip_id,
                t.title,
                t.description,
                t.start_date,
                t.end_date,
                t.area,
                DATEDIFF(t.end_date, t.start_date) + 1 as duration_days,
                CASE 
                    WHEN t.start_date > CURDATE() THEN '即將出發'
                    WHEN t.start_date <= CURDATE() AND t.end_date >= CURDATE() THEN '進行中'
                    ELSE '已結束'
                END as status,
                uf.favorited_at
            FROM user_favorites uf
            INNER JOIN line_trips t ON uf.trip_id = t.trip_id
            WHERE uf.line_user_id = ?
            ORDER BY uf.favorited_at DESC
            LIMIT ?
        `;

        const limitNum = parseInt(limit) || 50;
        const favorites = await query(joinSQL, [line_user_id, limitNum]);

        console.log('✅ 查詢成功，找到', favorites.length, '個收藏');

        return res.status(200).json({
            success: true,
            favorites: favorites,
            count: favorites.length,
            user_id: line_user_id
        });

    } catch (error) {
        console.error('💥 獲取收藏列表失敗:', error);
        console.error('📋 錯誤詳情:', {
            message: error.message,
            code: error.code,
            errno: error.errno,
            sqlState: error.sqlState,
            sqlMessage: error.sqlMessage
        });

        return res.status(500).json({
            success: false,
            message: '獲取收藏列表失敗',
            error: error.message,
            code: error.code || 'UNKNOWN_ERROR'
        });
    }
}

// 添加收藏
async function addFavorite(req, res) {
    const { line_user_id, trip_id } = req.body;

    console.log('💖 添加收藏 - 用戶ID:', line_user_id, '行程ID:', trip_id);

    if (!line_user_id || !trip_id) {
        console.log('❌ 缺少必要參數');
        return res.status(400).json({
            success: false,
            message: '缺少必要參數',
            received: { line_user_id, trip_id }
        });
    }

    try {
        // 確保表存在
        const createTableSQL = `
            CREATE TABLE IF NOT EXISTS user_favorites (
                id INT AUTO_INCREMENT PRIMARY KEY,
                line_user_id VARCHAR(255) NOT NULL,
                trip_id INT NOT NULL,
                favorited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_favorite (line_user_id, trip_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `;

        await query(createTableSQL);

        // 檢查行程是否存在
        console.log('🔍 檢查行程是否存在...');
        const tripCheckSQL = 'SELECT trip_id FROM line_trips WHERE trip_id = ?';
        const tripExists = await query(tripCheckSQL, [parseInt(trip_id)]);

        if (tripExists.length === 0) {
            console.log('❌ 行程不存在，ID:', trip_id);
            return res.status(404).json({
                success: false,
                message: '行程不存在',
                trip_id: trip_id
            });
        }
        console.log('✅ 行程存在');

        // 檢查是否已經收藏
        console.log('🔍 檢查是否已收藏...');
        const existingCheckSQL = 'SELECT id FROM user_favorites WHERE line_user_id = ? AND trip_id = ?';
        const existingFavorite = await query(existingCheckSQL, [line_user_id, parseInt(trip_id)]);

        if (existingFavorite.length > 0) {
            console.log('⚠️ 已經收藏此行程');
            return res.status(409).json({
                success: false,
                message: '已經收藏此行程',
                favorite_id: existingFavorite[0].id
            });
        }

        // 添加收藏
        console.log('💾 添加收藏到數據庫...');
        const insertSQL = 'INSERT INTO user_favorites (line_user_id, trip_id) VALUES (?, ?)';
        const result = await query(insertSQL, [line_user_id, parseInt(trip_id)]);

        console.log('✅ 收藏添加成功，ID:', result.insertId);

        return res.status(201).json({
            success: true,
            message: '收藏成功',
            favorite_id: result.insertId,
            user_id: line_user_id,
            trip_id: trip_id
        });

    } catch (error) {
        console.error('💥 添加收藏失敗:', error);

        // 處理重複鍵錯誤
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                success: false,
                message: '已經收藏此行程',
                error: 'DUPLICATE_ENTRY'
            });
        }

        return res.status(500).json({
            success: false,
            message: '添加收藏失敗',
            error: error.message,
            code: error.code || 'UNKNOWN_ERROR'
        });
    }
}

// 移除收藏
async function removeFavorite(req, res) {
    const { line_user_id, trip_id } = req.body;

    console.log('💔 移除收藏 - 用戶ID:', line_user_id, '行程ID:', trip_id);

    if (!line_user_id || !trip_id) {
        console.log('❌ 缺少必要參數');
        return res.status(400).json({
            success: false,
            message: '缺少必要參數',
            received: { line_user_id, trip_id }
        });
    }

    try {
        console.log('🗑️ 從數據庫移除收藏...');
        const deleteSQL = 'DELETE FROM user_favorites WHERE line_user_id = ? AND trip_id = ?';
        const result = await query(deleteSQL, [line_user_id, parseInt(trip_id)]);

        console.log('📊 刪除結果:', result);

        if (result.affectedRows === 0) {
            console.log('⚠️ 收藏不存在');
            return res.status(404).json({
                success: false,
                message: '收藏不存在或已被移除'
            });
        }

        console.log('✅ 收藏移除成功');

        return res.status(200).json({
            success: true,
            message: '取消收藏成功',
            removed_rows: result.affectedRows,
            user_id: line_user_id,
            trip_id: trip_id
        });

    } catch (error) {
        console.error('💥 移除收藏失敗:', error);
        return res.status(500).json({
            success: false,
            message: '移除收藏失敗',
            error: error.message,
            code: error.code || 'UNKNOWN_ERROR'
        });
    }
}