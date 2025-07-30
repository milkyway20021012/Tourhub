import { query } from '../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: '不允許的請求方法' });
  }

  try {
    console.log('trips-without-details API 被呼叫');

    // 查詢沒有詳細行程的行程
    const sql = `
      SELECT 
        t.trip_id,
        t.title,
        t.description,
        t.start_date,
        t.end_date,
        t.area,
        t.line_user_id,
        DATEDIFF(t.end_date, t.start_date) + 1 as duration_days
      FROM line_trips t
      LEFT JOIN line_trip_details d ON t.trip_id = d.trip_id
      WHERE d.trip_id IS NULL
      ORDER BY t.start_date DESC
    `;

    const trips = await query(sql, []);

    console.log('找到沒有詳細行程的行程數量:', trips.length);

    res.status(200).json({
      success: true,
      data: trips,
      count: trips.length,
      message: `找到 ${trips.length} 個沒有詳細行程內容的行程`
    });

  } catch (error) {
    console.error('trips-without-details API 錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤',
      error: error.message
    });
  }
} 