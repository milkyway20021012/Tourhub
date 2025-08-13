import { query } from '../../lib/db';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, message: '只允許 POST 請求' });
    }

    const { line_user_ids, dry_run = false } = req.body || {};

    // 預設要刪除的測試用 line_user_id（依照你提供的截圖）
    const defaultIds = [
      'test_user_123',
      'test_user_debug',
      'U098dfbcd7ecabb344358a9e98e7dcb70',
      'U5dcb21a8a0d072b04fd29697071e0860'
    ];

    const targets = Array.isArray(line_user_ids) && line_user_ids.length > 0 ? line_user_ids : defaultIds;

    // 先查詢將被刪除的行程
    const selectSql = `
      SELECT trip_id, line_user_id, title
      FROM line_trips
      WHERE line_user_id IN (${targets.map(() => '?').join(',')})
    `;
    const trips = await query(selectSql, targets);

    if (trips.length === 0) {
      return res.status(200).json({
        success: true,
        message: '沒有找到符合條件的測試行程',
        preview: [],
        deleted_count: 0
      });
    }

    if (dry_run) {
      return res.status(200).json({
        success: true,
        message: 'Dry-run 預覽，未執行刪除',
        preview: trips,
        deleted_count: 0
      });
    }

    // 刪除行程（line_trip_details 會因外鍵 ON DELETE CASCADE 一併刪除）
    const deleteSql = `
      DELETE FROM line_trips
      WHERE line_user_id IN (${targets.map(() => '?').join(',')})
    `;
    const delResult = await query(deleteSql, targets);

    return res.status(200).json({
      success: true,
      message: '測試行程刪除完成',
      deleted_count: delResult.affectedRows || 0,
      deleted_trips: trips
    });
  } catch (error) {
    console.error('delete-test-trips API 錯誤:', error);
    return res.status(500).json({ success: false, message: '伺服器錯誤', error: error.message });
  }
}

