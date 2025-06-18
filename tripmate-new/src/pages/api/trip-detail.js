// pages/api/trip-detail.js - 繁體中文簡化版行程詳情 API
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

    // 獲取行程資訊 - 簡化版本，不包含建立者資訊
    const tripSql = `
            SELECT 
                t.trip_id,
                t.user_id,
                t.title,
                t.description,
                t.start_date,
                t.end_date,
                t.area,
                t.tags,
                t.budget,
                t.created_at,
                t.updated_at
            FROM trip t 
            WHERE t.trip_id = ?
        `;

    console.log('執行行程查詢，ID:', id);
    const tripResult = await query(tripSql, [parseInt(id)]);

    if (tripResult.length === 0) {
      return res.status(404).json({ message: '找不到該行程' });
    }

    console.log('找到行程:', tripResult[0].title);

    // 獲取行程細節
    const detailsSql = `
            SELECT 
                detail_id,
                trip_id,
                location,
                date,
                start_time,
                end_time
            FROM trip_detail 
            WHERE trip_id = ? 
            ORDER BY date ASC, start_time ASC
        `;

    console.log('獲取行程細節...');
    const details = await query(detailsSql, [parseInt(id)]);
    console.log('找到細節:', details.length, '筆');

    // 獲取參與者 - 簡化版本，不包含使用者名稱
    const participantsSql = `
            SELECT 
                tp.participant_id,
                tp.trip_id,
                tp.user_id,
                tp.status,
                tp.created_at
            FROM trip_participants tp 
            WHERE tp.trip_id = ?
            ORDER BY tp.created_at ASC
        `;

    console.log('獲取參與者...');
    const participants = await query(participantsSql, [parseInt(id)]);
    console.log('找到參與者:', participants.length, '位');

    res.status(200).json({
      success: true,
      trip: tripResult[0],
      details: details,
      participants: participants,
      metadata: {
        details_count: details.length,
        participants_count: participants.length
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