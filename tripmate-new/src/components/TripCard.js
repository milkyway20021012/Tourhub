import React from 'react';

const TripCard = ({ trip, favoriteLoading, onFavorite, onShare, isLineLoggedIn, shareLoading, onClick, isFavorited }) => {
    // 處理收藏點擊
    const handleFavoriteClick = async (e) => {
        e.stopPropagation();
        // 執行原本的收藏邏輯
        await onFavorite(e);
    };

    // 根據排名決定樣式 - 簡化版本
    const getRankStyle = (rank) => {
        if (typeof rank === 'string' && rank === '🔍') {
            return {
                type: 'search',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
                borderColor: '#a855f7',
                glowColor: 'rgba(139, 92, 246, 0.4)',
                icon: '🔍',
                label: '搜尋',
                textShadow: '0 1px 2px rgba(0,0,0,0.3)'
            };
        }

        const numRank = parseInt(rank);
        if (numRank === 1) {
            return {
                type: 'champion',
                background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                boxShadow: '0 6px 20px rgba(251, 191, 36, 0.4)',
                borderColor: '#fcd34d',
                glowColor: 'rgba(251, 191, 36, 0.5)',
                icon: 1,
                label: '第1名',
                textShadow: '0 1px 3px rgba(0,0,0,0.3)'
            };
        } else if (numRank === 2) {
            return {
                type: 'silver',
                background: 'linear-gradient(135deg, #e5e7eb 0%, #9ca3af 100%)',
                boxShadow: '0 6px 20px rgba(156, 163, 175, 0.3)',
                borderColor: '#d1d5db',
                glowColor: 'rgba(156, 163, 175, 0.4)',
                icon: 2,
                label: '第2名',
                textShadow: '0 1px 3px rgba(0,0,0,0.3)'
            };
        } else if (numRank === 3) {
            return {
                type: 'bronze',
                background: 'linear-gradient(135deg, #d97706 0%, #92400e 100%)',
                boxShadow: '0 6px 20px rgba(217, 119, 6, 0.3)',
                borderColor: '#f59e0b',
                glowColor: 'rgba(217, 119, 6, 0.4)',
                icon: 3,
                label: '第3名',
                textShadow: '0 1px 3px rgba(0,0,0,0.3)'
            };
        } else if (numRank <= 10) {
            return {
                type: 'top10',
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                boxShadow: '0 4px 15px rgba(59, 130, 246, 0.25)',
                borderColor: '#60a5fa',
                glowColor: 'rgba(59, 130, 246, 0.3)',
                icon: numRank,
                label: `第${numRank}名`,
                textShadow: '0 1px 2px rgba(0,0,0,0.3)'
            };
        } else {
            return {
                type: 'regular',
                background: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
                boxShadow: '0 3px 10px rgba(100, 116, 139, 0.2)',
                borderColor: '#94a3b8',
                glowColor: 'rgba(100, 116, 139, 0.3)',
                icon: numRank,
                label: `第${numRank}名`,
                textShadow: '0 1px 2px rgba(0,0,0,0.2)'
            };
        }
    };

    const rankStyle = getRankStyle(trip.rank);

    // 檢測是否為手機設備
    const [isMobile, setIsMobile] = React.useState(false);

    React.useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    return (
        <div
            style={{
                background: 'white',
                borderRadius: isMobile ? '12px' : '16px',
                padding: isMobile ? '16px' : '24px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                border: '1px solid #e2e8f0',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                alignItems: isMobile ? 'stretch' : 'flex-start',
                gap: isMobile ? '16px' : '24px',
                position: 'relative',
                overflow: 'hidden'
            }}
            onClick={onClick}
            onMouseEnter={(e) => {
                if (!isMobile) {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
                    e.currentTarget.style.borderColor = '#3b82f6';
                }
            }}
            onMouseLeave={(e) => {
                if (!isMobile) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
                    e.currentTarget.style.borderColor = '#e2e8f0';
                }
            }}
        >
            {/* 手機版頂部區域：排名 + 標題 + 按鈕 */}
            {isMobile && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    marginBottom: '12px'
                }}>
                    {/* 簡化排名徽章 - 手機版 */}
                    <div style={{
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px'
                    }}>
                        {/* 主要排名圓圈 */}
                        <div style={{
                            width: '48px',
                            height: '48px',
                            background: rankStyle.background,
                            border: `2px solid ${rankStyle.borderColor}`,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: '700',
                            fontSize: '18px',
                            boxShadow: rankStyle.boxShadow,
                            textShadow: rankStyle.textShadow
                        }}>
                            {rankStyle.icon}
                        </div>

                        {/* 排名標籤 */}
                        <div style={{
                            background: 'rgba(0, 0, 0, 0.8)',
                            color: 'white',
                            padding: '2px 8px',
                            borderRadius: '10px',
                            fontSize: '10px',
                            fontWeight: '600',
                            whiteSpace: 'nowrap'
                        }}>
                            {rankStyle.label}
                        </div>
                    </div>

                    {/* 手機版標題 */}
                    <h3 style={{
                        margin: '0',
                        fontSize: '18px',
                        fontWeight: '700',
                        color: '#1e293b',
                        lineHeight: '1.3',
                        letterSpacing: '-0.025em',
                        flex: 1,
                        minWidth: 0
                    }}>{trip.title}</h3>

                    {/* 手機版按鈕組 - 水平排列 */}
                    <div style={{
                        display: 'flex',
                        gap: '8px',
                        flexShrink: 0
                    }}>
                        {/* 收藏按鈕 - 手機版 */}
                        <button
                            onClick={handleFavoriteClick}
                            disabled={favoriteLoading}
                            style={{
                                background: isFavorited ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' : '#f3f4f6',
                                border: isFavorited ? '2px solid #d97706' : '2px solid #d1d5db',
                                borderRadius: '12px',
                                width: '44px',
                                height: '44px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: favoriteLoading ? 'not-allowed' : 'pointer',
                                fontSize: '18px',
                                transition: 'all 0.3s ease',
                                opacity: favoriteLoading ? 0.7 : 1,
                                boxShadow: isFavorited ? '0 2px 8px rgba(217, 119, 6, 0.3)' : 'none'
                            }}
                            title={favoriteLoading ? '處理中...' : (isFavorited ? '已收藏' : '加入收藏')}
                        >
                            {favoriteLoading ? '⏳' : (isFavorited ? '⭐' : '☆')}
                        </button>

                        {/* 分享按鈕 - 手機版 */}
                        <button
                            onClick={onShare}
                            disabled={shareLoading}
                            title="分享行程"
                            style={{
                                width: '44px',
                                height: '44px',
                                border: '2px solid #10b981',
                                borderRadius: '12px',
                                cursor: shareLoading ? 'not-allowed' : 'pointer',
                                transition: 'all 0.3s ease',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '16px',
                                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                color: 'white',
                                opacity: shareLoading ? 0.6 : 1
                            }}
                        >
                            {shareLoading ? '⏳' : '📤'}
                        </button>
                    </div>
                </div>
            )}

            {/* 簡化排名徽章 - 桌面版 */}
            {!isMobile && (
                <div style={{
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    flexShrink: 0
                }}>
                    {/* 主要排名圓圈 */}
                    <div style={{
                        width: '64px',
                        height: '64px',
                        background: rankStyle.background,
                        border: `3px solid ${rankStyle.borderColor}`,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: '700',
                        fontSize: '24px',
                        boxShadow: rankStyle.boxShadow,
                        textShadow: rankStyle.textShadow,
                        transition: 'all 0.3s ease'
                    }}>
                        {rankStyle.icon}
                    </div>

                    {/* 排名標籤 */}
                    <div style={{
                        background: 'rgba(0, 0, 0, 0.85)',
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        whiteSpace: 'nowrap'
                    }}>
                        {rankStyle.label}
                    </div>
                </div>
            )}
            {/* 內容區域 */}
            <div style={{ flex: '1', minWidth: '0' }}>
                {/* 桌面版標題與日期 */}
                {!isMobile && (
                    <div style={{ marginBottom: '16px' }}>
                        <h3 style={{
                            margin: '0 0 8px 0',
                            fontSize: '22px',
                            fontWeight: '700',
                            color: '#1e293b',
                            lineHeight: '1.3',
                            letterSpacing: '-0.025em'
                        }}>{trip.title}</h3>

                    </div>
                )}



                {/* 標籤區域 */}
                <div style={{
                    display: 'flex',
                    gap: isMobile ? '6px' : '8px',
                    marginBottom: isMobile ? '12px' : '16px',
                    flexWrap: 'wrap',
                    alignItems: 'center'
                }}>
                    {/* 地區標籤 */}
                    <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
                        color: '#3730a3',
                        padding: isMobile ? '4px 10px' : '6px 14px',
                        borderRadius: isMobile ? '16px' : '20px',
                        fontSize: isMobile ? '11px' : '13px',
                        fontWeight: '600',
                        border: '1px solid #a5b4fc',
                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                    }}>
                        📍 {trip.area}
                    </span>

                    {/* 天數標籤 */}
                    {trip.duration_days && (
                        <span style={{
                            background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                            color: '#475569',
                            padding: isMobile ? '4px 8px' : '6px 12px',
                            borderRadius: '16px',
                            fontSize: isMobile ? '10px' : '12px',
                            fontWeight: '600',
                            border: '1px solid #cbd5e1',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}>
                            ⏰ {trip.duration_days}天
                        </span>
                    )}

                    {/* 季節標籤 */}
                    {trip.season && (
                        <span style={{
                            background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                            color: '#065f46',
                            padding: isMobile ? '4px 8px' : '6px 12px',
                            borderRadius: '16px',
                            fontSize: isMobile ? '10px' : '12px',
                            fontWeight: '600',
                            border: '1px solid #a7f3d0'
                        }}>
                            🌸 {trip.season}
                        </span>
                    )}

                    {/* 行程類型標籤 */}
                    {trip.duration_type && (
                        <span style={{
                            background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                            color: '#92400e',
                            padding: isMobile ? '4px 8px' : '6px 12px',
                            borderRadius: '16px',
                            fontSize: isMobile ? '10px' : '12px',
                            fontWeight: '600',
                            border: '1px solid #fcd34d'
                        }}>
                            🎯 {trip.duration_type}
                        </span>
                    )}

                    {/* 預算標籤 - 手機版可能隱藏或簡化 */}
                    {trip.budget && (
                        <span style={{
                            background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                            color: '#92400e',
                            padding: isMobile ? '4px 8px' : '6px 12px',
                            borderRadius: '16px',
                            fontSize: isMobile ? '10px' : '12px',
                            fontWeight: '600',
                            border: '1px solid #fcd34d'
                        }}>
                            💰 {isMobile ? `${Math.round(trip.budget / 1000)}K` : `NT$${trip.budget.toLocaleString()}`}
                        </span>
                    )}
                </div>

                {/* 統計數據區域 */}
                <div style={{
                    display: 'flex',
                    gap: isMobile ? '8px' : '12px',
                    marginBottom: isMobile ? '12px' : '16px',
                    flexWrap: 'wrap'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: isMobile ? '4px' : '6px',
                        background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                        color: '#dc2626',
                        padding: isMobile ? '6px 10px' : '8px 12px',
                        borderRadius: isMobile ? '10px' : '12px',
                        fontSize: isMobile ? '11px' : '13px',
                        fontWeight: '600',
                        border: '1px solid #fecaca',
                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                    }}>
                        ❤️ <span>{trip.favorite_count || 0}</span>
                    </div>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: isMobile ? '4px' : '6px',
                        background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                        color: '#16a34a',
                        padding: isMobile ? '6px 10px' : '8px 12px',
                        borderRadius: isMobile ? '10px' : '12px',
                        fontSize: isMobile ? '11px' : '13px',
                        fontWeight: '600',
                        border: '1px solid #bbf7d0',
                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                    }}>
                        📤 <span>{trip.share_count || 0}</span>
                    </div>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: isMobile ? '4px' : '6px',
                        background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                        color: '#2563eb',
                        padding: isMobile ? '6px 10px' : '8px 12px',
                        borderRadius: isMobile ? '10px' : '12px',
                        fontSize: isMobile ? '11px' : '13px',
                        fontWeight: '600',
                        border: '1px solid #93c5fd',
                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                    }}>
                        👁️ <span>{trip.view_count || 0}</span>
                    </div>
                </div>

                {/* 描述 */}
                {trip.description && (
                    <p style={{
                        margin: '0',
                        color: '#64748b',
                        fontSize: isMobile ? '13px' : '14px',
                        lineHeight: '1.6',
                        letterSpacing: '0.01em'
                    }}>
                        {trip.description.length > (isMobile ? 80 : 120) ?
                            trip.description.substring(0, isMobile ? 80 : 120) + '...' :
                            trip.description}
                    </p>
                )}
            </div>
            {/* 桌面版右側按鈕區域 */}
            {!isMobile && (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    alignItems: 'center',
                    flexShrink: '0',
                    minWidth: '80px',
                    paddingLeft: '16px'
                }}>
                    {/* 收藏按鈕 */}
                    <button
                        onClick={handleFavoriteClick}
                        disabled={favoriteLoading}
                        style={{
                            background: isFavorited ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' : '#f3f4f6',
                            border: isFavorited ? '2px solid #d97706' : '2px solid #d1d5db',
                            borderRadius: '16px',
                            width: '56px',
                            height: '56px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: favoriteLoading ? 'not-allowed' : 'pointer',
                            fontSize: '20px',
                            transition: 'all 0.3s ease',
                            opacity: favoriteLoading ? 0.7 : 1,
                            boxShadow: isFavorited ? '0 4px 12px rgba(217, 119, 6, 0.3)' : 'none',
                            transform: 'scale(1)',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                        title={favoriteLoading ? '處理中...' : (isFavorited ? '已收藏' : '加入收藏')}
                        onMouseEnter={(e) => {
                            if (!favoriteLoading) {
                                e.currentTarget.style.transform = 'scale(1.1)';
                                e.currentTarget.style.boxShadow = isFavorited ? '0 6px 16px rgba(217, 119, 6, 0.4)' : '0 2px 6px rgba(0,0,0,0.05)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!favoriteLoading) {
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.boxShadow = isFavorited ? '0 4px 12px rgba(217, 119, 6, 0.3)' : 'none';
                            }
                        }}
                    >
                        <div style={{ fontSize: '20px', marginBottom: '2px' }}>
                            {favoriteLoading ? '⏳' : (isFavorited ? '⭐' : '☆')}
                        </div>
                        <div style={{
                            fontSize: '10px',
                            fontWeight: '600',
                            color: isFavorited ? '#d97706' : '#6b7280',
                            letterSpacing: '0.5px'
                        }}>
                            {favoriteLoading ? '...' : (isFavorited ? '已收藏' : '收藏')}
                        </div>
                    </button>

                    {/* 分享按鈕 */}
                    <button
                        onClick={onShare}
                        disabled={shareLoading}
                        title="分享行程"
                        style={{
                            width: '56px',
                            height: '56px',
                            border: '2px solid #10b981',
                            borderRadius: '16px',
                            cursor: shareLoading ? 'not-allowed' : 'pointer',
                            transition: 'all 0.3s ease',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '18px',
                            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            color: 'white',
                            opacity: shareLoading ? 0.6 : 1,
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                        onMouseEnter={(e) => {
                            if (!shareLoading) {
                                e.currentTarget.style.transform = 'scale(1.1)';
                                e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.4)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!shareLoading) {
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                            }
                        }}
                    >
                        <div style={{ fontSize: '18px', marginBottom: '2px' }}>
                            {shareLoading ? '⏳' : '📤'}
                        </div>
                        <div style={{
                            fontSize: '10px',
                            fontWeight: '600',
                            color: 'white',
                            letterSpacing: '0.5px'
                        }}>
                            {shareLoading ? '...' : '分享'}
                        </div>
                    </button>
                </div>
            )}



            {/* CSS樣式 */}
            <style jsx>{`

                /* 手機端優化 */
                @media (max-width: 768px) {
                    .mobile-optimized {
                        font-size: 14px !important;
                    }

                    .mobile-button {
                        width: 40px !important;
                        height: 40px !important;
                        font-size: 16px !important;
                    }

                    .mobile-tag {
                        font-size: 10px !important;
                        padding: 3px 6px !important;
                    }
                }

                /* 觸控設備優化 */
                @media (hover: none) and (pointer: coarse) {
                    button {
                        -webkit-tap-highlight-color: transparent;
                    }
                }
            `}</style>
        </div>
    );
};

// 自定義比較函數，確保必要時重新渲染
const areEqual = (prevProps, nextProps) => {
    // 如果載入狀態發生變化，強制重新渲染
    if (prevProps.favoriteLoading !== nextProps.favoriteLoading) {
        return false;
    }

    // 如果分享載入狀態發生變化，強制重新渲染
    if (prevProps.shareLoading !== nextProps.shareLoading) {
        return false;
    }

    // 如果登入狀態發生變化，強制重新渲染
    if (prevProps.isLineLoggedIn !== nextProps.isLineLoggedIn) {
        return false;
    }

    // 檢查 trip 對象的關鍵屬性
    if (prevProps.trip.trip_id !== nextProps.trip.trip_id ||
        prevProps.trip.title !== nextProps.trip.title ||
        prevProps.trip.favorite_count !== nextProps.trip.favorite_count ||
        prevProps.trip.share_count !== nextProps.trip.share_count ||
        prevProps.trip.view_count !== nextProps.trip.view_count) {
        return false;
    }

    // 其他情況下認為相等，不重新渲染
    return true;
};

export default React.memo(TripCard, areEqual);