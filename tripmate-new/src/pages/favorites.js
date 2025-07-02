import React, { useState, useEffect } from 'react';
import axios from 'axios';
import dynamic from 'next/dynamic';
import TripDetail from '../components/TripDetail';
import styles from '../components/TripRanking.module.css';
import { useLiff } from '../hooks/useLiff';

// 動態載入主要內容，避免 SSR 問題
const DynamicFavoritesContent = dynamic(() => Promise.resolve(FavoritesContent), {
    ssr: false,
    loading: () => <div style={{ padding: '20px', textAlign: 'center' }}>載入中...</div>
});

const FavoritesContent = ({
    favorites,
    loading,
    error,
    selectedTrip,
    statistics,
    liffHook,
    userIdDebug,
    onFetchFavorites,
    onRemoveFavorite,
    onTripClick,
    onSetSelectedTrip
}) => {
    const {
        isReady,
        isLoggedIn,
        userProfile,
        loading: liffLoading,
        error: liffError,
        getUserId,
        getDisplayName,
        login
    } = liffHook;

    const formatDate = (dateString) => {
        try {
            if (!dateString) return '未知日期';
            const options = { year: 'numeric', month: 'short', day: 'numeric' };
            return new Date(dateString).toLocaleDateString('zh-TW', options);
        } catch (error) {
            return '日期錯誤';
        }
    };

    const renderDebugInfo = () => {
        if (process.env.NODE_ENV === 'development') {
            return (
                <div style={{
                    background: '#f0f0f0',
                    padding: '10px',
                    margin: '10px 0',
                    borderRadius: '5px',
                    fontSize: '12px',
                    fontFamily: 'monospace'
                }}>
                    <h4>🐛 除錯資訊</h4>
                    <p>LIFF 就緒: {isReady ? '✅' : '❌'}</p>
                    <p>已登入: {isLoggedIn ? '✅' : '❌'}</p>
                    <p>用戶 ID: {userIdDebug || '無'}</p>
                    <p>顯示名稱: {getDisplayName()}</p>
                    <p>LIFF 載入中: {liffLoading ? '✅' : '❌'}</p>
                    <p>LIFF 錯誤: {liffError || '無'}</p>
                    <p>收藏數量: {favorites.length}</p>
                    <p>載入狀態: {loading ? '載入中' : '完成'}</p>
                    <p>錯誤訊息: {error || '無'}</p>
                </div>
            );
        }
        return null;
    };

    const renderHeader = () => {
        return (
            <div className={styles.header}>
                <h1 className={styles.title}>我的收藏</h1>

                {/* 除錯資訊 */}
                {renderDebugInfo()}

                {/* 用戶資訊 */}
                {isReady && (
                    <div style={{ marginBottom: '16px', color: 'white', textAlign: 'center' }}>
                        {isLoggedIn ? (
                            <div>
                                <span>{getDisplayName()} 的收藏</span>
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
                                <br />
                            </div>
                        ) : (
                            <div>
                                <span>請先登入 LINE 帳號查看收藏</span>
                                <button
                                    onClick={login}
                                    style={{
                                        marginLeft: '8px',
                                        padding: '8px 16px',
                                        background: '#00C300',
                                        border: 'none',
                                        borderRadius: '4px',
                                        color: 'white',
                                        cursor: 'pointer',
                                        fontSize: '14px'
                                    }}
                                >
                                    登入 LINE
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {statistics.total > 0 && (
                    <div className={styles.statsGrid}>
                        <div className={styles.statItem} style={{
                            minWidth: '200px',
                            padding: '24px',
                            textAlign: 'center'
                        }}>
                            <div className={styles.statNumber} style={{
                                fontSize: '48px',
                                fontWeight: 'bold',
                                marginBottom: '8px'
                            }}>
                                {statistics.total}
                            </div>
                            <div className={styles.statLabel} style={{
                                fontSize: '16px',
                                fontWeight: '500'
                            }}>
                                總收藏數
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderBackButton = () => {
        return (
            <div style={{ marginBottom: '20px' }}>
                <button
                    onClick={() => {
                        if (typeof window !== 'undefined') {
                            window.location.href = '/';
                        }
                    }}
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
                    ← 返回首頁
                </button>
            </div>
        );
    };

    // 如果 LIFF 還在載入中
    if (liffLoading) {
        return (
            <div className={styles.container}>
                {renderBackButton()}
                <div className={styles.loading}>
                    <div style={{ fontSize: '18px', marginBottom: '8px' }}>🔄 初始化中...</div>
                    <div style={{ fontSize: '14px', color: '#71717a' }}>正在連接 LINE 服務</div>
                </div>
            </div>
        );
    }

    // 如果用戶未登入
    if (isReady && !isLoggedIn) {
        return (
            <div className={styles.container}>
                {renderBackButton()}
                {renderHeader()}
                <div className={styles.empty}>
                    <div className={styles.emptyIcon}>🔐</div>
                    <div className={styles.emptyText}>請先登入 LINE 帳號</div>
                    <div className={styles.emptySubtext}>
                        登入後即可查看您的專屬收藏列表
                    </div>
                    <button
                        onClick={login}
                        style={{
                            background: '#00C300',
                            color: 'white',
                            border: 'none',
                            padding: '12px 24px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '16px',
                            marginTop: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            margin: '16px auto 0'
                        }}
                    >
                        📱 登入 LINE
                    </button>
                </div>
            </div>
        );
    }

    // 資料載入中
    if (loading) {
        return (
            <div className={styles.container}>
                {renderBackButton()}
                {renderHeader()}
                <div className={styles.loading}>
                    <div style={{ fontSize: '18px', marginBottom: '8px' }}>⏳ 載入中...</div>
                    <div style={{ fontSize: '14px', color: '#71717a' }}>正在獲取 {getDisplayName()} 的收藏資料</div>
                </div>
            </div>
        );
    }

    // 載入錯誤
    if (error) {
        return (
            <div className={styles.container}>
                {renderBackButton()}
                {renderHeader()}
                <div className={styles.error}>
                    <div style={{ fontSize: '18px', marginBottom: '8px' }}>❌ 載入失敗</div>
                    <div style={{ fontSize: '14px', marginBottom: '16px' }}>{error}</div>

                    <button
                        onClick={onFetchFavorites}
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
                        🔄 重新載入
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {renderBackButton()}
            {renderHeader()}

            {favorites.length === 0 ? (
                <div className={styles.empty}>
                    <div className={styles.emptyIcon}>💔</div>
                    <div className={styles.emptyText}>還沒有收藏任何行程</div>
                    <div className={styles.emptySubtext}>
                        去發現一些精彩的旅程吧！
                    </div>

                    {/* 除錯按鈕 */}
                    {process.env.NODE_ENV === 'development' && (
                        <div style={{ marginTop: '20px' }}>
                            <button
                                onClick={onFetchFavorites}
                                style={{
                                    background: '#orange',
                                    color: 'white',
                                    border: 'none',
                                    padding: '8px 16px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    marginRight: '8px'
                                }}
                            >
                                🔍 強制重新查詢
                            </button>
                            <button
                                onClick={() => {
                                    console.log('🐛 當前狀態:', {
                                        isReady,
                                        isLoggedIn,
                                        userIdDebug,
                                        favoritesLength: favorites.length,
                                        loading,
                                        error
                                    });
                                }}
                                style={{
                                    background: '#purple',
                                    color: 'white',
                                    border: 'none',
                                    padding: '8px 16px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '12px'
                                }}
                            >
                                🐛 列印狀態到控制台
                            </button>
                        </div>
                    )}

                    <button
                        onClick={() => {
                            if (typeof window !== 'undefined') {
                                window.location.href = '/';
                            }
                        }}
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
                            <button
                                onClick={() => onRemoveFavorite(favorite.trip_id)}
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
                                onClick={() => onTripClick(favorite.trip_id)}
                                style={{ cursor: 'pointer' }}
                            >
                                <h3 className={styles.tripTitle}>{favorite.title || '未知行程'}</h3>

                                <div className={styles.tripMeta}>
                                    <span className={styles.tripArea}>{favorite.area || '未知地區'}</span>
                                    <span className={styles.tripDate}>
                                        {favorite.start_date && favorite.end_date ?
                                            `${formatDate(favorite.start_date)} - ${formatDate(favorite.end_date)}` :
                                            '日期未知'
                                        }
                                    </span>
                                </div>

                                <div className={styles.tripTags}>
                                    {favorite.duration_days && (
                                        <span className={styles.tag}>
                                            ⏰ {favorite.duration_days}天
                                        </span>
                                    )}
                                    {favorite.status && (
                                        <span className={styles.tag}>
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

            {favorites.length > 0 && (
                <div style={{ textAlign: 'center', marginTop: '24px' }}>
                    <button
                        onClick={onFetchFavorites}
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

            {selectedTrip && (
                <TripDetail
                    trip={selectedTrip.trip}
                    details={selectedTrip.details || []}
                    participants={selectedTrip.participants || []}
                    onClose={() => onSetSelectedTrip(null)}
                />
            )}
        </div>
    );
};

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

    // 整合 LIFF
    const liffHook = useLiff(process.env.NEXT_PUBLIC_LIFF_ID || 'your-liff-id-here');

    // 獲取當前用戶 ID 並增加除錯
    const getCurrentUserId = () => {
        const userId = liffHook.getUserId();
        console.log('🆔 getCurrentUserId 被調用:', {
            isLoggedIn: liffHook.isLoggedIn,
            userId: userId,
            userProfile: liffHook.userProfile
        });

        if (liffHook.isLoggedIn && userId) {
            return userId;
        }

        return null;
    };

    // 為除錯保存用戶 ID
    const [userIdDebug, setUserIdDebug] = useState(null);

    useEffect(() => {
        if (liffHook.isLoggedIn) {
            const userId = getCurrentUserId();
            setUserIdDebug(userId);
            console.log('🔄 useEffect: 用戶 ID 更新為:', userId);
        }
    }, [liffHook.isLoggedIn, liffHook.userProfile]);

    useEffect(() => {
        console.log('🔄 useEffect: LIFF 狀態變化:', {
            isReady: liffHook.isReady,
            isLoggedIn: liffHook.isLoggedIn,
            userIdDebug: userIdDebug
        });

        // 等待 LIFF 準備完成且用戶已登入才載入收藏
        if (liffHook.isReady && liffHook.isLoggedIn && userIdDebug) {
            console.log('✅ 條件符合，開始載入收藏');
            fetchFavorites();
        } else if (liffHook.isReady && !liffHook.isLoggedIn) {
            // LIFF 準備完成但用戶未登入，停止載入狀態
            console.log('⚠️ 用戶未登入，停止載入');
            setLoading(false);
        }
    }, [liffHook.isReady, liffHook.isLoggedIn, userIdDebug]);

    const fetchFavorites = async () => {
        const userId = getCurrentUserId();

        console.log('🔍 fetchFavorites 開始:', {
            userId: userId,
            isLoggedIn: liffHook.isLoggedIn,
            isReady: liffHook.isReady
        });

        if (!userId) {
            console.log('❌ 沒有用戶 ID，無法載入收藏');
            setLoading(false);
            setError('無法取得用戶 ID');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            console.log('📡 發送 API 請求:', `/api/user-favorites?line_user_id=${userId}`);

            const response = await axios.get('/api/user-favorites', {
                params: {
                    line_user_id: userId,
                    limit: 100
                },
                timeout: 10000
            });

            console.log('📡 API 回應:', response.data);

            if (response.data && response.data.success) {
                const favoritesData = response.data.favorites || [];
                setFavorites(favoritesData);
                calculateStatistics(favoritesData);
                console.log(`✅ ${liffHook.getDisplayName()} 的收藏資料載入成功:`, favoritesData.length, '筆');
            } else {
                throw new Error(response.data?.message || 'API 回應格式錯誤');
            }

        } catch (error) {
            console.error('💥 獲取收藏失敗:', error);

            let errorMessage = '載入收藏失敗，請稍後再試。';

            if (error.response) {
                const status = error.response.status;
                const serverMessage = error.response.data?.message || '';

                console.error('📡 API 錯誤詳情:', {
                    status: status,
                    data: error.response.data,
                    headers: error.response.headers
                });

                switch (status) {
                    case 400:
                        errorMessage = '請求參數錯誤';
                        break;
                    case 404:
                        errorMessage = '收藏功能尚未啟用';
                        break;
                    case 500:
                        errorMessage = `伺服器錯誤：${serverMessage}`;
                        break;
                    default:
                        errorMessage = `載入失敗 (${status})：${serverMessage}`;
                }
            } else if (error.request) {
                errorMessage = '網路連接失敗，請檢查網路連接';
            } else if (error.code === 'ECONNABORTED') {
                errorMessage = '請求超時，請稍後再試';
            } else {
                errorMessage = error.message || '發生未知錯誤';
            }

            setError(errorMessage);
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
            const status = fav.status || '未知';
            stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;

            const area = fav.area || '未知';
            stats.byArea[area] = (stats.byArea[area] || 0) + 1;

            const durationKey = fav.duration_days <= 2 ? '短期' :
                fav.duration_days <= 7 ? '中期' : '長期';
            stats.byDuration[durationKey] = (stats.byDuration[durationKey] || 0) + 1;
        });

        setStatistics(stats);
    };

    const handleRemoveFavorite = async (tripId) => {
        if (!confirm('確定要移除這個收藏嗎？')) return;

        const userId = getCurrentUserId();
        if (!userId) {
            alert('請先登入 LINE 帳號');
            return;
        }

        try {
            console.log('🗑️ 嘗試移除收藏:', tripId);

            await axios.delete('/api/user-favorites', {
                data: { line_user_id: userId, trip_id: tripId },
                timeout: 5000
            });

            const newFavorites = favorites.filter(f => f.trip_id !== tripId);
            setFavorites(newFavorites);
            calculateStatistics(newFavorites);

            console.log('✅ 移除收藏成功:', tripId);
        } catch (error) {
            console.error('💥 移除收藏失敗:', error);
            alert('移除收藏失敗，請稍後再試。');
        }
    };

    const handleTripClick = async (tripId) => {
        try {
            const response = await axios.get('/api/trip-detail', {
                params: { id: tripId },
                timeout: 5000
            });

            if (response.data && response.data.success) {
                setSelectedTrip(response.data);
            } else {
                throw new Error('行程詳情格式錯誤');
            }
        } catch (error) {
            console.error('💥 獲取行程詳情失敗:', error);
            alert('載入行程詳情失敗');
        }
    };

    // 服務器端渲染時的簡單頁面
    if (typeof window === 'undefined') {
        return (
            <div style={{ padding: '20px', textAlign: 'center' }}>
                <h1>我的收藏</h1>
                <p>載入中...</p>
            </div>
        );
    }

    return (
        <DynamicFavoritesContent
            favorites={favorites}
            loading={loading}
            error={error}
            selectedTrip={selectedTrip}
            statistics={statistics}
            liffHook={liffHook}
            userIdDebug={userIdDebug}
            onFetchFavorites={fetchFavorites}
            onRemoveFavorite={handleRemoveFavorite}
            onTripClick={handleTripClick}
            onSetSelectedTrip={setSelectedTrip}
        />
    );
};

export default FavoritesPage;