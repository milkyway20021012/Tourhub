import { query } from '../../lib/db';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: '只允許 GET 請求' });
    }

    try {
        const results = {
            timestamp: new Date().toISOString(),
            fixes: []
        };

        // 1. 檢查 line_trip_details 表是否存在
        console.log('🔍 檢查 line_trip_details 表...');
        try {
            const tableExists = await query(`
                SELECT COUNT(*) as count 
                FROM information_schema.tables 
                WHERE table_schema = DATABASE() 
                AND table_name = 'line_trip_details'
            `);

            if (tableExists[0].count === 0) {
                console.log('❌ line_trip_details 表不存在，正在創建...');

                // 創建 line_trip_details 表
                await query(`
                    CREATE TABLE line_trip_details (
                        detail_id int(11) NOT NULL AUTO_INCREMENT,
                        trip_id int(11) NOT NULL,
                        location varchar(255) NOT NULL COMMENT '景點名稱',
                        date date NOT NULL COMMENT '日期',
                        start_time time NOT NULL COMMENT '開始時間',
                        end_time time NOT NULL COMMENT '結束時間',
                        description text COMMENT '景點描述',
                        created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        PRIMARY KEY (detail_id),
                        KEY idx_trip_id (trip_id),
                        KEY idx_date (date),
                        CONSTRAINT fk_trip_details_trip_id FOREIGN KEY (trip_id) REFERENCES line_trips (trip_id) ON DELETE CASCADE
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='行程詳細內容表'
                `);

                results.fixes.push('創建了 line_trip_details 表');
                console.log('✅ line_trip_details 表創建成功');
            } else {
                console.log('✅ line_trip_details 表已存在');
            }
        } catch (error) {
            console.error('❌ 檢查/創建 line_trip_details 表失敗:', error);
            results.fixes.push(`檢查/創建 line_trip_details 表失敗: ${error.message}`);
        }

        // 2. 檢查 description 欄位是否存在
        console.log('🔍 檢查 description 欄位...');
        try {
            const columnExists = await query(`
                SELECT COUNT(*) as count 
                FROM information_schema.columns 
                WHERE table_schema = DATABASE() 
                AND table_name = 'line_trip_details' 
                AND column_name = 'description'
            `);

            if (columnExists[0].count === 0) {
                console.log('❌ description 欄位不存在，正在添加...');

                // 添加 description 欄位
                await query(`
                    ALTER TABLE line_trip_details 
                    ADD COLUMN description text COMMENT '景點描述' AFTER end_time
                `);

                results.fixes.push('添加了 description 欄位');
                console.log('✅ description 欄位添加成功');
            } else {
                console.log('✅ description 欄位已存在');
            }
        } catch (error) {
            console.error('❌ 檢查/添加 description 欄位失敗:', error);
            results.fixes.push(`檢查/添加 description 欄位失敗: ${error.message}`);
        }

        // 3. 檢查索引是否存在
        console.log('🔍 檢查索引...');
        try {
            const indexes = await query(`
                SHOW INDEX FROM line_trip_details
            `);

            const indexNames = indexes.map(idx => idx.Key_name);

            if (!indexNames.includes('idx_trip_details_trip_date')) {
                console.log('❌ idx_trip_details_trip_date 索引不存在，正在創建...');
                await query(`
                    CREATE INDEX idx_trip_details_trip_date ON line_trip_details (trip_id, date)
                `);
                results.fixes.push('創建了 idx_trip_details_trip_date 索引');
            }

            if (!indexNames.includes('idx_trip_details_date_time')) {
                console.log('❌ idx_trip_details_date_time 索引不存在，正在創建...');
                await query(`
                    CREATE INDEX idx_trip_details_date_time ON line_trip_details (date, start_time)
                `);
                results.fixes.push('創建了 idx_trip_details_date_time 索引');
            }

            console.log('✅ 索引檢查完成');
        } catch (error) {
            console.error('❌ 檢查/創建索引失敗:', error);
            results.fixes.push(`檢查/創建索引失敗: ${error.message}`);
        }

        // 4. 測試查詢
        console.log('🧪 測試查詢...');
        try {
            const testQuery = await query(`
                SELECT 
                    detail_id,
                    trip_id,
                    location,
                    date,
                    start_time,
                    end_time,
                    description
                FROM line_trip_details 
                LIMIT 1
            `);

            results.test_query = {
                status: 'success',
                message: '查詢測試成功',
                result_count: testQuery.length
            };
            console.log('✅ 查詢測試成功');
        } catch (error) {
            results.test_query = {
                status: 'error',
                message: '查詢測試失敗',
                error: error.message
            };
            console.error('❌ 查詢測試失敗:', error);
        }

        console.log('🏁 資料庫修復完成');
        res.status(200).json({
            success: true,
            message: '資料庫修復完成',
            results: results
        });

    } catch (error) {
        console.error('💥 資料庫修復失敗:', error);
        res.status(500).json({
            success: false,
            message: '資料庫修復失敗',
            error: error.message
        });
    }
} 