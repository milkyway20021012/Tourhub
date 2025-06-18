// components/TripRanking.js - 除錯版本
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './TripRanking.module.css';

const TripRanking = () => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('date');

  // 測試：添加 console.log 來檢查組件是否載入
  console.log('TripRanking 組件已載入，當前 activeTab:', activeTab);

  useEffect(() => {
    console.log('useEffect 觸發，activeTab:', activeTab);
    fetchTripRankings(activeTab);
  }, [activeTab]);

  const fetchTripRankings = async (rankingType) => {
    console.log('開始獲取排行榜資料，類型:', rankingType);
    setLoading(true);
    try {
      // 先嘗試原有的 API
      const response = await axios.get(`/api/trip-rankings-simplified?type=${rankingType}`);
      console.log('API 回應:', response.data);

      const data = response.data.success ? response.data.data : response.data;
      setTrips(data);
      setError(null);

      console.log('排行榜資料載入成功:', data.length, '筆');
    } catch (err) {
      console.error('獲取排行榜失敗:', err);
      setError('載入排行榜失敗，請稍後再試。');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('zh-TW', options);
  };

  const handleViewTrip = async (tripId) => {
    console.log('點擊檢視行程:', tripId);
  };

  // 簡化的分類標籤
  const renderRankingTabs = () => {
    console.log('渲染分類標籤，activeTab:', activeTab);
    return (
      <div className={styles.rankingTabs}>
        <button
          className={activeTab === 'area' ? styles.active : ''}
          onClick={() => {
            console.log('點擊熱門地區');
            setActiveTab('area');
          }}
        >
          🗺️ 熱門地區
        </button>
        <button
          className={activeTab === 'date' ? styles.active : ''}
          onClick={() => {
            console.log('點擊即將出發');
            setActiveTab('date');
          }}
        >
          🚀 即將出發
        </button>
        <button
          className={activeTab === 'budget' ? styles.active : ''}
          onClick={() => {
            console.log('點擊預算區間');
            setActiveTab('budget');
          }}
        >
          💰 預算區間 (測試)
        </button>
      </div>
    );
  };

  const renderRankingList = () => {
    console.log('渲染排行榜列表，loading:', loading, 'error:', error, 'trips.length:', trips.length);

    if (loading) return <div className={styles.loading}>載入中...</div>;
    if (error) return <div className={styles.error}>{error}</div>;
    if (trips.length === 0) return <div className={styles.noTrips}>沒有找到行程。</div>;

    return (
      <div className={styles.rankingList}>
        {trips.map((trip, index) => (
          <div key={trip.trip_id} className={styles.rankingItem}>
            <div className={styles.rank}>
              {index + 1}
            </div>
            <div className={styles.tripInfo} onClick={() => handleViewTrip(trip.trip_id)}>
              <h3>{trip.title}</h3>

              {/* 測試：新增測試標籤 */}
              <div style={{
                marginBottom: '12px',
                padding: '8px',
                background: '#e6fffa',
                borderRadius: '4px',
                fontSize: '12px',
                color: '#234e52'
              }}>
                🔧 測試標籤 - 如果你看到這個，表示新版本已載入！
              </div>

              <div className={styles.tripDetails}>
                <span className={styles.area}>{trip.area}</span>
                <span className={styles.date}>
                  {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
                </span>
                {trip.budget && (
                  <span className={styles.budget}>
                    預算: ${trip.budget.toLocaleString()}
                  </span>
                )}
              </div>

              {trip.description && (
                <div style={{
                  marginTop: '12px',
                  fontSize: '14px',
                  color: '#718096',
                  lineHeight: '1.5'
                }}>
                  {trip.description.length > 100
                    ? trip.description.substring(0, 100) + '...'
                    : trip.description}
                </div>
              )}

              <div style={{
                marginTop: '12px',
                fontSize: '12px',
                color: '#a0aec0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>建立於: {formatDate(trip.created_at)}</span>
                <span style={{
                  background: '#3182ce',
                  color: 'white',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  fontSize: '11px'
                }}>
                  點擊檢視詳情
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  console.log('準備渲染組件');

  return (
    <div className={styles.tripRankingContainer}>
      <h2>行程排行榜 (除錯版本)</h2>

      {/* 測試標誌 */}
      <div style={{
        textAlign: 'center',
        marginBottom: '24px',
        color: '#e53e3e',
        fontSize: '16px',
        background: '#fff5f5',
        padding: '16px',
        borderRadius: '12px',
        border: '2px solid #feb2b2'
      }}>
        🔧 除錯模式 - 如果你看到這個紅色框，表示新版本已成功載入！
      </div>

      <div style={{
        textAlign: 'center',
        marginBottom: '24px',
        color: '#718096',
        fontSize: '16px',
        background: '#f7fafc',
        padding: '16px',
        borderRadius: '12px',
        border: '1px solid #e2e8f0'
      }}>
        發現最受歡迎的旅行目的地和即將出發的精彩行程
      </div>

      {renderRankingTabs()}
      {renderRankingList()}

      {/* 除錯資訊 */}
      <div style={{
        marginTop: '24px',
        padding: '16px',
        background: '#f0f9ff',
        border: '1px solid #bfdbfe',
        borderRadius: '8px',
        fontSize: '12px',
        color: '#1e40af'
      }}>
        <strong>除錯資訊：</strong><br />
        - 當前分類：{activeTab}<br />
        - 載入狀態：{loading ? '載入中' : '已載入'}<br />
        - 錯誤狀態：{error || '無錯誤'}<br />
        - 行程數量：{trips.length}<br />
        - 時間戳：{new Date().toLocaleTimeString()}
      </div>
    </div>
  );
};

export default TripRanking;