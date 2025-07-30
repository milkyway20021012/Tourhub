import { query } from '../../lib/db';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: '只允許 GET 請求' });
    }

    try {
        const results = {
            timestamp: new Date().toISOString(),
            database: {},
            tables: {},
            user_favorites: {},
            line_trips: {}
        };

        // 1. 測試數據庫連接
        console.log('🔌 測試數據庫連接...');
        try {
            const connectionTest = await query('SELECT 1 as test');
            results.database = {
                status: 'connected',
                test_result: connectionTest[0],
                message: '數據庫連接正常'
            };
            console.log('✅ 數據庫連接成功');
        } catch (error) {
            results.database = {
                status: 'error',
                error: error.message,
                code: error.code,
                message: '數據庫連接失敗'
            };
            console.log('❌ 數據庫連接失敗:', error.message);
        }

        // 2. 檢查表是否存在
        console.log('🏗️ 檢查表結構...');
        try {
            const tablesQuery = `
                SELECT 
                    TABLE_NAME,
                    TABLE_ROWS,
                    DATA_LENGTH,
                    INDEX_LENGTH
                FROM information_schema.TABLES 
                WHERE TABLE_SCHEMA = DATABASE()
                AND TABLE_NAME IN ('user_favorites', 'line_trips', 'trip_stats')
            `;
            const tables = await query(tablesQuery);

            results.tables = {
                status: 'success',
                tables: tables,
                message: `找到 ${tables.length} 個相關表`
            };
            console.log('✅ 表結構檢查完成');
        } catch (error) {
            results.tables = {
                status: 'error',
                error: error.message,
                message: '表結構檢查失敗'
            };
            console.log('❌ 表結構檢查失敗:', error.message);
        }

        // 3. 檢查 user_favorites 表
        console.log('💖 檢查收藏表...');
        try {
            // 檢查表是否存在，如果不存在則創建
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

            // 獲取表統計信息
            const favoritesStats = await query(`
                SELECT 
                    COUNT(*) as total_favorites,
                    COUNT(DISTINCT line_user_id) as unique_users,
                    COUNT(DISTINCT trip_id) as unique_trips,
                    MIN(favorited_at) as earliest_favorite,
                    MAX(favorited_at) as latest_favorite
                FROM user_favorites
            `);

            // 獲取最近的收藏記錄
            const recentFavorites = await query(`
                SELECT 
                    line_user_id,
                    trip_id,
                    favorited_at
                FROM user_favorites 
                ORDER BY favorited_at DESC 
                LIMIT 5
            `);

            results.user_favorites = {
                status: 'success',
                stats: favoritesStats[0],
                recent_favorites: recentFavorites,
                message: '收藏表檢查完成'
            };
            console.log('✅ 收藏表檢查完成');
        } catch (error) {
            results.user_favorites = {
                status: 'error',
                error: error.message,
                message: '收藏表檢查失敗'
            };
            console.log('❌ 收藏表檢查失敗:', error.message);
        }

        // 4. 檢查 line_trips 表
        console.log('🎪 檢查行程表...');
        try {
            const tripsStats = await query(`
                SELECT 
                    COUNT(*) as total_trips,
                    MIN(trip_id) as min_trip_id,
                    MAX(trip_id) as max_trip_id,
                    COUNT(DISTINCT area) as unique_areas
                FROM line_trips
            `);

            // 獲取一些示例行程
            const sampleTrips = await query(`
                SELECT 
                    trip_id,
                    title,
                    area,
                    start_date,
                    end_date
                FROM line_trips 
                ORDER BY trip_id 
                LIMIT 5
            `);

            results.line_trips = {
                status: 'success',
                stats: tripsStats[0],
                sample_trips: sampleTrips,
                message: '行程表檢查完成'
            };
            console.log('✅ 行程表檢查完成');
        } catch (error) {
            results.line_trips = {
                status: 'error',
                error: error.message,
                message: '行程表檢查失敗'
            };
            console.log('❌ 行程表檢查失敗:', error.message);
        }

        // 5. 檢查收藏和行程的關聯
        console.log('🔗 檢查關聯關係...');
        try {
            const joinTest = await query(`
                SELECT 
                    COUNT(*) as valid_favorites
                FROM user_favorites uf
                INNER JOIN line_trips lt ON uf.trip_id = lt.trip_id
            `);

            const orphanedFavorites = await query(`
                SELECT 
                    COUNT(*) as orphaned_count
                FROM user_favorites uf
                LEFT JOIN line_trips lt ON uf.trip_id = lt.trip_id
                WHERE lt.trip_id IS NULL
            `);

            results.relationships = {
                status: 'success',
                valid_favorites: joinTest[0].valid_favorites,
                orphaned_favorites: orphanedFavorites[0].orphaned_count,
                message: '關聯關係檢查完成'
            };
            console.log('✅ 關聯關係檢查完成');
        } catch (error) {
            results.relationships = {
                status: 'error',
                error: error.message,
                message: '關聯關係檢查失敗'
            };
            console.log('❌ 關聯關係檢查失敗:', error.message);
        }

        console.log('🏁 數據庫檢查完成');
        res.status(200).json({
            success: true,
            message: '數據庫檢查完成',
            results: results
        });

    } catch (error) {
        console.error('💥 數據庫檢查失敗:', error);
        res.status(500).json({
            success: false,
            message: '數據庫檢查失敗',
            error: error.message
        });
    }
} 