import { query } from '../../lib/db';

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { tripId, action } = req.body;

        if (!tripId || !action) {
            return res.status(400).json({ success: false, message: '缺少必要參數' });
        }

        try {
            if (action === 'add') {
                // 添加收藏邏輯
                await query('INSERT INTO favorites (trip_id, user_id) VALUES (?, ?)', [tripId, userId]);
                return res.status(200).json({ success: true, message: '收藏成功' });
            } else if (action === 'remove') {
                // 取消收藏邏輯
                await query('DELETE FROM favorites WHERE trip_id = ? AND user_id = ?', [tripId, userId]);
                return res.status(200).json({ success: true, message: '取消收藏成功' });
            } else {
                return res.status(400).json({ success: false, message: '未知的操作' });
            }
        } catch (error) {
            console.error('收藏操作失敗:', error);
            return res.status(500).json({ success: false, message: '收藏操作失敗' });
        }
    } else if (req.method === 'GET') {
        try {
            const {
                keyword = '',
                limit = 50,
                offset = 0
            } = req.query;

            console.log('search-trips API 被呼叫，關鍵字:', keyword);

            // 檢查關鍵字
            if (!keyword || keyword.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    message: '請提供搜尋關鍵字',
                    trips: []
                });
            }

            const searchKeyword = keyword.trim();
            const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 50));
            const offsetNum = Math.max(0, parseInt(offset) || 0);

            console.log('搜尋參數:', {
                keyword: searchKeyword,
                limit: limitNum,
                offset: offsetNum
            });

            // ===== 主要優化：多層次搜索策略 =====

            // 1. 首先嘗試精確搜索
            let trips = await performExactSearch(searchKeyword, limitNum, offsetNum);
            let searchType = 'exact';
            let total = 0;

            if (trips.length > 0) {
                // 獲取精確搜索的總數
                total = await getSearchCount(searchKeyword, 'exact');
            } else {
                // 2. 如果精確搜索無結果，嘗試模糊搜索
                console.log('精確搜索無結果，嘗試模糊搜索...');
                trips = await performFuzzySearch(searchKeyword, limitNum, offsetNum);
                searchType = 'fuzzy';

                if (trips.length > 0) {
                    total = await getSearchCount(searchKeyword, 'fuzzy');
                } else {
                    // 3. 如果模糊搜索也無結果，嘗試分詞搜索
                    console.log('模糊搜索無結果，嘗試分詞搜索...');
                    trips = await performTokenSearch(searchKeyword, limitNum, offsetNum);
                    searchType = 'token';
                    total = trips.length; // 分詞搜索通常返回較少結果
                }
            }

            console.log(`${searchType} 搜尋結果數量:`, trips.length);

            // 返回搜尋結果
            const response = {
                success: true,
                trips: trips,
                total: total,
                searchType: searchType,
                keyword: searchKeyword,
                pagination: {
                    limit: limitNum,
                    offset: offsetNum,
                    hasMore: total > offsetNum + trips.length
                },
                message: trips.length > 0 ?
                    `找到 ${trips.length} 個相關行程${searchType === 'exact' ? '' : `（${searchType === 'fuzzy' ? '模糊' : '分詞'}搜尋）`}` :
                    '沒有找到相關行程，請嘗試其他關鍵字'
            };

            console.log('最終搜索結果:', response);
            res.status(200).json(response);

        } catch (error) {
            console.error('search-trips API 錯誤:', error);

            res.status(500).json({
                success: false,
                message: '搜尋失敗，請稍後再試',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined,
                trips: [],
                total: 0
            });
        }
    } else {
        return res.status(405).json({
            success: false,
            message: '不允許的請求方法'
        });
    }
}

// 1. 精確搜索
async function performExactSearch(searchKeyword, limit, offset) {
    const searchSql = `
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
            (
                CASE WHEN t.title LIKE ? THEN 10 ELSE 0 END +
                CASE WHEN t.area LIKE ? THEN 8 ELSE 0 END +
                CASE WHEN t.description LIKE ? THEN 3 ELSE 0 END
            ) as relevance_score
        FROM line_trips t
        WHERE (
            t.title LIKE ? OR 
            t.area LIKE ? OR 
            t.description LIKE ?
        )
        AND t.title IS NOT NULL 
        AND t.area IS NOT NULL
        ORDER BY relevance_score DESC, t.start_date DESC
        LIMIT ? OFFSET ?
    `;

    const searchPattern = `%${searchKeyword}%`;
    const searchParams = [
        searchPattern, searchPattern, searchPattern, // 權重計算
        searchPattern, searchPattern, searchPattern, // WHERE條件
        limit, offset
    ];

    try {
        return await query(searchSql, searchParams);
    } catch (error) {
        console.error('精確搜索失敗:', error);
        return [];
    }
}

// 2. 模糊搜索 - 使用更寬鬆的條件
async function performFuzzySearch(searchKeyword, limit, offset) {
    // 移除特殊字符，只保留字母數字和中文
    const cleanKeyword = searchKeyword.replace(/[^\w\u4e00-\u9fff]/g, '');

    if (cleanKeyword.length === 0) return [];

    const fuzzySql = `
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
            END as status
        FROM line_trips t
        WHERE (
            LOWER(REPLACE(t.title, ' ', '')) LIKE LOWER(?) OR
            LOWER(REPLACE(t.area, ' ', '')) LIKE LOWER(?) OR
            LOWER(REPLACE(t.description, ' ', '')) LIKE LOWER(?) OR
            t.title REGEXP ? OR
            t.area REGEXP ? OR
            t.description REGEXP ?
        )
        AND t.title IS NOT NULL 
        AND t.area IS NOT NULL
        ORDER BY t.start_date DESC
        LIMIT ? OFFSET ?
    `;

    const fuzzyPattern = `%${cleanKeyword}%`;
    const regexPattern = cleanKeyword.split('').join('.*');

    const fuzzyParams = [
        fuzzyPattern, fuzzyPattern, fuzzyPattern, // LIKE搜索
        regexPattern, regexPattern, regexPattern,   // REGEXP搜索
        limit, offset
    ];

    try {
        return await query(fuzzySql, fuzzyParams);
    } catch (error) {
        console.error('模糊搜索失敗:', error);
        return [];
    }
}

// 3. 分詞搜索 - 將關鍵字分解後搜索
async function performTokenSearch(searchKeyword, limit, offset) {
    // 分解關鍵字
    const tokens = tokenizeKeyword(searchKeyword);

    if (tokens.length === 0) return [];

    console.log('分詞結果:', tokens);

    // 為每個token構建搜索條件
    const tokenConditions = tokens.map(() =>
        '(t.title LIKE ? OR t.area LIKE ? OR t.description LIKE ?)'
    ).join(' OR ');

    const tokenSql = `
        SELECT DISTINCT
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
            END as status
        FROM line_trips t
        WHERE (${tokenConditions})
        AND t.title IS NOT NULL 
        AND t.area IS NOT NULL
        ORDER BY t.start_date DESC
        LIMIT ?
    `;

    const tokenParams = [];
    tokens.forEach(token => {
        const pattern = `%${token}%`;
        tokenParams.push(pattern, pattern, pattern);
    });
    tokenParams.push(limit);

    try {
        return await query(tokenSql, tokenParams);
    } catch (error) {
        console.error('分詞搜索失敗:', error);
        return [];
    }
}

// 分詞函數
function tokenizeKeyword(keyword) {
    const tokens = new Set();

    // 1. 按空格分割
    const words = keyword.trim().split(/\s+/);
    words.forEach(word => {
        if (word.length > 0) {
            tokens.add(word);
        }
    });

    // 2. 對於中文，按字符分割（如果長度>1）
    if (/[\u4e00-\u9fff]/.test(keyword)) {
        for (let i = 0; i < keyword.length; i++) {
            const char = keyword[i];
            if (/[\u4e00-\u9fff]/.test(char)) {
                tokens.add(char);

                // 也添加雙字組合
                if (i < keyword.length - 1) {
                    const nextChar = keyword[i + 1];
                    if (/[\u4e00-\u9fff]/.test(nextChar)) {
                        tokens.add(char + nextChar);
                    }
                }
            }
        }
    }

    // 3. 對於英文，添加部分匹配
    const englishWords = keyword.match(/[a-zA-Z]+/g) || [];
    englishWords.forEach(word => {
        if (word.length > 2) {
            tokens.add(word);
            // 添加前綴匹配
            if (word.length > 3) {
                tokens.add(word.substring(0, word.length - 1));
            }
        }
    });

    return Array.from(tokens).filter(token => token.length > 0);
}

// 獲取搜索結果總數
async function getSearchCount(searchKeyword, searchType) {
    try {
        let countSql;
        let countParams;

        if (searchType === 'exact') {
            countSql = `
                SELECT COUNT(*) as total
                FROM line_trips t
                WHERE (
                    t.title LIKE ? OR 
                    t.area LIKE ? OR 
                    t.description LIKE ?
                )
                AND t.title IS NOT NULL 
                AND t.area IS NOT NULL
            `;
            const searchPattern = `%${searchKeyword}%`;
            countParams = [searchPattern, searchPattern, searchPattern];
        } else if (searchType === 'fuzzy') {
            const cleanKeyword = searchKeyword.replace(/[^\w\u4e00-\u9fff]/g, '');
            countSql = `
                SELECT COUNT(*) as total
                FROM line_trips t
                WHERE (
                    LOWER(REPLACE(t.title, ' ', '')) LIKE LOWER(?) OR
                    LOWER(REPLACE(t.area, ' ', '')) LIKE LOWER(?) OR
                    LOWER(REPLACE(t.description, ' ', '')) LIKE LOWER(?)
                )
                AND t.title IS NOT NULL 
                AND t.area IS NOT NULL
            `;
            const fuzzyPattern = `%${cleanKeyword}%`;
            countParams = [fuzzyPattern, fuzzyPattern, fuzzyPattern];
        }

        const countResult = await query(countSql, countParams);
        return countResult[0]?.total || 0;
    } catch (error) {
        console.error('獲取搜索總數失敗:', error);
        return 0;
    }
}

const toggleFavorite = async (tripId) => {
    try {
        const action = favorites.has(tripId) ? 'remove' : 'add';
        const response = await fetch('/api/favorites', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tripId, action })
        });

        const result = await response.json();
        if (result.success) {
            if (action === 'add') {
                setFavorites(new Set([...favorites, tripId]));
            } else {
                const updatedFavorites = new Set(favorites);
                updatedFavorites.delete(tripId);
                setFavorites(updatedFavorites);
            }
        } else {
            alert(result.message);
        }
    } catch (error) {
        console.error('收藏操作失敗:', error);
        alert('收藏操作失敗，請稍後再試');
    }
};

useEffect(() => {
    const fetchFavorites = async () => {
        try {
            const response = await fetch('/api/favorites');
            const result = await response.json();
            if (result.success) {
                setFavorites(new Set(result.favorites));
            } else {
                console.error('獲取收藏失敗:', result.message);
            }
        } catch (error) {
            console.error('獲取收藏失敗:', error);
        }
    };

    fetchFavorites();
}, []);