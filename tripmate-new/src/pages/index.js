// ===================================================
// 1. pages/index.js - 新的首頁（整合排行榜功能）
// ===================================================
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TripDetail from '../components/TripDetail';
import styles from '../components/TripRanking.module.css';

const HomePage = () => {
  const [trips, setTrips] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // 預設選擇地區排行榜
  const [activeTab, setActiveTab] = useState('area');
  const [favorites, setFavorites] = useState(new Set());
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [areas, setAreas] = useState([]);

  // 篩選狀態
  const [filters, setFilters] = useState({
    duration_type: '',
    season: '',
    area: ''
  });

  // 假設的 LINE 用戶 ID (實際應該從 LINE SDK 或登入系統獲取)
  const [lineUserId, setLineUserId] = useState('demo_user_123');

  useEffect(() => {
    initializeData();
  }, []);

  useEffect(() => {
    fetchTripRankings(activeTab);
  }, [activeTab, filters]);

  const initializeData = async () => {
    await Promise.all([
      fetchStatistics(),
      fetchUserFavorites(),
      fetchAreas(),
      fetchTripRankings(activeTab)
    ]);
  };

  const fetchStatistics = async () => {
    try {
      const response = await axios.get('/api/trip-statistics');
      setStatistics(response.data);
      console.log('統計資料載入成功:', response.data);
    } catch (err) {
      console.error('獲取統計資料失敗:', err);
    }
  };

  const fetchUserFavorites = async () => {
    try {
      const response = await axios.get(`/api/user-favorites?line_user_id=${lineUserId}`);
      const favIds = new Set(response.data.favorites.map(f => f.trip_id));
      setFavorites(favIds);
      console.log('收藏資料載入成功:', favIds.size, '筆');
    } catch (err) {
      console.error('獲取收藏失敗:', err);
    }
  };

  const fetchAreas = async () => {
    try {
      const response = await axios.get('/api/get-filters');
      setAreas(response.data.areas || []);
    } catch (err) {
      console.error('獲取地區失敗:', err);
    }
  };

  const fetchTripRankings = async (rankingType) => {
    setLoading(true);
    try {
      const params = {
        type: rankingType,
        ...filters
      };

      const response = await axios.get('/api/trip-rankings-enhanced', { params });
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

  const handleFavorite = async (tripId) => {
    try {
      if (favorites.has(tripId)) {
        // 取消收藏
        await axios.delete('/api/user-favorites', {
          data: { line_user_id: lineUserId, trip_id: tripId }
        });
        setFavorites(prev => {
          const newSet = new Set(prev);
          newSet.delete(tripId);
          return newSet;
        });
        console.log('取消收藏成功:', tripId);
      } else {
        // 新增收藏
        await axios.post('/api/user-favorites', {
          line_user_id: lineUserId,
          trip_id: tripId
        });
        setFavorites(prev => new Set([...prev, tripId]));
        console.log('新增收藏成功:', tripId);
      }
    } catch (err) {
      console.error('收藏操作失敗:', err);
      alert('操作失敗，請稍後再試');
    }
  };

  const handleShare = async (trip) => {
    const shareText = `🌟 推薦行程：${trip.title}\n📍 地區：${trip.area}\n📅 日期：${formatDate(trip.start_date)} - ${formatDate(trip.end_date)}\n⏰ 天數：${trip.duration_days}天\n\n快來一起規劃精彩旅程吧！`;

    // 記錄分享行為
    try {
      await axios.post('/api/user-shares', {
        line_user_id: lineUserId,
        trip_id: trip.trip_id,
        share_type: 'line'
      });
    } catch (err) {
      console.error('記錄分享失敗:', err);
    }

    // 如果在 LINE 環境中
    if (typeof window !== 'undefined' && window.liff) {
      try {
        await window.liff.shareTargetPicker([{
          type: 'text',
          text: shareText
        }]);
        console.log('LINE 分享成功');
      } catch (err) {
        console.error('LINE 分享失敗:', err);
        fallbackShare(shareText);
      }
    } else {
      fallbackShare(shareText);
    }
  };

  const fallbackShare = (shareText) => {
    if (navigator.share) {
      navigator.share({
        title: '推薦行程',
        text: shareText
      }).then(() => {
        console.log('系統分享成功');
      }).catch(err => {
        console.error('系統分享失敗:', err);
        copyToClipboard(shareText);
      });
    } else {
      copyToClipboard(shareText);
    }
  };

  const copyToClipboard = (text) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        alert('行程資訊已複製到剪貼板！');
      }).catch(err => {
        console.error('複製失敗:', err);
        alert('複製失敗，請手動複製');
      });
    } else {
      // 備用方案
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        alert('行程資訊已複製到剪貼板！');
      } catch (err) {
        console.error('複製失敗:', err);
        alert('複製失敗，請手動複製');
      }
      document.body.removeChild(textArea);
    }
  };

  const handleTripClick = async (tripId) => {
    try {
      const response = await axios.get(`/api/trip-detail?id=${tripId}`);
      setSelectedTrip(response.data);
      console.log('行程詳情載入成功:', tripId);
    } catch (err) {
      console.error('獲取行程詳情失敗:', err);
      alert('載入行程詳情失敗');
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('zh-TW', options);
  };

  const renderWelcomeSection = () => {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '32px 24px',
        borderRadius: '16px',
        textAlign: 'center',
        marginBottom: '32px',
        boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)'
      }}>
        <h1 style={{
          margin: '0 0 24px 0',
          fontSize: '28px',
          fontWeight: '700'
        }}>
          Tourhub 行程排行榜
        </h1>

        {/* 快速統計 */}
        {statistics && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
            gap: '16px',
            marginTop: '20px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
                {statistics.overview.totalTrips}
              </div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>總行程</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
                {statistics.popularAreas[0]?.area || '無'}
              </div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>熱門地區</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
                {favorites.size}
              </div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>我的收藏</div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderFilterPanel = () => {
    return (
      <div style={{
        background: 'white',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        padding: '20px',
        marginBottom: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h4 style={{ margin: '0 0 16px 0', color: '#2d3748' }}>🔍 篩選條件</h4>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px'
        }}>
          <div>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '600',
              color: '#4a5568',
              fontSize: '14px'
            }}>
              地區
            </label>
            <select
              value={filters.area}
              onChange={(e) => setFilters({ ...filters, area: e.target.value })}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '14px',
                background: 'white'
              }}
            >
              <option value="">全部地區</option>
              {areas.map((area, index) => (
                <option key={index} value={area}>{area}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '600',
              color: '#4a5568',
              fontSize: '14px'
            }}>
              行程長度
            </label>
            <select
              value={filters.duration_type}
              onChange={(e) => setFilters({ ...filters, duration_type: e.target.value })}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '14px',
                background: 'white'
              }}
            >
              <option value="">全部長度</option>
              <option value="週末遊">週末遊 (1-2天)</option>
              <option value="短期旅行">短期旅行 (3-5天)</option>
              <option value="長假期">長假期 (6-10天)</option>
              <option value="深度旅行">深度旅行 (10天以上)</option>
            </select>
          </div>
          <div>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '600',
              color: '#4a5568',
              fontSize: '14px'
            }}>
              季節
            </label>
            <select
              value={filters.season}
              onChange={(e) => setFilters({ ...filters, season: e.target.value })}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '14px',
                background: 'white'
              }}
            >
              <option value="">全部季節</option>
              <option value="春季">春季 (3-5月)</option>
              <option value="夏季">夏季 (6-8月)</option>
              <option value="秋季">秋季 (9-11月)</option>
              <option value="冬季">冬季 (12-2月)</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'end' }}>
            <button
              onClick={() => setFilters({ duration_type: '', season: '', area: '' })}
              style={{
                background: '#f7fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                padding: '8px 16px',
                cursor: 'pointer',
                fontSize: '14px',
                height: 'fit-content'
              }}
            >
              重置篩選
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderRankingTabs = () => {
    const tabs = [
      { key: 'area', label: '熱門地區', description: '各地區精選' },
      { key: 'duration', label: '行程長度', description: '按天數分類' },
      { key: 'season', label: '季節精選', description: '四季主題行程' }
    ];

    return (
      <div className={styles.rankingTabs}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={activeTab === tab.key ? styles.active : ''}
            onClick={() => setActiveTab(tab.key)}
            title={tab.description}
          >
            {tab.label}
          </button>
        ))}
      </div>
    );
  };

  const renderTrip = (trip, index) => {
    const isFavorited = favorites.has(trip.trip_id);

    return (
      <div key={trip.trip_id} className={styles.rankingItem}>
        <div className={styles.rank}>
          {index + 1}
        </div>
        <div
          className={styles.tripInfo}
          onClick={() => handleTripClick(trip.trip_id)}
          style={{ cursor: 'pointer' }}
        >
          <h3>{trip.title}</h3>
          <div className={styles.tripDetails}>
            <span className={styles.area}>{trip.area}</span>
            <span className={styles.date}>
              {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
            </span>
            {trip.duration_days && (
              <span className={styles.durationTag}>
                {trip.duration_days}天
              </span>
            )}
            {trip.season && (
              <span className={styles.seasonTag}>
                {trip.season}
              </span>
            )}
            {trip.duration_type && (
              <span className={styles.durationTag}>
                {trip.duration_type}
              </span>
            )}
            {trip.status && trip.status !== '即將出發' && (
              <span className={`${styles.statusTag} ${styles[trip.status.replace(/\s+/g, '').toLowerCase()]}`}>
                {trip.status === '進行中' ? '進行中' : '已結束'}
              </span>
            )}
          </div>
          {trip.description && (
            <p style={{ color: '#718096', fontSize: '14px', marginTop: '8px', lineHeight: '1.5' }}>
              {trip.description.length > 120
                ? trip.description.substring(0, 120) + '...'
                : trip.description}
            </p>
          )}
        </div>

        {/* 收藏按鈕 */}
        <button
          className={`${styles.favoriteButton} ${isFavorited ? styles.favorited : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            handleFavorite(trip.trip_id);
          }}
          title={isFavorited ? '取消收藏' : '加入收藏'}
        >
          {isFavorited ? '❤️' : '🤍'}
        </button>
      </div>
    );
  };

  const renderRankingList = () => {
    if (loading) return <div className={styles.loading}>載入中...</div>;
    if (error) return <div className={styles.error}>{error}</div>;
    if (trips.length === 0) return (
      <div className={styles.noTrips}>
        沒有找到符合條件的行程。<br />
        <small style={{ color: '#999' }}>嘗試調整篩選條件或選擇其他分類</small>
      </div>
    );

    return (
      <div className={styles.rankingList}>
        {trips.map((trip, index) => renderTrip(trip, index))}

        {/* 載入更多按鈕 */}
        {trips.length >= 20 && (
          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <button
              onClick={() => fetchTripRankings(activeTab)}
              style={{
                background: '#3182ce',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              重新載入
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.tripRankingContainer}>
      {/* 歡迎區塊 */}
      {renderWelcomeSection()}

      {/* 篩選面板 */}
      {renderFilterPanel()}

      {/* 分類標籤 */}
      {renderRankingTabs()}

      {/* 排行榜列表 */}
      {renderRankingList()}

      {/* 行程詳情彈窗 */}
      {selectedTrip && (
        <TripDetail
          trip={selectedTrip.trip}
          details={selectedTrip.details}
          participants={selectedTrip.participants}
          onClose={() => setSelectedTrip(null)}
        />
      )}
    </div>
  );
};

export default HomePage;
