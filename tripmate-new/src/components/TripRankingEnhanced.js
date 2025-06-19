import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './TripRanking.module.css';

const TripRankingEnhanced = () => {
    const [trips, setTrips] = useState([]);
    const [statistics, setStatistics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('date');
    const [favorites, setFavorites] = useState(new Set());

    // 篩選狀態
    const [filters, setFilters] = useState({
        duration_type: '',
        season: '',
        area: ''
    });

    // 假設的 LINE 用戶 ID (實際應該從 LINE SDK 獲取)
    const lineUserId = 'demo_user_123';

    useEffect(() => {
        fetchStatistics();
        fetchUserFavorites();
        fetchTripRankings(activeTab);
    }, [activeTab, filters]);

    const fetchStatistics = async () => {
        try {
            const response = await axios.get('/api/trip-statistics');
            setStatistics(response.data);
        } catch (err) {
            console.error('獲取統計資料失敗:', err);
        }
    };

    const fetchUserFavorites = async () => {
        try {
            const response = await axios.get(`/api/user-favorites?line_user_id=${lineUserId}`);
            const favIds = new Set(response.data.favorites.map(f => f.trip_id));
            setFavorites(favIds);
        } catch (err) {
            console.error('獲取收藏失敗:', err);
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
            } else {
                // 新增收藏
                await axios.post('/api/user-favorites', {
                    line_user_id: lineUserId,
                    trip_id: tripId
                });
                setFavorites(prev => new Set([...prev, tripId]));
            }
        } catch (err) {
            console.error('收藏操作失敗:', err);
            alert('操作失敗，請稍後再試');
        }
    };

    const handleShare = (trip) => {
        // LINE 分享功能
        const shareText = `🌟 推薦行程：${trip.title}\n📍 地區：${trip.area}\n📅 日期：${formatDate(trip.start_date)} - ${formatDate(trip.end_date)}\n⏰ 天數：${trip.duration_days}天\n\n快來一起規劃精彩旅程吧！`;

        // 如果在 LINE 環境中
        if (window.liff) {
            window.liff.shareTargetPicker([{
                type: 'text',
                text: shareText
            }]);
        } else {
            // 一般分享
            if (navigator.share) {
                navigator.share({
                    title: `推薦行程：${trip.title}`,
                    text: shareText
                });
            } else {
                // 複製到剪貼板
                navigator.clipboard.writeText(shareText).then(() => {
                    alert('行程資訊已複製到剪貼板！');
                });
            }
        }
    };

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('zh-TW', options);
    };

    const renderStatisticsPanel = () => {
        if (!statistics) return null;

        return (
            <div className={styles.statsPanel}>
                <div className={styles.statItem}>
                    <span className={styles.statValue}>{statistics.overview.totalTrips}</span>
                    <span className={styles.statLabel}>總行程數</span>
                </div>
                <div className={styles.statItem}>
                    <span className={styles.statValue}>{statistics.overview.avgDuration}</span>
                    <span className={styles.statLabel}>平均天數</span>
                </div>
                <div className={styles.statItem}>
                    <span className={styles.statValue}>{statistics.overview.upcomingTrips}</span>
                    <span className={styles.statLabel}>即將出發</span>
                </div>
                <div className={styles.statItem}>
                    <span className={styles.statValue}>{statistics.popularAreas[0]?.area || '無'}</span>
                    <span className={styles.statLabel}>最熱門地區</span>
                </div>
            </div>
        );
    };

    const renderFilterPanel = () => {
        return (
            <div className={styles.filterSortPanel}>
                <div className={styles.filterRow}>
                    <div className={styles.filterGroup}>
                        <label>行程長度</label>
                        <select
                            value={filters.duration_type}
                            onChange={(e) => setFilters({ ...filters, duration_type: e.target.value })}
                        >
                            <option value="">全部長度</option>
                            <option value="週末遊">週末遊 (1-2天)</option>
                            <option value="短期旅行">短期旅行 (3-5天)</option>
                            <option value="長假期">長假期 (6-10天)</option>
                            <option value="深度旅行">深度旅行 (10天以上)</option>
                        </select>
                    </div>
                    <div className={styles.filterGroup}>
                        <label>季節</label>
                        <select
                            value={filters.season}
                            onChange={(e) => setFilters({ ...filters, season: e.target.value })}
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
            { key: 'date', label: '🚀 即將出發', description: '最新出發行程' },
            { key: 'area', label: '🗺️ 熱門地區', description: '各地區精選' },
            { key: 'duration', label: '⏰ 行程長度', description: '按天數分類' },
            { key: 'season', label: '🌸 季節精選', description: '四季主題行程' },
            { key: 'trending', label: '🔥 趨勢分析', description: '最新熱門行程' }
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
                <div className={styles.tripInfo}>
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
                    </div>
                    {trip.description && (
                        <p style={{ color: '#718096', fontSize: '14px', marginTop: '8px' }}>
                            {trip.description.length > 100
                                ? trip.description.substring(0, 100) + '...'
                                : trip.description}
                        </p>
                    )}
                </div>

                {/* 收藏按鈕 */}
                <button
                    className={`${styles.favoriteButton} ${isFavorited ? styles.favorited : ''}`}
                    onClick={() => handleFavorite(trip.trip_id)}
                    title={isFavorited ? '取消收藏' : '加入收藏'}
                >
                    {isFavorited ? '❤️' : '🤍'}
                </button>

                {/* 分享按鈕 */}
                <button
                    className={styles.shareButton}
                    onClick={() => handleShare(trip)}
                    title="分享行程"
                >
                    📤 分享
                </button>
            </div>
        );
    };

    const renderRankingList = () => {
        if (loading) return <div className={styles.loading}>載入中...</div>;
        if (error) return <div className={styles.error}>{error}</div>;
        if (trips.length === 0) return <div className={styles.noTrips}>沒有找到符合條件的行程。</div>;

        return (
            <div className={styles.rankingList}>
                {trips.map((trip, index) => renderTrip(trip, index))}
            </div>
        );
    };

    return (
        <div className={styles.tripRankingContainer}>
            <h2>🏆 行程排行榜</h2>

            {/* 統計面板 */}
            {renderStatisticsPanel()}

            {/* 篩選面板 */}
            {renderFilterPanel()}

            {/* 分類標籤 */}
            {renderRankingTabs()}

            {/* 排行榜列表 */}
            {renderRankingList()}
        </div>
    );
};

export default TripRankingEnhanced;