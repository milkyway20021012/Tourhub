import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TripDetail from '../components/TripDetail';
import styles from '../components/TripList.module.css';

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
        try {
            const response = await axios.get(`/api/user-favorites?line_user_id=${lineUserId}&limit=100`);
            setFavorites(response.data.favorites);

            // 計算統計資料
            calculateStatistics(response.data.favorites);

            console.log('收藏資料載入成功:', response.data.favorites.length, '筆');
        } catch (error) {
            console.error('獲取收藏失敗:', error);
            setError('載入收藏失敗，請稍後再試。');
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
            stats.byStatus[fav.status] = (stats.byStatus[fav.status] || 0) + 1;

            // 按地區統計
            stats.byArea[fav.area] = (stats.byArea[fav.area] || 0) + 1;

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
            const response = await axios.get(`/api/trip-detail?id=${tripId}`);
            setSelectedTrip(response.data);
            console.log('行程詳情載入成功:', tripId);
        } catch (error) {
            console.error('獲取行程詳情失敗:', error);
            alert('載入行程詳情失敗');
        }
    };

    const handleShare = async (favorite) => {
        const shareText = `💖 我的收藏行程：${favorite.title}\n📍 地區：${favorite.area}\n📅 日期：${formatDate(favorite.start_date)} - ${formatDate(favorite.end_date)}\n⏰ 天數：${favorite.duration_days}天\n\n快來一起規劃精彩旅程吧！`;

        // 記錄分享行為
        try {
            await axios.post('/api/user-shares', {
                line_user_id: lineUserId,
                trip_id: favorite.trip_id,
                share_type: 'favorite'
            });
        } catch (err) {
            console.error('記錄分享失敗:', err);
        }

        // 分享邏輯 (與排行榜相同)
        if (typeof window !== 'undefined' && window.liff) {
            try {
                await window.liff.shareTargetPicker([{
                    type: 'text',
                    text: shareText
                }]);
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
                title: '我的收藏行程',
                text: shareText
            }).catch(() => copyToClipboard(shareText));
        } else {
            copyToClipboard(shareText);
        }
    };

    const copyToClipboard = (text) => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                alert('行程資訊已複製到剪貼板！');
            });
        }
    };

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('zh-TW', options);
    };

    const renderStatistics = () => {
        return (
            <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '24px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
                <h3 style={{ margin: '0 0 16px 0', color: '#2d3748' }}>📊 收藏統計</h3>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: '16px'
                }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#e53e3e' }}>
                            {statistics.total}
                        </div>
                        <div style={{ fontSize: '14px', color: '#718096' }}>總收藏數</div>
                    </div>

                    {Object.entries(statistics.byStatus).map(([status, count]) => (
                        <div key={status} style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#3182ce' }}>
                                {count}
                            </div>
                            <div style={{ fontSize: '14px', color: '#718096' }}>{status}</div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    if (loading) return <div className={styles.loading}>載入中...</div>;
    if (error) return <div className={styles.error}>{error}</div>;

    return (
        <div className={styles.tripListContainer}>
            <h2>💖 我的收藏</h2>

            {/* 統計面板 */}
            {favorites.length > 0 && renderStatistics()}

            {favorites.length === 0 ? (
                <div className={styles.noTrips}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>💔</div>
                    <div>還沒有收藏任何行程</div>
                    <div style={{ fontSize: '14px', color: '#999', marginTop: '8px' }}>
                        去發現一些精彩的旅程吧！
                    </div>
                    <button
                        onClick={() => window.location.href = '/ranking'}
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
                <div className={styles.tripCardView}>
                    {favorites.map((favorite) => (
                        <div key={favorite.trip_id} className={styles.tripCard}>
                            <div className={styles.tripCardHeader}>
                                <div className={styles.tripCardTitle}>{favorite.title}</div>
                                <button
                                    onClick={() => handleRemoveFavorite(favorite.trip_id)}
                                    style={{
                                        position: 'absolute',
                                        top: '10px',
                                        right: '50px',
                                        background: 'none',
                                        border: 'none',
                                        fontSize: '18px',
                                        cursor: 'pointer',
                                        color: '#e53e3e',
                                        padding: '4px'
                                    }}
                                    title="移除收藏"
                                >
                                    💔
                                </button>
                                <button
                                    onClick={() => handleShare(favorite)}
                                    style={{
                                        position: 'absolute',
                                        top: '10px',
                                        right: '10px',
                                        background: '#10b981',
                                        color: 'white',
                                        border: 'none',
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        fontSize: '12px',
                                        cursor: 'pointer'
                                    }}
                                    title="分享收藏"
                                >
                                    📤
                                </button>
                            </div>
                            <div
                                className={styles.tripCardContent}
                                onClick={() => handleTripClick(favorite.trip_id)}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className={styles.tripCardInfo}>
                                    <span className={styles.tripCardArea}>{favorite.area}</span>
                                    <span style={{
                                        background: favorite.status === '即將出發' ? '#e6fffa' :
                                            favorite.status === '進行中' ? '#fff5f5' : '#f7fafc',
                                        color: favorite.status === '即將出發' ? '#234e52' :
                                            favorite.status === '進行中' ? '#742a2a' : '#718096',
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        fontSize: '12px'
                                    }}>
                                        {favorite.status}
                                    </span>
                                </div>
                                <div className={styles.tripCardInfo}>
                                    <span className={styles.tripCardDate}>
                                        {formatDate(favorite.start_date)} - {formatDate(favorite.end_date)}
                                    </span>
                                    <span style={{ fontSize: '12px', color: '#999' }}>
                                        ({favorite.duration_days}天)
                                    </span>
                                </div>
                                <div style={{ fontSize: '12px', color: '#999', marginTop: '10px' }}>
                                    💖 收藏於: {formatDate(favorite.favorited_at)}
                                </div>
                            </div>
                        </div>
                    ))}
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