import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const AdminPage = () => {
  const [tripsWithoutDetails, setTripsWithoutDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [batchLimit, setBatchLimit] = useState(10);

  // 獲取沒有詳細行程的行程列表
  const fetchTripsWithoutDetails = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/trips-without-details');
      if (response.data.success) {
        setTripsWithoutDetails(response.data.data);
        setMessage(`找到 ${response.data.count} 個沒有詳細行程內容的行程`);
      } else {
        setMessage('獲取行程列表失敗');
      }
    } catch (error) {
      console.error('獲取行程列表失敗:', error);
      setMessage('獲取行程列表失敗: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 為單個行程添加詳細內容
  const addTripDetails = async (tripId) => {
    setLoading(true);
    try {
      const response = await api.post('/api/add-trip-details', { trip_id: tripId });
      if (response.data.success) {
        setMessage(response.data.message);
        // 重新獲取列表
        fetchTripsWithoutDetails();
      } else {
        setMessage('添加詳細內容失敗: ' + response.data.message);
      }
    } catch (error) {
      console.error('添加詳細內容失敗:', error);
      setMessage('添加詳細內容失敗: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 批量添加詳細內容
  const batchAddTripDetails = async () => {
    setLoading(true);
    try {
      const response = await api.post('/api/batch-add-trip-details', { limit: batchLimit });
      if (response.data.success) {
        setMessage(response.data.message);
        // 重新獲取列表
        fetchTripsWithoutDetails();
      } else {
        setMessage('批量添加失敗: ' + response.data.message);
      }
    } catch (error) {
      console.error('批量添加失敗:', error);
      setMessage('批量添加失敗: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTripsWithoutDetails();
  }, []);

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '20px',
      minHeight: '100vh',
      background: '#f8fafc'
    }}>
      {/* 標題區域 */}
      <div style={{
        textAlign: 'center',
        marginBottom: '32px',
        padding: '32px 24px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '16px',
        color: 'white'
      }}>
        <h1 style={{
          margin: '0 0 24px 0',
          fontSize: '32px',
          fontWeight: '700'
        }}>
          行程詳細內容管理
        </h1>
        <p style={{ fontSize: '16px', opacity: '0.9' }}>
          為沒有詳細行程內容的行程添加符合國家特色的景點
        </p>
      </div>

      {/* 操作面板 */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e2e8f0'
      }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: '600', color: '#374151' }}>
          批量操作
        </h2>
        
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
              處理數量限制
            </label>
            <input
              type="number"
              value={batchLimit}
              onChange={(e) => setBatchLimit(parseInt(e.target.value) || 10)}
              min="1"
              max="50"
              style={{
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                width: '100px'
              }}
            />
          </div>
          
          <button
            onClick={batchAddTripDetails}
            disabled={loading}
            style={{
              background: loading ? '#9ca3af' : '#10b981',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? '處理中...' : '批量添加詳細內容'}
          </button>
          
          <button
            onClick={fetchTripsWithoutDetails}
            disabled={loading}
            style={{
              background: loading ? '#9ca3af' : '#3b82f6',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              opacity: loading ? 0.6 : 1
            }}
          >
            重新整理列表
          </button>
        </div>
      </div>

      {/* 訊息顯示 */}
      {message && (
        <div style={{
          background: message.includes('成功') || message.includes('完成') ? '#d1fae5' : '#fef2f2',
          border: message.includes('成功') || message.includes('完成') ? '1px solid #a7f3d0' : '1px solid #fecaca',
          color: message.includes('成功') || message.includes('完成') ? '#065f46' : '#991b1b',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '24px',
          fontSize: '14px'
        }}>
          {message}
        </div>
      )}

      {/* 行程列表 */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e2e8f0'
      }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: '600', color: '#374151' }}>
          沒有詳細行程內容的行程 ({tripsWithoutDetails.length})
        </h2>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '16px', color: '#6b7280' }}>載入中...</div>
          </div>
        ) : tripsWithoutDetails.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '16px', color: '#6b7280' }}>沒有找到需要添加詳細行程內容的行程</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {tripsWithoutDetails.map((trip) => (
              <div
                key={trip.trip_id}
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '16px',
                  background: '#f8fafc'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600', color: '#374151' }}>
                      {trip.title}
                    </h3>
                    <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                      📍 {trip.area || '未指定地區'}
                    </div>
                    <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                      📅 {new Date(trip.start_date).toLocaleDateString('zh-TW')} - {new Date(trip.end_date).toLocaleDateString('zh-TW')}
                    </div>
                    <div style={{ fontSize: '14px', color: '#6b7280' }}>
                      ⏱️ {trip.duration_days || 1} 天
                    </div>
                  </div>
                  
                  <button
                    onClick={() => addTripDetails(trip.trip_id)}
                    disabled={loading}
                    style={{
                      background: loading ? '#9ca3af' : '#f59e0b',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      opacity: loading ? 0.6 : 1
                    }}
                  >
                    添加詳細內容
                  </button>
                </div>
                
                {trip.description && (
                  <div style={{
                    marginTop: '12px',
                    padding: '12px',
                    background: 'white',
                    borderRadius: '6px',
                    fontSize: '14px',
                    color: '#4b5563',
                    border: '1px solid #e5e7eb'
                  }}>
                    {trip.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 說明區域 */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        marginTop: '24px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e2e8f0'
      }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#374151' }}>
          功能說明
        </h3>
        <div style={{ fontSize: '14px', color: '#6b7280', lineHeight: '1.6' }}>
          <ul style={{ margin: '0', paddingLeft: '20px' }}>
            <li>系統會根據行程的地區自動選擇符合的景點</li>
            <li>每天會安排2-4個景點，時間在8:00-19:00之間</li>
            <li>景點會根據行程天數進行合理分配</li>
            <li>支援的國家包括：日本、韓國、泰國、新加坡、馬來西亞、越南、台灣</li>
            <li>每個景點都包含名稱、時間安排和詳細描述</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminPage; 