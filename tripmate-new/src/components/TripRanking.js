// components/TripRanking.js - 修正 API 路徑版本
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './TripRanking.module.css';

const TripRanking = () => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('view'); // 'view', 'area', 'date'

  useEffect(() => {
    fetchTripRankings(activeTab);
  }, [activeTab]);

  const fetchTripRankings = async (rankingType) => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/trip-rankings?type=${rankingType}`);
      setTrips(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching trip rankings:', err);
      setError('加載排行榜失敗，請稍後再試。');
    } finally {
      setLoading(false);
    }
  };

  const handleViewTrip = async (tripId) => {
    try {
      // 增加查看次數
      await axios.post(`/api/increment-view`, { tripId });

      // 如果您想保持在當前頁面但重新獲取數據
      fetchTripRankings(activeTab);
    } catch (err) {
      console.error('Error incrementing view count:', err);
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const renderRankingTabs = () => (
    <div className={styles.rankingTabs}>
      <button
        className={activeTab === 'view' ? styles.active : ''}
        onClick={() => setActiveTab('view')}
      >
        最多瀏覽
      </button>
      <button
        className={activeTab === 'area' ? styles.active : ''}
        onClick={() => setActiveTab('area')}
      >
        熱門地區
      </button>
      <button
        className={activeTab === 'date' ? styles.active : ''}
        onClick={() => setActiveTab('date')}
      >
        即將出發
      </button>
    </div>
  );

  const renderRankingList = () => {
    if (loading) return <div className={styles.loading}>加載中...</div>;
    if (error) return <div className={styles.error}>{error}</div>;
    if (trips.length === 0) return <div className={styles.noTrips}>沒有找到行程。</div>;

    return (
      <div className={styles.rankingList}>
        {trips.map((trip, index) => (
          <div key={trip.trip_id} className={styles.rankingItem}>
            <div className={styles.rank}>{index + 1}</div>
            <div className={styles.tripInfo} onClick={() => handleViewTrip(trip.trip_id)}>
              <h3>{trip.title}</h3>
              <div className={styles.tripDetails}>
                <span className={styles.area}>{trip.area}</span>
                <span className={styles.date}>{formatDate(trip.start_date)} - {formatDate(trip.end_date)}</span>
                <span className={styles.views}>{trip.view_count || 0} 瀏覽</span>
                {trip.total_participants && (
                  <span className={styles.participants}>{trip.total_participants} 參與者</span>
                )}
                {trip.tags && (
                  <div className={styles.tags}>
                    {trip.tags.split(',').map((tag, i) => (
                      <span key={i} className={styles.tag}>{tag.trim()}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={styles.tripRankingContainer}>
      <h2>行程排行榜</h2>
      {renderRankingTabs()}
      {renderRankingList()}
    </div>
  );
};

export default TripRanking;