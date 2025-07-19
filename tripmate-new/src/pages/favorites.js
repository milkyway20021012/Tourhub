import React, { useState, useEffect } from 'react';
import axios from 'axios';
import dynamic from 'next/dynamic';

// 統一的載入畫面組件
const LoadingScreen = ({ message = "載入中...", subMessage = "正在初始化應用" }) => (
    <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#f8fafc',
        padding: '20px'
    }}>
        <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '40px',
            textAlign: 'center',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            maxWidth: '400px',
            width: '100%'
        }}>
            <div style={{
                fontSize: '32px',
                marginBottom: '16px',
                animation: 'spin 2s linear infinite'
            }}>
                ⏳
            </div>
            <div style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '8px'
            }}>
                {message}
            </div>
            <div style={{
                fontSize: '14px',
                color: '#71717a'
            }}>
                {subMessage}
            </div>
        </div>
        <style jsx>{`
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `}</style>
    </div>
);

// 動態載入 TripDetail，避免 SSR 問題
const TripDetail = dynamic(() => import('../components/TripDetail'), {
    ssr: false,
    loading: () => null
});

// 客戶端專用包裝器
const ClientOnly = ({ children, fallback = null }) => {
    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => {
        setHasMounted(true);
    }, []);

    if (!hasMounted) {
        return fallback;
    }

    return children;
};

// LINE 登入要求頁面
const LineLoginRequired = ({ onLogin, onGoHome }) => {
    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            background: '#f8fafc',
            padding: '20px'
        }}>
            <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '48px 32px',
                textAlign: 'center',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                maxWidth: '500px',
                width: '100%',
                border: '2px solid #3b82f6'
            }}>
                <div style={{
                    fontSize: '64px',
                    marginBottom: '24px'
                }}>
                    🔐
                </div>

                <h1 style={{
                    fontSize: '28px',
                    fontWeight: '700',
                    color: '#1f2937',
                    marginBottom: '16px'
                }}>
                    需要登入 LINE 才能查看收藏
                </h1>

                <p style={{
                    color: '#6b7280',
                    marginBottom: '32px',
                    lineHeight: '1.6',
                    fontSize: '16px'
                }}>
                    收藏功能專為 LINE 用戶設計，登入後您可以：
                </p>

                <div style={{
                    textAlign: 'left',
                    marginBottom: '32px',
                    background: '#f9fafb',
                    padding: '20px',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb'
                }}>
                    <div style={{ marginBottom: '8px', color: '#374151' }}>✅ 收藏喜愛的行程</div>
                    <div style={{ marginBottom: '8px', color: '#374151' }}>✅ 隨時查看收藏列表</div>
                    <div style={{ marginBottom: '8px', color: '#374151' }}>✅ 分享精彩行程給朋友</div>
                    <div style={{ color: '#374151' }}>✅ 跨裝置同步收藏資料</div>
                </div>

                <div style={{
                    display: 'flex',
                    gap: '16px',
                    justifyContent: 'center',
                    flexWrap: 'wrap'
                }}>
                    <button
                        onClick={onLogin}
                        style={{
                            background: '#00C300',
                            color: 'white',
                            border: 'none',
                            padding: '16px 32px',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            fontSize: '18px',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: '0 4px 12px rgba(0, 195, 0, 0.3)',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#00B300';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#00C300';
                            e.currentTarget.style.transform = 'translateY(0)';
                        }}
                    >
                        📱 立即登入 LINE
                    </button>
                    <button
                        onClick={onGoHome}
                        style={{
                            background: '#f3f4f6',
                            color: '#374151',
                            border: '1px solid #d1d5db',
                            padding: '16px 32px',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            fontSize: '18px',
                            fontWeight: '500',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#e5e7eb';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#f3f4f6';
                        }}
                    >
                        返回首頁
                    </button>
                </div>

                <div style={{
                    marginTop: '24px',
                    padding: '16px',
                    background: '#eff6ff',
                    borderRadius: '8px',
                    border: '1px solid #bfdbfe'
                }}>
                    <p style={{
                        color: '#1e40af',
                        fontSize: '14px',
                        margin: 0
                    }}>
                        💡 提示：登入後您的收藏資料將安全保存在 LINE 帳號中
                    </p>
                </div>
            </div>
        </div>
    );
};

// CSS 樣式（內聯以避免樣式模組問題）
const styles = {
    container: {
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '20px',
        minHeight: '100vh',
        background: '#f8fafc'
    },
    header: {
        textAlign: 'center',
        marginBottom: '32px',
        padding: '32px 24px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '16px',
        color: 'white'
    },
    loading: {
        textAlign: 'center',
        padding: '60px 20px',
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
    },
    error: {
        textAlign: 'center',
        padding: '60px 20px',
        background: '#fef2f2',
        borderRadius: '12px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        border: '1px solid #fecaca'
    },
    empty: {
        textAlign: 'center',
        padding: '60px 20px',
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
    },
    emptyIcon: {
        fontSize: '48px',
        marginBottom: '16px'
    },
    emptyText: {
        fontSize: '18px',
        fontWeight: '600',
        color: '#374151',
        marginBottom: '8px'
    },
    emptySubtext: {
        color: '#64748b',
        fontSize: '14px'
    },
    tripList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
    },
    tripCard: {
        background: 'white',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e2e8f0',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '20px',
        position: 'relative'
    },
    tripRank: {
        width: '48px',
        height: '48px',
        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
        color: 'white',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: '700',
        fontSize: '18px',
        flexShrink: '0'
    },
    tripContent: {
        flex: '1',
        minWidth: '0'
    },
    tripTitle: {
        margin: '0 0 12px 0',
        fontSize: '20px',
        fontWeight: '600',
        color: '#1e293b',
        lineHeight: '1.3'
    },
    tripMeta: {
        display: 'flex',
        gap: '16px',
        marginBottom: '12px',
        flexWrap: 'wrap'
    },
    tripArea: {
        display: 'inline-flex',
        alignItems: 'center',
        background: '#e0e7ff',
        color: '#3730a3',
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '13px',
        fontWeight: '500'
    },
    tripDate: {
        color: '#64748b',
        fontSize: '14px',
        fontWeight: '500'
    },
    tripTags: {
        display: 'flex',
        gap: '8px',
        marginBottom: '12px',
        flexWrap: 'wrap'
    },
    tag: {
        background: '#f1f5f9',
        color: '#475569',
        padding: '4px 10px',
        borderRadius: '16px',
        fontSize: '12px',
        fontWeight: '500',
        border: '1px solid #e2e8f0'
    },
    tripDescription: {
        margin: '0',
        color: '#64748b',
        fontSize: '14px',
        lineHeight: '1.5'
    }
};

const FavoritesContent = ({
    favorites,
    loading,
    error,
    selectedTrip,
    liffHook,
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
        getUserId,
        getDisplayName
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

    const renderHeader = () => {
        return (
            <div style={styles.header}>
                <h1 style={{
                    margin: '0 0 24px 0',
                    fontSize: '32px',
                    fontWeight: '700'
                }}>
                    我的收藏
                </h1>

                {/* 用戶資訊 */}
                <div style={{ marginBottom: '16px', color: 'white', textAlign: 'center' }}>
                    <div>
                        <span>{getDisplayName()}的專屬收藏</span>
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
                    <div style={{
                        fontSize: '14px',
                        opacity: '0.9',
                        marginTop: '8px'
                    }}>
                        共收藏了 {favorites.length} 個精彩行程
                    </div>
                </div>
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

    // 資料載入中
    if (loading) {
        return (
            <div style={styles.container}>
                {renderBackButton()}
                {renderHeader()}
                <LoadingScreen message="載入中..." subMessage={`正在獲取 ${getDisplayName()} 的收藏資料`} />
            </div>
        );
    }

    // 載入錯誤
    if (error && favorites.length === 0) {
        return (
            <div style={styles.container}>
                {renderBackButton()}
                {renderHeader()}
                <div style={styles.error}>
                    <div style={{ fontSize: '18px', marginBottom: '8px' }}>❌ 載入失敗</div>
                    <div style={{ fontSize: '14px', marginBottom: '16px' }}>{error}</div>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button
                            onClick={onFetchFavorites}
                            style={{
                                background: '#3182ce',
                                color: 'white',
                                border: 'none',
                                padding: '12px 24px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#2563eb';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#3182ce';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }}
                        >
                            🔄 重新載入
                        </button>
                        <button
                            onClick={() => window.location.href = '/'}
                            style={{
                                background: '#f3f4f6',
                                color: '#374151',
                                border: '1px solid #d1d5db',
                                padding: '12px 24px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#e5e7eb';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#f3f4f6';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }}
                        >
                            🏠 返回首頁
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            {renderBackButton()}
            {renderHeader()}

            {favorites.length === 0 && !error ? (
                <div style={styles.empty}>
                    <div style={styles.emptyIcon}>💔</div>
                    <div style={styles.emptyText}>還沒有收藏任何行程</div>
                    <div style={styles.emptySubtext}>
                        去首頁發現更多精彩行程吧！
                    </div>
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
                            marginTop: '16px',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#2563eb';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#3182ce';
                            e.currentTarget.style.transform = 'translateY(0)';
                        }}
                    >
                        🏠 瀏覽行程
                    </button>
                </div>
            ) : (
                <div style={styles.tripList}>
                    {favorites.map((favorite, index) => (
                        <div
                            key={favorite.trip_id}
                            style={{
                                ...styles.tripCard,
                                ':hover': {
                                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                    transform: 'translateY(-2px)',
                                    borderColor: '#3b82f6'
                                }
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.borderColor = '#3b82f6';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.borderColor = '#e2e8f0';
                            }}
                        >
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
                                    color: '#ef4444',
                                    transition: 'all 0.2s ease'
                                }}
                                title="移除收藏"
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                                    e.currentTarget.style.transform = 'scale(1.1)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                                    e.currentTarget.style.transform = 'scale(1)';
                                }}
                            >
                                ❌
                            </button>

                            <div style={styles.tripRank}>
                                {index + 1}
                            </div>

                            <div
                                style={styles.tripContent}
                                onClick={() => onTripClick(favorite.trip_id)}
                            >
                                <h3 style={styles.tripTitle}>{favorite.title || '未知行程'}</h3>

                                <div style={styles.tripMeta}>
                                    <span style={styles.tripArea}>{favorite.area || '未知地區'}</span>
                                    <span style={styles.tripDate}>
                                        {favorite.start_date && favorite.end_date ?
                                            `${formatDate(favorite.start_date)} - ${formatDate(favorite.end_date)}` :
                                            '日期未知'
                                        }
                                    </span>
                                </div>

                                <div style={styles.tripTags}>
                                    {favorite.duration_days && (
                                        <span style={styles.tag}>
                                            ⏰ {favorite.duration_days}天
                                        </span>
                                    )}
                                    {favorite.status && (
                                        <span style={styles.tag}>
                                            {favorite.status === '進行中' ? '🔥' :
                                                favorite.status === '即將出發' ? '🎯' : '✅'} {favorite.status}
                                        </span>
                                    )}
                                    <span style={{ ...styles.tag, background: '#fef3c7', color: '#92400e' }}>
                                        ❤️ 已收藏
                                    </span>
                                </div>

                                {favorite.description && (
                                    <p style={styles.tripDescription}>
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

// 動態載入主要內容，確保統一的載入文字
const DynamicFavoritesContent = dynamic(() => Promise.resolve(FavoritesContent), {
    ssr: false,
    loading: () => <LoadingScreen message="載入中..." subMessage="正在初始化我的收藏頁面" />
});

const FavoritesPage = () => {
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedTrip, setSelectedTrip] = useState(null);
    const [mounted, setMounted] = useState(false);

    // 整合 LIFF（修復版）
    const [liffHook, setLiffHook] = useState({
        isReady: false,
        isLoggedIn: false,
        userProfile: null,
        loading: true,
        error: null,
        getUserId: () => null,
        getDisplayName: () => '訪客',
        login: () => Promise.resolve()
    });

    // 確保只在客戶端執行
    useEffect(() => {
        setMounted(true);

        // 動態載入 LIFF - 修復版本
        if (typeof window !== 'undefined') {
            const initializeLiff = async () => {
                try {
                    // 檢查 LIFF SDK 是否已載入
                    if (typeof window.liff === 'undefined') {
                        console.log('正在載入 LIFF SDK...');

                        const script = document.createElement('script');
                        script.src = 'https://static.line-scdn.net/liff/edge/2/sdk.js';
                        script.async = true;
                        document.head.appendChild(script);

                        await new Promise((resolve, reject) => {
                            script.onload = resolve;
                            script.onerror = reject;
                        });

                        await new Promise(resolve => setTimeout(resolve, 100));
                    }

                    const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
                    if (!liffId) {
                        throw new Error('LIFF ID 未設定');
                    }

                    // 初始化 LIFF
                    await window.liff.init({
                        liffId: liffId,
                        withLoginOnExternalBrowser: true
                    });

                    const isLoggedIn = window.liff.isLoggedIn();
                    let userProfile = null;

                    if (isLoggedIn) {
                        userProfile = await window.liff.getProfile();
                    }

                    // 創建 LIFF hook 對象
                    const hookResult = {
                        isReady: true,
                        isLoggedIn: isLoggedIn,
                        userProfile: userProfile,
                        loading: false,
                        error: null,
                        getUserId: () => userProfile?.userId || null,
                        getDisplayName: () => userProfile?.displayName || '訪客',
                        login: async () => {
                            if (!window.liff.isLoggedIn()) {
                                window.liff.login({
                                    redirectUri: window.location.href
                                });
                            }
                        }
                    };

                    setLiffHook(hookResult);
                    console.log('LIFF 初始化完成:', hookResult);

                } catch (err) {
                    console.error('載入 LIFF hook 失敗:', err);
                    setLiffHook(prev => ({
                        ...prev,
                        loading: false,
                        isReady: true,
                        error: err.message
                    }));
                }
            };

            initializeLiff();
        }
    }, []);

    // 獲取當前用戶 ID - 修復版本
    const getCurrentUserId = () => {
        const userId = liffHook.getUserId();

        if (liffHook.isLoggedIn && userId) {
            return userId;
        }

        return process.env.NODE_ENV === 'development' ? 'demo_user_123' : null;
    };

    // 檢查是否已登入 LINE
    const isLineLoggedIn = () => {
        return liffHook.isReady && liffHook.isLoggedIn && liffHook.userProfile;
    };

    useEffect(() => {
        // 等待 LIFF 準備完成 - 修復版本
        if (liffHook.isReady && !liffHook.loading) {
            if (liffHook.isLoggedIn) {
                const userId = getCurrentUserId();
                if (userId) {
                    console.log('開始載入收藏，用戶 ID:', userId);
                    fetchFavorites();
                } else {
                    console.error('無法獲取用戶 ID');
                    setError('無法獲取用戶資訊，請重新登入');
                    setLoading(false);
                }
            } else {
                // 用戶未登入，停止載入狀態
                console.log('用戶未登入，停止載入');
                setLoading(false);
            }
        }
    }, [liffHook.isReady, liffHook.isLoggedIn, liffHook.loading]);

    const fetchFavorites = async () => {
        const userId = getCurrentUserId();

        if (!userId) {
            setLoading(false);
            setError('無法取得用戶 ID');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            console.log('正在獲取收藏，用戶 ID:', userId);

            const response = await axios.get('/api/user-favorites', {
                params: {
                    line_user_id: userId,
                    limit: 100
                },
                timeout: 15000
            });

            console.log('收藏 API 回應:', response.data);

            if (response.data && response.data.success) {
                const favoritesData = response.data.favorites || [];
                setFavorites(favoritesData);
                console.log('收藏載入成功，數量:', favoritesData.length);
                
                // 如果沒有收藏，顯示友好訊息
                if (favoritesData.length === 0) {
                    setError('您還沒有收藏任何行程，快去首頁收藏喜歡的行程吧！');
                } else {
                    setError(null);
                }
            } else {
                throw new Error(response.data?.message || 'API 回應格式錯誤');
            }

        } catch (error) {
            console.error('獲取收藏失敗:', error);

            let errorMessage = '載入收藏失敗，請稍後再試。';

            if (error.response) {
                const status = error.response.status;
                const serverMessage = error.response.data?.message || '';

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
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveFavorite = async (tripId) => {
        if (!confirm('確定要移除這個收藏嗎？')) return;

        const userId = getCurrentUserId();
        if (!userId) {
            alert('請先登入 LINE 帳號');
            return;
        }

        try {
            const response = await axios.delete('/api/user-favorites', {
                data: { line_user_id: userId, trip_id: tripId },
                timeout: 10000
            });

            if (response.data.success) {
                const newFavorites = favorites.filter(f => f.trip_id !== tripId);
                setFavorites(newFavorites);
                console.log('收藏移除成功:', tripId);
            } else {
                throw new Error(response.data.message || '移除收藏失敗');
            }
        } catch (error) {
            console.error('移除收藏失敗:', error);

            let errorMessage = '移除收藏失敗，請稍後再試。';

            if (error.response) {
                const status = error.response.status;
                const serverMessage = error.response.data?.message || '';

                switch (status) {
                    case 400:
                        errorMessage = '請求參數錯誤';
                        break;
                    case 404:
                        errorMessage = '收藏不存在或已被移除';
                        break;
                    case 500:
                        errorMessage = `伺服器錯誤：${serverMessage}`;
                        break;
                    default:
                        errorMessage = `移除失敗 (${status})：${serverMessage}`;
                }
            } else if (error.request) {
                errorMessage = '網路連接失敗，請檢查網路連接';
            } else if (error.code === 'ECONNABORTED') {
                errorMessage = '請求超時，請稍後再試';
            } else {
                errorMessage = error.message || '發生未知錯誤';
            }

            alert(errorMessage);
        }
    };

    const handleTripClick = async (tripId) => {
        try {
            const response = await axios.get('/api/trip-detail', {
                params: { id: tripId },
                timeout: 10000
            });

            if (response.data && response.data.success) {
                setSelectedTrip(response.data);
            } else {
                throw new Error('行程詳情格式錯誤');
            }
        } catch (error) {
            console.error('獲取行程詳情失敗:', error);
            alert('載入行程詳情失敗');
        }
    };

    const handleLogin = async () => {
        try {
            await liffHook.login();
        } catch (error) {
            console.error('登入失敗:', error);
            // 模擬登入成功（開發環境）
            if (process.env.NODE_ENV === 'development') {
                setLiffHook(prev => ({
                    ...prev,
                    isLoggedIn: true,
                    userProfile: { userId: 'demo_user_123', displayName: '測試用戶' }
                }));
            }
        }
    };

    const handleGoHome = () => {
        if (typeof window !== 'undefined') {
            window.location.href = '/';
        }
    };

    // 如果還沒有掛載，不渲染任何內容 (避免 hydration 錯誤)
    if (!mounted) {
        return null;
    }

    // 如果 LIFF 還在載入中
    if (liffHook.loading) {
        return (
            <ClientOnly
                fallback={<LoadingScreen message="載入中..." subMessage="正在初始化我的收藏頁面" />}
            >
                <LoadingScreen message="載入中..." subMessage="正在連接 LINE 服務" />
            </ClientOnly>
        );
    }

    // 如果用戶未登入 LINE，顯示登入要求頁面
    if (!isLineLoggedIn()) {
        return (
            <ClientOnly
                fallback={<LoadingScreen message="載入中..." subMessage="正在初始化我的收藏頁面" />}
            >
                <LineLoginRequired
                    onLogin={handleLogin}
                    onGoHome={handleGoHome}
                />
            </ClientOnly>
        );
    }

    // 用戶已登入，顯示收藏內容
    return (
        <ClientOnly
            fallback={<LoadingScreen message="載入中..." subMessage="正在初始化我的收藏頁面" />}
        >
            <DynamicFavoritesContent
                favorites={favorites}
                loading={loading}
                error={error}
                selectedTrip={selectedTrip}
                liffHook={liffHook}
                onFetchFavorites={fetchFavorites}
                onRemoveFavorite={handleRemoveFavorite}
                onTripClick={handleTripClick}
                onSetSelectedTrip={setSelectedTrip}
            />
        </ClientOnly>
    );
};

export default FavoritesPage;