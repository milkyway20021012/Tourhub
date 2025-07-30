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

    // 獲取行程資訊 - 從 line_trips 表格
    const tripSql = `
            SELECT 
                t.trip_id,
                t.line_user_id,
                t.title,
                t.description,
                t.start_date,
                t.end_date,
                t.area
            FROM line_trips t 
            WHERE t.trip_id = ?
        `;

    console.log('執行行程查詢，ID:', id);
    const tripResult = await query(tripSql, [parseInt(id)]);

    if (tripResult.length === 0) {
      return res.status(404).json({ message: '找不到該行程' });
    }

    console.log('找到行程:', tripResult[0].title);

    // 獲取行程細節 - 從 line_trip_details 表格
    const detailsSql = `
            SELECT 
                detail_id,
                trip_id,
                location,
                date,
                start_time,
                end_time,
                description
            FROM line_trip_details 
            WHERE trip_id = ? 
            ORDER BY date ASC, start_time ASC
        `;

    console.log('獲取行程細節...');
    const details = await query(detailsSql, [parseInt(id)]);
    console.log('找到細節:', details.length, '筆');

    res.status(200).json({
      success: true,
      trip: tripResult[0],
      details: details,
      participants: [], // line_trips 表格沒有參與者資料，暫時返回空陣列
      metadata: {
        details_count: details.length,
        participants_count: 0,
        table_source: 'line_trips & line_trip_details'
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
