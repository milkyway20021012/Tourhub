import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TripDetail from '../components/TripDetail';
import styles from '../components/TripRanking.module.css';

const FavoritesPage = () => {
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedTrip, setSelectedTrip] = useState(null);
    const [statistics, setStatistics] = useState({
        total: 0,
        byStatus: {},
        byArea: {},
        byDuration: {}
    });

    // 假設的 LINE 用戶 ID (實際應該從 LINE SDK 或登入系統獲取)
    const [lineUserId, setLineUserId] = useState('demo_user_123');

    useEffect(() => {
        fetchFavorites();
    }, []);

    const fetchFavorites = async () => {
        setLoading(true);
        setError(null);

        try {
            console.log('開始獲取收藏列表，用戶 ID:', lineUserId);

            const response = await axios.get(`/api/user-favorites`, {
                params: {
                    line_user_id: lineUserId,
                    limit: 100
                }
            });

            console.log('收藏 API 回應:', response.data);

            if (response.data.success) {
                setFavorites(response.data.favorites || []);
                calculateStatistics(response.data.favorites || []);
                console.log('收藏資料載入成功:', response.data.favorites?.length || 0, '筆');
            } else {
                console.warn('收藏 API 回應格式異常:', response.data);
                setFavorites([]);
                calculateStatistics([]);
            }

        } catch (error) {
            console.error('獲取收藏失敗:', error);

            // 詳細錯誤處理
            if (error.response) {
                const status = error.response.status;
                const message = error.response.data?.message || '未知錯誤';

                if (status === 404) {
                    setError('收藏功能暫時無法使用，請稍後再試。');
                } else if (status === 500) {
                    setError('伺服器錯誤，請稍後再試。');
                } else {
                    setError(`載入收藏失敗: ${message}`);
                }
            } else if (error.request) {
                setError('網路連接失敗，請檢查網路連接。');
            } else {
                setError('載入收藏失敗，請稍後再試。');
            }

            setFavorites([]);
            calculateStatistics([]);
        } finally {
            setLoading(false);
        }
    };

    const calculateStatistics = (favs) => {
        const stats = {
            total: favs.length,
            byStatus: {},
            byArea: {},
            byDuration: {}
        };

        favs.forEach(fav => {
            // 按狀態統計
            const status = fav.status || '未知';
            stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;

            // 按地區統計
            const area = fav.area || '未知';
            stats.byArea[area] = (stats.byArea[area] || 0) + 1;

            // 按天數統計
            const durationKey = fav.duration_days <= 2 ? '短期' :
                fav.duration_days <= 7 ? '中期' : '長期';
            stats.byDuration[durationKey] = (stats.byDuration[durationKey] || 0) + 1;
        });

        setStatistics(stats);
    };

    const handleRemoveFavorite = async (tripId) => {
        if (!confirm('確定要移除這個收藏嗎？')) return;

        try {
            console.log('嘗試移除收藏:', tripId);

            await axios.delete('/api/user-favorites', {
                data: { line_user_id: lineUserId, trip_id: tripId }
            });

            // 更新本地狀態
            const newFavorites = favorites.filter(f => f.trip_id !== tripId);
            setFavorites(newFavorites);
            calculateStatistics(newFavorites);

            console.log('移除收藏成功:', tripId);
        } catch (error) {
            console.error('移除收藏失敗:', error);
            alert('移除收藏失敗，請稍後再試。');
        }
    };

    const handleTripClick = async (tripId) => {
        try {
            console.log('獲取行程詳情:', tripId);
            const response = await axios.get(`/api/trip-detail`, {
                params: { id: tripId }
            });
            setSelectedTrip(response.data);
            console.log('行程詳情載入成功:', tripId);
        } catch (error) {
            console.error('獲取行程詳情失敗:', error);
            alert('載入行程詳情失敗');
        }
    };

    const formatDate = (dateString) => {
        try {
            const options = { year: 'numeric', month: 'short', day: 'numeric' };
            return new Date(dateString).toLocaleDateString('zh-TW', options);
        } catch (error) {
            return dateString;
        }
    };

    const renderHeader = () => {
        return (
            <div className={styles.header}>
                <h1 className={styles.title}>❤️ 我的收藏</h1>
                {statistics.total > 0 && (
                    <div className={styles.statsGrid}>
                        <div className={styles.statItem}>
                            <div className={styles.statNumber}>{statistics.total}</div>
                            <div className={styles.statLabel}>總收藏數</div>
                        </div>
                        <div className={styles.statItem}>
                            <div className={styles.statNumber}>
                                {Object.keys(statistics.byArea).length}
                            </div>
                            <div className={styles.statLabel}>涵蓋地區</div>
                        </div>
                        <div className={styles.statItem}>
                            <div className={styles.statNumber}>
                                {Math.round(favorites.reduce((sum, f) => sum + f.duration_days, 0) / favorites.length) || 0}
                            </div>
                            <div className={styles.statLabel}>平均天數</div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderStatistics = () => {
        if (favorites.length === 0) return null;

        return (
            <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '24px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
                <h3 style={{ margin: '0 0 16px 0', color: '#2d3748' }}>收藏分析</h3>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '16px'
                }}>
                    {/* 地區分布 */}
                    <div>
                        <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#718096' }}>熱門地區</h4>
                        {Object.entries(statistics.byArea).slice(0, 3).map(([area, count]) => (
                            <div key={area} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                padding: '4px 0',
                                fontSize: '14px'
                            }}>
                                <span>{area}</span>
                                <span style={{ fontWeight: 'bold', color: '#3182ce' }}>{count}</span>
                            </div>
                        ))}
                    </div>

                    {/* 行程長度分布 */}
                    <div>
                        <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#718096' }}>行程長度</h4>
                        {Object.entries(statistics.byDuration).map(([duration, count]) => (
                            <div key={duration} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                padding: '4px 0',
                                fontSize: '14px'
                            }}>
                                <span>{duration}</span>
                                <span style={{ fontWeight: 'bold', color: '#3182ce' }}>{count}</span>
                            </div>
                        ))}
                    </div>

                    {/* 狀態分布 */}
                    <div>
                        <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#718096' }}>行程狀態</h4>
                        {Object.entries(statistics.byStatus).map(([status, count]) => (
                            <div key={status} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                padding: '4px 0',
                                fontSize: '14px'
                            }}>
                                <span>{status}</span>
                                <span style={{ fontWeight: 'bold', color: '#3182ce' }}>{count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const renderBackButton = () => {
        return (
            <div style={{ marginBottom: '20px' }}>
                <button
                    onClick={() => window.history.back()}
                    style={{
                        background: '#f7fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '8px 16px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    ← 返回
                </button>
            </div>
        );
    };

    const renderRetryButton = () => {
        return (
            <button
                onClick={fetchFavorites}
                style={{
                    background: '#3182ce',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    marginTop: '16px'
                }}
            >
                🔄 重新載入
            </button>
        );
    };

    if (loading) return (
        <div className={styles.container}>
            {renderBackButton()}
            <div className={styles.loading}>
                <div style={{ fontSize: '18px', marginBottom: '8px' }}>⏳ 載入中...</div>
                <div style={{ fontSize: '14px', color: '#71717a' }}>正在獲取收藏資料</div>
            </div>
        </div>
    );

    if (error) return (
        <div className={styles.container}>
            {renderBackButton()}
            <div className={styles.error}>
                <div style={{ fontSize: '18px', marginBottom: '8px' }}>❌ 載入失敗</div>
                <div style={{ fontSize: '14px' }}>{error}</div>
                {renderRetryButton()}
            </div>
        </div>
    );

    return (
        <div className={styles.container}>
            {renderBackButton()}
            {renderHeader()}
            {renderStatistics()}

            {favorites.length === 0 ? (
                <div className={styles.empty}>
                    <div className={styles.emptyIcon}>💔</div>
                    <div className={styles.emptyText}>還沒有收藏任何行程</div>
                    <div className={styles.emptySubtext}>
                        去發現一些精彩的旅程吧！
                    </div>
                    <button
                        onClick={() => window.location.href = '/'}
                        style={{
                            background: '#3182ce',
                            color: 'white',
                            border: 'none',
                            padding: '12px 24px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            marginTop: '16px'
                        }}
                    >
                        🎯 探索行程
                    </button>
                </div>
            ) : (
                <div className={styles.tripList}>
                    {favorites.map((favorite, index) => (
                        <div key={favorite.trip_id} className={styles.tripCard} style={{ position: 'relative' }}>
                            {/* 移除收藏按鈕 */}
                            <button
                                onClick={() => handleRemoveFavorite(favorite.trip_id)}
                                style={{
                                    position: 'absolute',
                                    top: '12px',
                                    right: '12px',
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    border: '1px solid #f87171',
                                    borderRadius: '50%',
                                    width: '32px',
                                    height: '32px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    color: '#ef4444'
                                }}
                                title="移除收藏"
                            >
                                ❌
                            </button>

                            <div className={styles.tripRank}>
                                {index + 1}
                            </div>

                            <div
                                className={styles.tripContent}
                                onClick={() => handleTripClick(favorite.trip_id)}
                                style={{ cursor: 'pointer' }}
                            >
                                <h3 className={styles.tripTitle}>{favorite.title}</h3>

                                <div className={styles.tripMeta}>
                                    <span className={styles.tripArea}>{favorite.area}</span>
                                    <span className={styles.tripDate}>
                                        {formatDate(favorite.start_date)} - {formatDate(favorite.end_date)}
                                    </span>
                                </div>

                                <div className={styles.tripTags}>
                                    {favorite.duration_days && (
                                        <span className={styles.tag}>
                                            ⏰ {favorite.duration_days}天
                                        </span>
                                    )}
                                    {favorite.status && (
                                        <span className={`${styles.tag} ${favorite.status === '進行中' ? styles.tagActive :
                                            favorite.status === '即將出發' ? styles.tagUpcoming : ''
                                            }`}>
                                            {favorite.status === '進行中' ? '🔥' :
                                                favorite.status === '即將出發' ? '🎯' : '✅'} {favorite.status}
                                        </span>
                                    )}
                                    <span className={styles.tag} style={{ background: '#fef3c7', color: '#92400e' }}>
                                        ❤️ 已收藏
                                    </span>
                                </div>

                                {favorite.description && (
                                    <p className={styles.tripDescription}>
                                        {favorite.description.length > 100
                                            ? favorite.description.substring(0, 100) + '...'
                                            : favorite.description}
                                    </p>
                                )}

                                {favorite.favorited_at && (
                                    <div style={{
                                        fontSize: '12px',
                                        color: '#999',
                                        marginTop: '10px',
                                        borderTop: '1px solid #f0f0f0',
                                        paddingTop: '8px'
                                    }}>
                                        收藏於: {formatDate(favorite.favorited_at)}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* 重新整理按鈕 */}
            {favorites.length > 0 && (
                <div style={{ textAlign: 'center', marginTop: '24px' }}>
                    <button
                        onClick={fetchFavorites}
                        style={{
                            background: '#f7fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            padding: '8px 16px',
                            cursor: 'pointer',
                            fontSize: '14px'
                        }}
                    >
                        🔄 重新整理
                    </button>
                </div>
            )}

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

export default FavoritesPage;