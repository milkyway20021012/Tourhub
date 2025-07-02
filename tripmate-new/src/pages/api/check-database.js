import { query } from '../../lib/db';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: '只允許 GET 請求' });
    }

    try {
        console.log('🔍 檢查數據庫結構...');

        // 1. 檢查 user_favorites 表是否存在
        const checkTableSQL = `
            SELECT COUNT(*) as table_exists 
            FROM information_schema.tables 
            WHERE table_schema = DATABASE() 
            AND table_name = 'user_favorites'
        `;

        const tableCheck = await query(checkTableSQL);
        const tableExists = tableCheck[0].table_exists > 0;

        console.log('📊 user_favorites 表存在:', tableExists);

        if (!tableExists) {
            return res.status(200).json({
                success: true,
                table_exists: false,
                message: 'user_favorites 表不存在，需要創建',
                action_needed: 'CREATE_TABLE',
                recommendation: '請運行數據庫初始化'
            });
        }

        // 2. 檢查表結構
        const describeTableSQL = 'DESCRIBE user_favorites';
        const tableStructure = await query(describeTableSQL);

        console.log('📋 表結構:', tableStructure);

        // 3. 檢查必要欄位是否存在
        const requiredFields = ['id', 'line_user_id', 'trip_id', 'favorited_at'];
        const existingFields = tableStructure.map(field => field.Field);

        const missingFields = requiredFields.filter(field => !existingFields.includes(field));
        const extraFields = existingFields.filter(field => !requiredFields.includes(field));

        // 4. 檢查欄位類型
        const fieldTypes = {};
        tableStructure.forEach(field => {
            fieldTypes[field.Field] = {
                type: field.Type,
                null: field.Null,
                key: field.Key,
                default: field.Default,
                extra: field.Extra
            };
        });

        // 5. 檢查索引
        const showIndexSQL = 'SHOW INDEX FROM user_favorites';
        const indexes = await query(showIndexSQL);

        // 6. 檢查現有數據
        const countDataSQL = 'SELECT COUNT(*) as total_records FROM user_favorites';
        const dataCount = await query(countDataSQL);
        const totalRecords = dataCount[0].total_records;

        // 7. 分析結果
        let structureStatus = 'PERFECT';
        let recommendations = [];

        if (missingFields.length > 0) {
            structureStatus = 'MISSING_FIELDS';
            recommendations.push(`缺少欄位: ${missingFields.join(', ')}`);
        }

        // 檢查欄位類型是否正確
        const typeIssues = [];
        if (fieldTypes.id && !fieldTypes.id.type.includes('int')) {
            typeIssues.push('id 欄位應該是 INT 類型');
        }
        if (fieldTypes.line_user_id && !fieldTypes.line_user_id.type.includes('varchar')) {
            typeIssues.push('line_user_id 欄位應該是 VARCHAR 類型');
        }
        if (fieldTypes.trip_id && !fieldTypes.trip_id.type.includes('int')) {
            typeIssues.push('trip_id 欄位應該是 INT 類型');
        }
        if (fieldTypes.favorited_at && !fieldTypes.favorited_at.type.includes('timestamp')) {
            typeIssues.push('favorited_at 欄位應該是 TIMESTAMP 類型');
        }

        if (typeIssues.length > 0) {
            structureStatus = 'TYPE_ISSUES';
            recommendations.push(...typeIssues);
        }

        // 8. 返回完整報告
        return res.status(200).json({
            success: true,
            table_exists: true,
            structure_status: structureStatus,
            analysis: {
                required_fields: requiredFields,
                existing_fields: existingFields,
                missing_fields: missingFields,
                extra_fields: extraFields,
                field_types: fieldTypes,
                indexes: indexes.map(idx => ({
                    name: idx.Key_name,
                    column: idx.Column_name,
                    unique: idx.Non_unique === 0
                })),
                total_records: totalRecords
            },
            recommendations: recommendations,
            action_needed: structureStatus === 'PERFECT' ? 'NONE' :
                structureStatus === 'MISSING_FIELDS' ? 'ALTER_TABLE' :
                    'RECREATE_TABLE'
        });

    } catch (error) {
        console.error('💥 檢查數據庫結構失敗:', error);
        return res.status(500).json({
            success: false,
            message: '檢查數據庫結構失敗',
            error: error.message
        });
    }
}