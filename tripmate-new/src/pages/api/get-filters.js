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