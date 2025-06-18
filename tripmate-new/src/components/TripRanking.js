// components/TripRanking.js - 繁體中文版本
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './TripRanking.module.css';

const TripRanking = () => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('date'); // 'area', 'date'

  useEffect(() => {
    fetchTripRankings(activeTab);
  }, [activeTab]);

  const fetchTripRankings = async (rankingType) => {
    setLoading(true);
    try {
      console.log('獲取排行榜資料，類型:', rankingType);
      const response = await axios.get(`/api/trip-rankings-simplified?type=${rankingType}`);

      // 處理回應資料
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

  const handleViewTrip = async (tripId) => {
    try {
      console.log('檢視行程:', tripId);
      // 這裡可以添加檢視行程的邏輯，比如跳轉到詳情頁面
    } catch (err) {
      console.error('檢視行程錯誤:', err);
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('zh-TW', options);
  };

  const getTabTitle = (tab) => {
    switch (tab) {
      case 'area':
        return '🌍 熱門地區';
      case 'date':
        return '⏰ 即將出發';
      default:
        return '排行榜';
    }
  };

  const getTabDescription = (tab) => {
    switch (tab) {
      case 'area':
        return '按地區分類的熱門行程';
      case 'date':
        return '即將出發的行程';
      default:
        return '';
    }
  };

  const renderRankingTabs = () => (
    <div className={styles.rankingTabs}>
      <button
        className={activeTab === 'area' ? styles.active : ''}
        onClick={() => setActiveTab('area')}
        title="按地區分類"
      >
        🌍 熱門地區
      </button>
      <button
        className={activeTab === 'date' ? styles.active : ''}
        onClick={() => setActiveTab('date')}
        title="即將出發"
      >
        ⏰ 即將出發
      </button>
    </div>
  );

  const getRankIcon = (index) => {
    switch (index) {
      case 0:
        return '🥇';
      case 1:
        return '🥈';
      case 2:
        return '🥉';
      default:
        return index < 10 ? '🏆' : '📍';
    }
  };

  const renderRankingList = () => {
    if (loading) return <div className={styles.loading}>🔄 載入中...</div>;
    if (error) return <div className={styles.error}>❌ {error}</div>;
    if (trips.length === 0) return <div className={styles.noTrips}>📝 沒有找到行程。</div>;

    return (
      <div className={styles.rankingList}>
        <div style={{
          marginBottom: '20px',
          padding: '10px',
          background: '#f8f9fa',
          borderRadius: '8px',
          textAlign: 'center',
          color: '#666'
        }}>
          <h4 style={{ margin: '0 0 5px 0', color: '#333' }}>
            {getTabTitle(activeTab)}
          </h4>
          <p style={{ margin: 0, fontSize: '14px' }}>
            {getTabDescription(activeTab)}
          </p>
        </div>

        {trips.map((trip, index) => (
          <div key={trip.trip_id} className={styles.rankingItem}>
            <div className={styles.rank}>
              <span style={{ fontSize: '16px' }}>{getRankIcon(index)}</span>
              <span style={{ fontSize: '12px', marginTop: '2px' }}>
                #{index + 1}
              </span>
            </div>
            <div className={styles.tripInfo} onClick={() => handleViewTrip(trip.trip_id)}>
              <h3>{trip.title}</h3>
              <div className={styles.tripDetails}>
                <span className={styles.area}>📍 {trip.area}</span>
                <span className={styles.date}>
                  📅 {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
                </span>
                {trip.budget && (
                  <span className={styles.budget}>
                    💰 預算: ${trip.budget}
                  </span>
                )}
                {trip.tags && (
                  <div className={styles.tags}>
                    {trip.tags.split(',').slice(0, 3).map((tag, i) => (
                      <span key={i} className={styles.tag}>
                        {tag.trim()}
                      </span>
                    ))}
                    {trip.tags.split(',').length > 3 && (
                      <span className={styles.tag} style={{ opacity: 0.7 }}>
                        +{trip.tags.split(',').length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
              {trip.description && (
                <div style={{
                  marginTop: '8px',
                  fontSize: '14px',
                  color: '#666',
                  lineHeight: '1.4'
                }}>
                  {trip.description.length > 100
                    ? trip.description.substring(0, 100) + '...'
                    : trip.description}
                </div>
              )}
              <div style={{
                marginTop: '8px',
                fontSize: '12px',
                color: '#999',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>🗓️ 建立於: {formatDate(trip.created_at)}</span>
                <span style={{
                  background: index < 3 ? '#ff6b6b' : '#74b9ff',
                  color: 'white',
                  padding: '2px 8px',
                  borderRadius: '10px',
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

  return (
    <div className={styles.tripRankingContainer}>
      <h2>🏆 行程排行榜</h2>
      <div style={{
        textAlign: 'center',
        marginBottom: '20px',
        color: '#666',
        fontSize: '14px',
        background: '#e8f4f8',
        padding: '10px',
        borderRadius: '8px'
      }}>
        💡 發現最受歡迎的旅行目的地和即將出發的精彩行程！
      </div>
      {renderRankingTabs()}
      {renderRankingList()}
    </div>
  );
};

export default TripRanking;