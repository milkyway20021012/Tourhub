// components/TripRanking.js - 繁體中文版本，簡潔UI，移除標籤
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './TripRanking.module.css';

const TripRanking = () => {
  const [trips, setTrips] = useState([]);
  const [originalTrips, setOriginalTrips] = useState([]); // 新增：保存原始資料
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('date'); // 'area', 'date', 'budget', 'duration', 'season', 'trending'

  // 新增：統計資料狀態
  const [stats, setStats] = useState({
    totalTrips: 0,
    avgBudget: 0,
    popularArea: '',
    avgDuration: 0
  });

  // 新增：篩選和排序狀態
  const [filters, setFilters] = useState({
    search: '',
    budgetRange: '',
    durationRange: '',
    sortBy: 'created_at',
    sortOrder: 'DESC'
  });

  // 新增：收藏狀態
  const [favorites, setFavorites] = useState([]);

  // 新增：初始化收藏狀態（在客戶端執行）
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('tripFavorites');
      if (saved) {
        setFavorites(JSON.parse(saved));
      }
    }
  }, []);

  useEffect(() => {
    fetchTripRankings(activeTab);
    fetchStats();
  }, [activeTab]);

  // 新增：監聽篩選變化
  useEffect(() => {
    if (originalTrips.length > 0) {
      applyFiltersAndSort();
    }
  }, [filters, originalTrips]);

  // 新增：儲存收藏到 localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('tripFavorites', JSON.stringify(favorites));
    }
  }, [favorites]);

  const fetchTripRankings = async (rankingType) => {
    setLoading(true);
    try {
      console.log('獲取排行榜資料，類型:', rankingType);
      const response = await axios.get(`/api/trip-rankings-enhanced?type=${rankingType}`);

      // 處理回應資料
      const data = response.data.success ? response.data.data : response.data;
      setOriginalTrips(data); // 保存原始資料
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

  // 新增：獲取統計資料
  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/trip-stats');
      setStats(response.data);
    } catch (err) {
      console.error('獲取統計資料失敗:', err);
    }
  };

  // 新增：篩選和排序邏輯
  const applyFiltersAndSort = () => {
    let filteredTrips = [...originalTrips]; // 從原始資料開始篩選

    // 搜尋篩選
    if (filters.search) {
      filteredTrips = filteredTrips.filter(trip =>
        trip.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        trip.area.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    // 預算範圍篩選
    if (filters.budgetRange) {
      filteredTrips = filteredTrips.filter(trip => {
        const budget = trip.budget || 0;
        switch (filters.budgetRange) {
          case 'low': return budget < 10000;
          case 'medium': return budget >= 10000 && budget < 30000;
          case 'high': return budget >= 30000 && budget < 50000;
          case 'luxury': return budget >= 50000;
          default: return true;
        }
      });
    }

    // 行程長度篩選
    if (filters.durationRange) {
      filteredTrips = filteredTrips.filter(trip => {
        const duration = trip.duration_days || calculateDuration(trip.start_date, trip.end_date);
        switch (filters.durationRange) {
          case 'short': return duration <= 3;
          case 'medium': return duration > 3 && duration <= 7;
          case 'long': return duration > 7;
          default: return true;
        }
      });
    }

    // 排序
    filteredTrips.sort((a, b) => {
      let aValue = a[filters.sortBy];
      let bValue = b[filters.sortBy];

      if (filters.sortBy === 'budget') {
        aValue = aValue || 0;
        bValue = bValue || 0;
      }

      if (filters.sortBy === 'duration_days') {
        aValue = aValue || calculateDuration(a.start_date, a.end_date);
        bValue = bValue || calculateDuration(b.start_date, b.end_date);
      }

      if (filters.sortOrder === 'ASC') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setTrips(filteredTrips);
  };

  const handleViewTrip = async (tripId) => {
    try {
      console.log('檢視行程:', tripId);
      // 這裡可以添加檢視行程的邏輯，比如跳轉到詳情頁面
    } catch (err) {
      console.error('檢視行程錯誤:', err);
    }
  };

  // 新增：收藏功能
  const handleFavorite = (tripId) => {
    setFavorites(prev => {
      if (prev.includes(tripId)) {
        return prev.filter(id => id !== tripId);
      } else {
        return [...prev, tripId];
      }
    });
  };

  // 新增：分享功能（分享到LINE）
  const handleShare = (trip) => {
    const shareText = `🌟 ${trip.title}\n📍 地區：${trip.area}\n💰 預算：${trip.budget ? `$${trip.budget.toLocaleString()}` : '未設定'}\n📅 ${formatDate(trip.start_date)} - ${formatDate(trip.end_date)}\n\n快來看看這個精彩的行程！`;

    // LINE 分享 URL
    const lineShareUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(shareText)}`;

    // 檢查是否為手機環境
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (isMobile) {
      // 手機環境：嘗試使用 LINE app 分享
      const lineAppUrl = `line://msg/text/${encodeURIComponent(shareText)}`;
      window.open(lineAppUrl, '_blank');

      // 如果 LINE app 無法開啟，則使用網頁版
      setTimeout(() => {
        window.open(lineShareUrl, '_blank');
      }, 1000);
    } else {
      // 桌面環境：使用網頁版 LINE 分享
      window.open(lineShareUrl, '_blank', 'width=600,height=400');
    }
  };

  // 新增：篩選器變更處理
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('zh-TW', options);
  };

  // 新增：計算行程長度
  const calculateDuration = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
  };

  // 新增：獲取行程狀態
  const getStatus = (startDate, endDate) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > now) return { text: '即將出發', class: 'upcoming' };
    if (end < now) return { text: '已結束', class: 'completed' };
    return { text: '進行中', class: 'ongoing' };
  };

  // 新增：獲取預算範圍標籤
  const getBudgetLabel = (budget) => {
    if (!budget) return '未設定';
    if (budget < 10000) return '經濟型';
    if (budget < 30000) return '中等型';
    if (budget < 50000) return '豪華型';
    return '頂級型';
  };

  // 新增：獲取季節標籤
  const getSeasonLabel = (startDate) => {
    const month = new Date(startDate).getMonth() + 1;
    if (month >= 3 && month <= 5) return '春季';
    if (month >= 6 && month <= 8) return '夏季';
    if (month >= 9 && month <= 11) return '秋季';
    return '冬季';
  };

  const getTabTitle = (tab) => {
    switch (tab) {
      case 'area':
        return '熱門地區';
      case 'date':
        return '即將出發';
      case 'budget':
        return '預算區間';
      case 'duration':
        return '行程長度';
      case 'season':
        return '季節熱門';
      case 'trending':
        return '趨勢分析';
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
      case 'budget':
        return '按預算區間分類的行程';
      case 'duration':
        return '按行程長度分類的行程';
      case 'season':
        return '按季節分類的熱門行程';
      case 'trending':
        return '最近30天的熱門趨勢';
      default:
        return '';
    }
  };

  // 新增：統計面板
  const renderStatsPanel = () => (
    <div className={styles.statsPanel}>
      <div className={styles.statItem}>
        <span className={styles.statValue}>{stats.totalTrips}</span>
        <span className={styles.statLabel}>總行程數</span>
      </div>
      <div className={styles.statItem}>
        <span className={styles.statValue}>
          {stats.avgBudget ? `$${Math.round(stats.avgBudget / 1000)}K` : '無'}
        </span>
        <span className={styles.statLabel}>平均預算</span>
      </div>
      <div className={styles.statItem}>
        <span className={styles.statValue}>{stats.popularArea || '無'}</span>
        <span className={styles.statLabel}>最熱門地區</span>
      </div>
      <div className={styles.statItem}>
        <span className={styles.statValue}>
          {stats.avgDuration ? `${Math.round(stats.avgDuration)}天` : '無'}
        </span>
        <span className={styles.statLabel}>平均天數</span>
      </div>
    </div>
  );

  // 新增：篩選和排序面板
  const renderFilterSortPanel = () => (
    <div className={styles.filterSortPanel}>
      <div className={styles.filterRow}>
        <div className={styles.filterGroup}>
          <label>🔍 搜尋行程</label>
          <div className={styles.searchBox}>
            <input
              type="text"
              placeholder="搜尋行程標題或地區..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
            <span className={styles.searchIcon}>🔍</span>
          </div>
        </div>

        <div className={styles.filterGroup}>
          <label>💰 預算範圍</label>
          <select
            value={filters.budgetRange}
            onChange={(e) => handleFilterChange('budgetRange', e.target.value)}
          >
            <option value="">全部預算</option>
            <option value="low">經濟型 (1萬以下)</option>
            <option value="medium">中等型 (1-3萬)</option>
            <option value="high">豪華型 (3-5萬)</option>
            <option value="luxury">頂級型 (5萬以上)</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label>📅 行程長度</label>
          <select
            value={filters.durationRange}
            onChange={(e) => handleFilterChange('durationRange', e.target.value)}
          >
            <option value="">全部長度</option>
            <option value="short">短途 (1-3天)</option>
            <option value="medium">中程 (4-7天)</option>
            <option value="long">長途 (8天以上)</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label>📊 排序方式</label>
          <select
            value={filters.sortBy}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
          >
            <option value="created_at">建立時間</option>
            <option value="start_date">出發日期</option>
            <option value="budget">預算</option>
            <option value="duration_days">行程長度</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label>⬇️ 排序順序</label>
          <select
            value={filters.sortOrder}
            onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
          >
            <option value="DESC">由高到低</option>
            <option value="ASC">由低到高</option>
          </select>
        </div>
      </div>
    </div>
  );

  // 修正：分類標籤渲染
  const renderRankingTabs = () => (
    <div className={styles.rankingTabs}>
      <button
        className={activeTab === 'area' ? styles.active : ''}
        onClick={() => setActiveTab('area')}
      >
        🗺️ 熱門地區
      </button>
      <button
        className={activeTab === 'date' ? styles.active : ''}
        onClick={() => setActiveTab('date')}
      >
        🚀 即將出發
      </button>
      <button
        className={activeTab === 'budget' ? styles.active : ''}
        onClick={() => setActiveTab('budget')}
      >
        💰 預算區間
      </button>
      <button
        className={activeTab === 'duration' ? styles.active : ''}
        onClick={() => setActiveTab('duration')}
      >
        📅 行程長度
      </button>
      <button
        className={activeTab === 'season' ? styles.active : ''}
        onClick={() => setActiveTab('season')}
      >
        🌸 季節熱門
      </button>
      <button
        className={activeTab === 'trending' ? styles.active : ''}
        onClick={() => setActiveTab('trending')}
      >
        📈 趨勢分析
      </button>
    </div>
  );

  // 修正：排行榜列表渲染
  const renderRankingList = () => {
    if (loading) return <div className={styles.loading}>載入中...</div>;
    if (error) return <div className={styles.error}>{error}</div>;
    if (trips.length === 0) return <div className={styles.noTrips}>沒有找到行程。</div>;

    return (
      <div className={styles.rankingList}>
        {trips.map((trip, index) => {
          const duration = calculateDuration(trip.start_date, trip.end_date);
          const status = getStatus(trip.start_date, trip.end_date);
          const isFavorited = favorites.includes(trip.trip_id);

          return (
            <div key={trip.trip_id} className={styles.rankingItem}>
              <div className={styles.rank}>
                {index + 1}
              </div>
              <div className={styles.tripInfo} onClick={() => handleViewTrip(trip.trip_id)}>
                <h3>{trip.title}</h3>

                {/* 新增：標籤區域 */}
                <div style={{ marginBottom: '12px' }}>
                  <span className={styles.durationTag}>
                    📅 {duration}天
                  </span>
                  <span className={styles.budgetTag}>
                    💰 {getBudgetLabel(trip.budget)}
                  </span>
                  <span className={styles.seasonTag}>
                    🌸 {getSeasonLabel(trip.start_date)}
                  </span>
                  <span className={`${styles.statusTag} ${styles[status.class]}`}>
                    {status.text}
                  </span>
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

              {/* 新增：收藏按鈕 */}
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

              {/* 新增：分享按鈕 */}
              <button
                className={styles.shareButton}
                onClick={(e) => {
                  e.stopPropagation();
                  handleShare(trip);
                }}
                title="分享到 LINE"
              >
                📤 LINE
              </button>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={styles.tripRankingContainer}>
      <h2>行程排行榜</h2>

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

      {/* 新增：統計面板 */}
      {renderStatsPanel()}

      {/* 新增：篩選和排序面板 */}
      {renderFilterSortPanel()}

      {/* 原有：分類標籤 */}
      {renderRankingTabs()}

      {/* 原有：排行榜列表 */}
      {renderRankingList()}
    </div>
  );
};

export default TripRanking;