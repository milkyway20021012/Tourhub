// components/TripRanking.js - 修改版：顯示所有行程
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TripDetail from './TripDetail';
import styles from './TripRanking.module.css';

const TripRanking = () => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // 改為預設顯示全部
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [tripDetails, setTripDetails] = useState({
    trip: null,
    details: [],
    participants: []
  });

  // 篩選狀態
  const [filters, setFilters] = useState({
    area: '',
    search: ''
  });

  // 分頁狀態
  const [pagination, setPagination] = useState({
    current_page: 1,
    limit: 20,
    total: 0,
    total_pages: 0
  });

  const [areas, setAreas] = useState([]);

  useEffect(() => {
    fetchAreas();
  }, []);

  useEffect(() => {
    if (activeTab === 'all') {
      fetchAllTrips();
    } else {
      fetchTripRankings(activeTab);
    }
  }, [activeTab, filters, pagination.current_page]);

  const fetchAreas = async () => {
    try {
      const response = await axios.get('/api/get-filters');
      setAreas(response.data.areas || []);
    } catch (err) {
      console.error('獲取地區失敗:', err);
    }
  };

  // 新增：獲取所有行程的函數
  const fetchAllTrips = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current_page,
        limit: pagination.limit,
        sort: 'start_date',
        order: 'DESC',
        area: filters.area,
        search: filters.search
      };

      const response = await axios.get('/api/trips-paged', { params });

      if (response.data.success) {
        setTrips(response.data.data);
        setPagination({
          ...pagination,
          total: response.data.pagination.total,
          total_pages: response.data.pagination.total_pages
        });
        setError(null);
        console.log('所有行程載入成功:', response.data.data.length, '筆');
      } else {
        throw new Error('API 返回失敗狀態');
      }
    } catch (err) {
      console.error('獲取所有行程失敗:', err);
      setError('載入行程失敗，請稍後再試。');
    } finally {
      setLoading(false);
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

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPagination({ ...pagination, current_page: 1 }); // 重置分頁
  };

  const handleFilterChange = (filterType, value) => {
    setFilters({ ...filters, [filterType]: value });
    setPagination({ ...pagination, current_page: 1 }); // 重置分頁
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.total_pages) {
      setPagination({ ...pagination, current_page: newPage });
    }
  };

  const handleTripClick = async (tripId) => {
    try {
      const response = await axios.get(`/api/trip-detail?id=${tripId}`);
      setTripDetails(response.data);
      setSelectedTrip(tripId);
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

  const calculateDuration = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const getStatusInfo = (startDate, endDate) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > now) {
      return { status: '即將出發', icon: '🎯', color: '#3182ce' };
    } else if (start <= now && end >= now) {
      return { status: '進行中', icon: '🔥', color: '#e53e3e' };
    } else {
      return { status: '已結束', icon: '✅', color: '#38a169' };
    }
  };

  const renderFilterPanel = () => {
    return (
      <div className={styles.filterPanel}>
        <div className={styles.filterGrid}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>搜尋行程</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="輸入關鍵字搜尋..."
              style={{
                padding: '12px 16px',
                border: '1px solid #d4d4d8',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>地區篩選</label>
            <select
              className={styles.filterSelect}
              value={filters.area}
              onChange={(e) => handleFilterChange('area', e.target.value)}
            >
              <option value="">全部地區</option>
              {areas.map((area, index) => (
                <option key={index} value={area}>{area}</option>
              ))}
            </select>
          </div>
          <div className={styles.filterGroup}>
            <button
              className={styles.resetButton}
              onClick={() => {
                setFilters({ area: '', search: '' });
                setPagination({ ...pagination, current_page: 1 });
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
      { key: 'all', label: '📋 所有行程', description: '顯示所有行程' },
      { key: 'date', label: '🚀 即將出發', description: '最新出發行程' },
      { key: 'area', label: '🗺️ 熱門地區', description: '各地區精選' },
      { key: 'duration', label: '⏰ 行程長度', description: '按天數分類' },
      { key: 'season', label: '🌸 季節精選', description: '四季主題行程' },
      { key: 'trending', label: '🔥 趨勢分析', description: '最新熱門行程' }
    ];

    return (
      <div className={styles.tabsContainer}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`${styles.tab} ${activeTab === tab.key ? styles.tabActive : ''}`}
            onClick={() => handleTabChange(tab.key)}
            title={tab.description}
          >
            {tab.label}
          </button>
        ))}
      </div>
    );
  };

  const renderPagination = () => {
    if (activeTab !== 'all' || pagination.total_pages <= 1) return null;

    const { current_page, total_pages } = pagination;
    const pageNumbers = [];

    let startPage = Math.max(1, current_page - 2);
    let endPage = Math.min(total_pages, startPage + 4);

    if (endPage - startPage < 4 && total_pages > 5) {
      startPage = Math.max(1, endPage - 4);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '8px',
        marginTop: '24px',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => handlePageChange(1)}
          disabled={current_page === 1}
          style={{
            padding: '8px 12px',
            background: current_page === 1 ? '#f4f4f5' : 'white',
            border: '1px solid #e4e4e7',
            borderRadius: '6px',
            cursor: current_page === 1 ? 'not-allowed' : 'pointer',
            color: current_page === 1 ? '#a1a1aa' : '#3f3f46'
          }}
        >
          &#8249;&#8249;
        </button>

        <button
          onClick={() => handlePageChange(current_page - 1)}
          disabled={current_page === 1}
          style={{
            padding: '8px 12px',
            background: current_page === 1 ? '#f4f4f5' : 'white',
            border: '1px solid #e4e4e7',
            borderRadius: '6px',
            cursor: current_page === 1 ? 'not-allowed' : 'pointer',
            color: current_page === 1 ? '#a1a1aa' : '#3f3f46'
          }}
        >
          &#8249;
        </button>

        {pageNumbers.map(number => (
          <button
            key={number}
            onClick={() => handlePageChange(number)}
            style={{
              padding: '8px 12px',
              background: current_page === number ? '#0ea5e9' : 'white',
              color: current_page === number ? 'white' : '#3f3f46',
              border: '1px solid #e4e4e7',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: current_page === number ? '600' : '400'
            }}
          >
            {number}
          </button>
        ))}

        <button
          onClick={() => handlePageChange(current_page + 1)}
          disabled={current_page === total_pages}
          style={{
            padding: '8px 12px',
            background: current_page === total_pages ? '#f4f4f5' : 'white',
            border: '1px solid #e4e4e7',
            borderRadius: '6px',
            cursor: current_page === total_pages ? 'not-allowed' : 'pointer',
            color: current_page === total_pages ? '#a1a1aa' : '#3f3f46'
          }}
        >
          &#8250;
        </button>

        <button
          onClick={() => handlePageChange(total_pages)}
          disabled={current_page === total_pages}
          style={{
            padding: '8px 12px',
            background: current_page === total_pages ? '#f4f4f5' : 'white',
            border: '1px solid #e4e4e7',
            borderRadius: '6px',
            cursor: current_page === total_pages ? 'not-allowed' : 'pointer',
            color: current_page === total_pages ? '#a1a1aa' : '#3f3f46'
          }}
        >
          &#8250;&#8250;
        </button>

        <span style={{
          marginLeft: '16px',
          fontSize: '14px',
          color: '#71717a'
        }}>
          第 {current_page}/{total_pages} 頁，共 {pagination.total} 筆
        </span>
      </div>
    );
  };

  const renderTripList = () => {
    if (loading) {
      return (
        <div className={styles.loading}>
          <div style={{ fontSize: '18px', marginBottom: '8px' }}>⏳ 載入中...</div>
          <div style={{ fontSize: '14px', color: '#71717a' }}>正在獲取行程資料</div>
        </div>
      );
    }

    if (error) {
      return (
        <div className={styles.error}>
          <div style={{ fontSize: '18px', marginBottom: '8px' }}>❌ 載入失敗</div>
          <div style={{ fontSize: '14px' }}>{error}</div>
          <button
            onClick={() => activeTab === 'all' ? fetchAllTrips() : fetchTripRankings(activeTab)}
            style={{
              marginTop: '16px',
              padding: '8px 16px',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            🔄 重試
          </button>
        </div>
      );
    }

    if (trips.length === 0) {
      return (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>🔍</div>
          <div className={styles.emptyText}>
            {activeTab === 'all' ? '暫無行程資料' : '沒有找到符合條件的行程'}
          </div>
          <div className={styles.emptySubtext}>
            {filters.area || filters.search ? '嘗試調整篩選條件' : '目前沒有可顯示的行程'}
          </div>
        </div>
      );
    }

    return (
      <div className={styles.tripList}>
        {trips.map((trip, index) => {
          const duration = calculateDuration(trip.start_date, trip.end_date);
          const statusInfo = getStatusInfo(trip.start_date, trip.end_date);

          // 計算實際排名（考慮分頁）
          const rank = activeTab === 'all'
            ? (pagination.current_page - 1) * pagination.limit + index + 1
            : index + 1;

          return (
            <div
              key={trip.trip_id}
              className={styles.tripCard}
              onClick={() => handleTripClick(trip.trip_id)}
            >
              <div className={styles.tripRank}>
                {rank}
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
                  <span className={styles.tag}>
                    ⏰ {duration}天
                  </span>
                  <span className={`${styles.tag} ${styles.tagStatus}`} style={{ color: statusInfo.color }}>
                    {statusInfo.icon} {statusInfo.status}
                  </span>
                  {trip.line_user_id && (
                    <span className={styles.tag}>
                      👤 用戶: {trip.line_user_id.substring(0, 8)}...
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
        })}
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>🎯 行程排行榜</h1>
        <div className={styles.statsGrid}>
          <div className={styles.statItem}>
            <div className={styles.statNumber}>{pagination.total || trips.length}</div>
            <div className={styles.statLabel}>
              {activeTab === 'all' ? '總行程數' : '排行榜行程'}
            </div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statNumber}>{activeTab === 'all' ? pagination.current_page : '排行'}</div>
            <div className={styles.statLabel}>
              {activeTab === 'all' ? '當前頁面' : '模式'}
            </div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statNumber}>{areas.length}</div>
            <div className={styles.statLabel}>可選地區</div>
          </div>
        </div>
      </div>

      {renderFilterPanel()}
      {renderRankingTabs()}
      {renderTripList()}
      {renderPagination()}

      {/* 行程詳情彈窗 */}
      {selectedTrip && (
        <TripDetail
          trip={tripDetails.trip}
          details={tripDetails.details}
          participants={tripDetails.participants}
          onClose={() => setSelectedTrip(null)}
        />
      )}
    </div>
  );
};

export default TripRanking;