import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TripDetail from '../components/TripDetail';
import styles from '../components/TripRanking.module.css';

const HomePage = () => {
  const [trips, setTrips] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('area');
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [areas, setAreas] = useState([]);

  // 篩選狀態
  const [filters, setFilters] = useState({
    duration_type: '',
    season: '',
    area: ''
  });

  useEffect(() => {
    initializeData();
  }, []);

  useEffect(() => {
    fetchTripRankings(activeTab);
  }, [activeTab, filters]);

  const initializeData = async () => {
    await Promise.all([
      fetchStatistics(),
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

  const renderHeader = () => {
    return (
      <div className={styles.header}>
        <h1 className={styles.title}>Tourhub 行程排行榜</h1>

        {/* 簡化的統計面板 */}
        {statistics && (
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <div className={styles.statNumber}>{statistics.overview.totalTrips}</div>
              <div className={styles.statLabel}>總行程</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statNumber}>{statistics.popularAreas[0]?.area || '無'}</div>
              <div className={styles.statLabel}>預設排行</div>
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
      { key: 'area', label: '預設排行' },
      { key: 'duration', label: '行程長度' },
      { key: 'season', label: '季節精選' }
    ];

    return (
      <div className={styles.tabsContainer}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`${styles.tab} ${activeTab === tab.key ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>
    );
  };

  const renderTrip = (trip, index) => {
    return (
      <div
        key={trip.trip_id}
        className={styles.tripCard}
        onClick={() => handleTripClick(trip.trip_id)}
      >
        <div className={styles.tripRank}>
          {index + 1}
        </div>

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
            {trip.status && trip.status !== '即將出發' && (
              <span className={`${styles.tag} ${styles.tagStatus}`}>
                {trip.status}
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
