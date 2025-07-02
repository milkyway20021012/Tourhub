import { query } from '../../lib/db';

export default async function handler(req, res) {
    console.log('🔥 API 被調用:', req.method);
    console.log('📝 查詢參數:', req.query);
    console.log('📝 請求主體:', req.body);

    try {
        if (req.method === 'GET') {
            return await getUserFavorites(req, res);
        } else if (req.method === 'POST') {
            return await addFavorite(req, res);
        } else if (req.method === 'DELETE') {
            return await removeFavorite(req, res);
        } else {
            return res.status(405).json({
                success: false,
                message: '不允許的請求方法'
            });
        }
    } catch (error) {
        console.error('💥 API 錯誤:', error);
        return res.status(500).json({
            success: false,
            message: '伺服器錯誤',
            error: error.message
        });
    }
}

async function getUserFavorites(req, res) {
    const { line_user_id } = req.query;

    console.log('👤 用戶ID:', line_user_id);

    if (!line_user_id) {
        console.log('❌ 缺少用戶ID');
        return res.status(400).json({
            success: false,
            message: '缺少用戶 ID'
        });
    }

    try {
        // 1. 測試數據庫連接
        console.log('🔌 測試數據庫連接...');
        await query('SELECT 1 as test');
        console.log('✅ 數據庫連接正常');

        // 2. 確保表存在
        console.log('🏗️ 確保表存在...');
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
        console.log('✅ 表確認存在');

        // 3. 查詢用戶收藏 - 使用簡單的字符串參數
        console.log('🔍 查詢用戶收藏...');
        const favoritesSQL = `SELECT trip_id, favorited_at FROM user_favorites WHERE line_user_id = '${line_user_id}'`;
        console.log('📋 執行SQL:', favoritesSQL);

        const favorites = await query(favoritesSQL);
        console.log('📋 找到收藏記錄:', favorites.length, '筆');

        if (favorites.length === 0) {
            console.log('📭 沒有收藏記錄');
            return res.status(200).json({
                success: true,
                favorites: [],
                count: 0,
                message: '暫無收藏記錄'
            });
        }

        // 4. 查詢對應的行程資料 - 使用 IN 子句但避免參數綁定
        console.log('🔍 查詢行程資料...');
        const tripIds = favorites.map(f => f.trip_id).join(',');
        const tripsSQL = `SELECT * FROM line_trips WHERE trip_id IN (${tripIds})`;
        console.log('📋 執行行程SQL:', tripsSQL);

        const trips = await query(tripsSQL);
        console.log('🎪 找到行程:', trips.length, '筆');

        // 5. 合併資料
        const result = favorites.map(favorite => {
            const trip = trips.find(t => t.trip_id === favorite.trip_id);
            if (trip) {
                const startDate = new Date(trip.start_date);
                const endDate = new Date(trip.end_date);
                const today = new Date();

                return {
                    trip_id: trip.trip_id,
                    title: trip.title,
                    description: trip.description,
                    start_date: trip.start_date,
                    end_date: trip.end_date,
                    area: trip.area,
                    duration_days: Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1,
                    status: startDate > today ? '即將出發' :
                        startDate <= today && endDate >= today ? '進行中' : '已結束',
                    favorited_at: favorite.favorited_at
                };
            }
            return null;
        }).filter(item => item !== null);

        console.log('✅ 最終結果:', result.length, '筆');

        return res.status(200).json({
            success: true,
            favorites: result,
            count: result.length
        });

    } catch (error) {
        console.error('💥 查詢失敗:', error);
        return res.status(500).json({
            success: false,
            message: '獲取收藏列表失敗',
            error: error.message,
            code: error.code
        });
    }
}

async function addFavorite(req, res) {
    const { line_user_id, trip_id } = req.body;

    console.log('💖 添加收藏:', { line_user_id, trip_id });

    if (!line_user_id || !trip_id) {
        return res.status(400).json({
            success: false,
            message: '缺少必要參數'
        });
    }

    try {
        // 1. 確保表存在
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

        // 2. 檢查行程是否存在 - 使用字符串拼接避免參數問題
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

        // 3. 檢查是否已經收藏
        const existingSQL = `SELECT id FROM user_favorites WHERE line_user_id = '${line_user_id}' AND trip_id = ${parseInt(trip_id)}`;
        console.log('🔍 檢查收藏SQL:', existingSQL);

        const existing = await query(existingSQL);

        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: '已經收藏此行程'
            });
        }

        // 4. 添加收藏 - 使用字符串拼接
        const insertSQL = `INSERT INTO user_favorites (line_user_id, trip_id) VALUES ('${line_user_id}', ${parseInt(trip_id)})`;
        console.log('💾 插入SQL:', insertSQL);

        const result = await query(insertSQL);

        console.log('✅ 收藏成功，ID:', result.insertId);

        return res.status(201).json({
            success: true,
            message: '收藏成功',
            favorite_id: result.insertId,
            trip_title: tripExists[0].title
        });

    } catch (error) {
        console.error('💥 添加收藏失敗:', error);

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                success: false,
                message: '已經收藏此行程'
            });
        }

        return res.status(500).json({
            success: false,
            message: '添加收藏失敗',
            error: error.message
        });
    }
}

async function removeFavorite(req, res) {
    const { line_user_id, trip_id } = req.body;

    console.log('💔 移除收藏:', { line_user_id, trip_id });

    if (!line_user_id || !trip_id) {
        return res.status(400).json({
            success: false,
            message: '缺少必要參數'
        });
    }

    try {
        // 使用字符串拼接避免參數問題
        const deleteSQL = `DELETE FROM user_favorites WHERE line_user_id = '${line_user_id}' AND trip_id = ${parseInt(trip_id)}`;
        console.log('🗑️ 刪除SQL:', deleteSQL);

        const result = await query(deleteSQL);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: '收藏不存在或已被移除'
            });
        }

        console.log('✅ 收藏移除成功');

        return res.status(200).json({
            success: true,
            message: '取消收藏成功',
            affected_rows: result.affectedRows
        });

    } catch (error) {
        console.error('💥 移除收藏失敗:', error);
        return res.status(500).json({
            success: false,
            message: '移除收藏失敗',
            error: error.message
        });
    }
}