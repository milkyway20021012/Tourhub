import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TripDetail from '../components/TripDetail';
import styles from '../components/TripRanking.module.css';
import { useLiff } from '../hooks/useLiff';

const HomePage = () => {
  const [trips, setTrips] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [areas, setAreas] = useState([]);

  // 收藏功能相關狀態
  const [favorites, setFavorites] = useState(new Set());
  const [favoriteLoading, setFavoriteLoading] = useState({});

  // LIFF 整合
  const {
    isReady,
    isLoggedIn,
    userProfile,
    loading: liffLoading,
    error: liffError,
    getUserId,
    getDisplayName,
    login
  } = useLiff(process.env.NEXT_PUBLIC_LIFF_ID || 'your-liff-id-here');

  // 篩選狀態
  const [filters, setFilters] = useState({
    duration_type: '',
    season: '',
    area: ''
  });

  // 獲取當前用戶 ID
  const getCurrentUserId = () => {
    if (isLoggedIn && getUserId()) {
      return getUserId();
    }
    // 開發環境下的備用方案
    return process.env.NODE_ENV === 'development' ? 'demo_user_123' : null;
  };

  useEffect(() => {
    if (isReady) {
      initializeData();
    }
  }, [isReady, isLoggedIn]);

  useEffect(() => {
    if (isReady) {
      fetchTripRankings(activeTab);
    }
  }, [activeTab, filters, isReady]);

  const initializeData = async () => {
    await Promise.all([
      fetchStatistics(),
      fetchAreas(),
      fetchUserFavorites(),
      fetchTripRankings(activeTab)
    ]);
  };

  // 獲取用戶收藏列表
  const fetchUserFavorites = async () => {
    const userId = getCurrentUserId();
    if (!userId) {
      console.log('⚠️ 沒有用戶 ID，跳過收藏查詢');
      return;
    }

    try {
      console.log('🔍 獲取用戶收藏，用戶 ID:', userId);

      const response = await axios.get('/api/user-favorites', {
        params: { line_user_id: userId }
      });

      if (response.data.success) {
        const favIds = new Set(response.data.favorites.map(f => f.trip_id));
        setFavorites(favIds);
        console.log('✅ 收藏列表載入成功:', favIds.size, '筆');
      }
    } catch (err) {
      console.error('💥 獲取收藏列表失敗:', err);
    }
  };

  // 切換收藏狀態
  const toggleFavorite = async (tripId, event) => {
    event.stopPropagation();

    const userId = getCurrentUserId();
    if (!userId) {
      if (!isLoggedIn) {
        alert('請先登入 LINE 帳號才能使用收藏功能');
        try {
          await login();
        } catch (error) {
          console.error('登入失敗:', error);
        }
      }
      return;
    }

    setFavoriteLoading(prev => ({ ...prev, [tripId]: true }));

    try {
      const isFavorited = favorites.has(tripId);

      if (isFavorited) {
        // 取消收藏
        await axios.delete('/api/user-favorites', {
          data: { line_user_id: userId, trip_id: tripId }
        });

        setFavorites(prev => {
          const newSet = new Set(prev);
          newSet.delete(tripId);
          return newSet;
        });

        console.log('✅ 取消收藏成功:', tripId);
      } else {
        // 添加收藏
        await axios.post('/api/user-favorites', {
          line_user_id: userId,
          trip_id: tripId
        });

        setFavorites(prev => new Set([...prev, tripId]));
        console.log('✅ 添加收藏成功:', tripId);
      }
    } catch (err) {
      console.error('💥 收藏操作失敗:', err);

      if (err.response?.status === 409) {
        alert('此行程已在收藏列表中');
      } else if (err.response?.status === 404) {
        alert('行程不存在');
      } else {
        alert('操作失敗，請稍後再試');
      }
    } finally {
      setFavoriteLoading(prev => ({ ...prev, [tripId]: false }));
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await axios.get('/api/trip-statistics');
      setStatistics(response.data);
    } catch (err) {
      console.error('獲取統計資料失敗:', err);
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
    } catch (err) {
      console.error('獲取排行榜失敗:', err);
      setError('載入排行榜失敗，請稍後再試。');
    } finally {
      setLoading(false);
    }
  };

  const handleTripClick = async (tripId) => {
    try {
      const response = await axios.get(`/api/trip-detail?id=${tripId}`);
      setSelectedTrip(response.data);
    } catch (err) {
      console.error('獲取行程詳情失敗:', err);
      alert('載入行程詳情失敗');
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('zh-TW', options);
  };

  const renderHeader = () => {
    return (
      <div className={styles.header}>
        <h1 className={styles.title}>Tourhub 行程排行榜</h1>

        {/* 用戶資訊 */}
        {isReady && (
          <div style={{ marginBottom: '16px', color: 'white', textAlign: 'center' }}>
            {isLoggedIn ? (
              <div>
                <span>👋 歡迎，{getDisplayName()}</span>
                {userProfile?.pictureUrl && (
                  <img
                    src={userProfile.pictureUrl}
                    alt="頭像"
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      marginLeft: '8px',
                      verticalAlign: 'middle'
                    }}
                  />
                )}
              </div>
            ) : (
              <div>
                <span>👤 訪客模式</span>
                <button
                  onClick={login}
                  style={{
                    marginLeft: '8px',
                    padding: '4px 8px',
                    background: 'rgba(255,255,255,0.2)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    borderRadius: '4px',
                    color: 'white',
                    cursor: 'pointer'
                  }}
                >
                  登入
                </button>
              </div>
            )}
          </div>
        )}

        {/* 統計面板 */}
        {statistics && (
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <div className={styles.statNumber}>{statistics.overview.totalTrips}</div>
              <div className={styles.statLabel}>總行程</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statNumber}>{favorites.size}</div>
              <div className={styles.statLabel}>我的收藏</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statNumber}>{statistics.overview.avgDuration}</div>
              <div className={styles.statLabel}>平均天數</div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderFilterPanel = () => {
    return (
      <div className={styles.filterPanel}>
        <div className={styles.filterGrid}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>地區</label>
            <select
              value={filters.area}
              onChange={(e) => setFilters({ ...filters, area: e.target.value })}
              className={styles.filterSelect}
            >
              <option value="">全部地區</option>
              {areas.map((area, index) => (
                <option key={index} value={area}>{area}</option>
              ))}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>行程長度</label>
            <select
              value={filters.duration_type}
              onChange={(e) => setFilters({ ...filters, duration_type: e.target.value })}
              className={styles.filterSelect}
            >
              <option value="">旅途天數</option>
              <option value="週末遊">1-2天</option>
              <option value="短期旅行">3-5天</option>
              <option value="長假期">6-10天</option>
              <option value="深度旅行">10天以上</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>季節</label>
            <select
              value={filters.season}
              onChange={(e) => setFilters({ ...filters, season: e.target.value })}
              className={styles.filterSelect}
            >
              <option value="">全部季節</option>
              <option value="春季">春季 (3-5月)</option>
              <option value="夏季">夏季 (6-8月)</option>
              <option value="秋季">秋季 (9-11月)</option>
              <option value="冬季">冬季 (12-2月)</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <button
              onClick={() => setFilters({ duration_type: '', season: '', area: '' })}
              className={styles.resetButton}
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
      { key: 'all', label: '全部行程' },
      { key: 'favorites', label: '我的收藏' }
    ];

    return (
      <div className={styles.tabsContainer}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`${styles.tab} ${activeTab === tab.key ? styles.tabActive : ''}`}
            onClick={() => {
              if (tab.key === 'favorites') {
                const userId = getCurrentUserId();
                if (!userId) {
                  alert('請先登入 LINE 帳號才能查看收藏');
                  return;
                }
                window.location.href = '/favorites';
              } else {
                setActiveTab(tab.key);
              }
            }}
          >
            {tab.label}
            {tab.key === 'favorites' && favorites.size > 0 && (
              <span style={{
                marginLeft: '8px',
                background: '#ef4444',
                color: 'white',
                borderRadius: '10px',
                padding: '2px 6px',
                fontSize: '12px'
              }}>
                {favorites.size}
              </span>
            )}
          </button>
        ))}
      </div>
    );
  };

  const renderFavoriteButton = (tripId) => {
    const isFavorited = favorites.has(tripId);
    const isLoading = favoriteLoading[tripId];

    return (
      <button
        onClick={(e) => toggleFavorite(tripId, e)}
        disabled={isLoading}
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          background: 'rgba(255, 255, 255, 0.9)',
          border: 'none',
          borderRadius: '50%',
          width: '36px',
          height: '36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          fontSize: '16px',
          transition: 'all 0.2s ease',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          opacity: isLoading ? 0.7 : 1
        }}
        title={isLoading ? '處理中...' : (isFavorited ? '取消收藏' : '加入收藏')}
      >
        {isLoading ? '⏳' : (isFavorited ? '❤️' : '🤍')}
      </button>
    );
  };

  const renderTrip = (trip, index) => {
    return (
      <div
        key={trip.trip_id}
        className={styles.tripCard}
        onClick={() => handleTripClick(trip.trip_id)}
        style={{ position: 'relative' }}
      >
        <div className={styles.tripRank}>
          {index + 1}
        </div>

        {/* 收藏按鈕 */}
        {renderFavoriteButton(trip.trip_id)}

        <div className={styles.tripContent}>
          <h3 className={styles.tripTitle}>{trip.title}</h3>

          <div className={styles.tripMeta}>
            <span className={styles.tripArea}>{trip.area}</span>
            <span className={styles.tripDate}>
              {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
            </span>
          </div>

          <div className={styles.tripTags}>
            {trip.duration_days && (
              <span className={styles.tag}>
                {trip.duration_days}天
              </span>
            )}
            {trip.season && (
              <span className={styles.tag}>
                {trip.season}
              </span>
            )}
            {trip.duration_type && (
              <span className={styles.tag}>
                {trip.duration_type}
              </span>
            )}
          </div>

          {trip.description && (
            <p className={styles.tripDescription}>
              {trip.description.length > 100
                ? trip.description.substring(0, 100) + '...'
                : trip.description}
            </p>
          )}
        </div>
      </div>
    );
  };

  const renderTripList = () => {
    if (liffLoading) return <div className={styles.loading}>初始化中...</div>;
    if (loading) return <div className={styles.loading}>載入中...</div>;
    if (error) return <div className={styles.error}>{error}</div>;
    if (trips.length === 0) return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>📍</div>
        <div className={styles.emptyText}>沒有找到符合條件的行程</div>
        <div className={styles.emptySubtext}>嘗試調整篩選條件或選擇其他分類</div>
      </div>
    );

    return (
      <div className={styles.tripList}>
        {trips.map((trip, index) => renderTrip(trip, index))}

        {trips.length >= 20 && (
          <div className={styles.loadMoreContainer}>
            <button
              onClick={() => fetchTripRankings(activeTab)}
              className={styles.loadMoreButton}
            >
              重新載入
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.container}>
      {renderHeader()}
      {renderFilterPanel()}
      {renderRankingTabs()}
      {renderTripList()}

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