import React from 'react';

const TripCard = ({ trip, isFavorited, favoriteLoading, onFavorite, onShare, isLineLoggedIn, shareLoading, onClick }) => {
    // 收藏狀態提示
    const [favoriteToast, setFavoriteToast] = React.useState(null);

    // 處理收藏點擊
    const handleFavoriteClick = async (e) => {
        e.stopPropagation();

        // 記錄點擊前的狀態
        const wasCurrentlyFavorited = isFavorited;

        // 執行原本的收藏邏輯
        await onFavorite(e);

        // 顯示提示動畫（基於點擊前的狀態）
        setFavoriteToast({
            type: wasCurrentlyFavorited ? 'removed' : 'added',
            message: wasCurrentlyFavorited ? '已取消收藏' : '已加入收藏',
            icon: wasCurrentlyFavorited ? '💔' : '❤️'
        });

        // 3秒後隱藏提示
        setTimeout(() => {
            setFavoriteToast(null);
        }, 3000);
    };

    // 根據排名決定樣式 - 現代化設計優化版
    const getRankStyle = (rank) => {
        if (typeof rank === 'string' && rank === '🔍') {
            return {
                type: 'search',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 50%, #6d28d9 100%)',
                boxShadow: '0 12px 40px rgba(139, 92, 246, 0.5), 0 4px 12px rgba(139, 92, 246, 0.3)',
                borderColor: '#a855f7',
                glowColor: 'rgba(139, 92, 246, 0.8)',
                icon: '🔍',
                label: '搜尋結果',
                textShadow: '0 2px 4px rgba(0,0,0,0.3)'
            };
        }

        const numRank = parseInt(rank);
        if (numRank === 1) {
            return {
                type: 'champion',
                background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)',
                boxShadow: '0 16px 50px rgba(251, 191, 36, 0.6), 0 8px 20px rgba(251, 191, 36, 0.4)',
                borderColor: '#fcd34d',
                glowColor: 'rgba(251, 191, 36, 1)',
                icon: '👑',
                label: '🏆 冠軍',
                special: true,
                textShadow: '0 2px 6px rgba(0,0,0,0.4)',
                ringColor: '#fbbf24'
            };
        } else if (numRank === 2) {
            return {
                type: 'silver',
                background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)',
                boxShadow: '0 14px 45px rgba(148, 163, 184, 0.5), 0 6px 18px rgba(148, 163, 184, 0.3)',
                borderColor: '#e2e8f0',
                glowColor: 'rgba(148, 163, 184, 0.9)',
                icon: '🥈',
                label: '🥈 亞軍',
                textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                ringColor: '#94a3b8'
            };
        } else if (numRank === 3) {
            return {
                type: 'bronze',
                background: 'linear-gradient(135deg, #fed7aa 0%, #fdba74 50%, #fb923c 100%)',
                boxShadow: '0 14px 45px rgba(251, 146, 60, 0.5), 0 6px 18px rgba(251, 146, 60, 0.3)',
                borderColor: '#fdba74',
                glowColor: 'rgba(251, 146, 60, 0.9)',
                icon: '🥉',
                label: '🥉 季軍',
                textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                ringColor: '#fb923c'
            };
        } else if (numRank <= 5) {
            return {
                type: 'top5',
                background: 'linear-gradient(135deg, #ddd6fe 0%, #c4b5fd 50%, #a78bfa 100%)',
                boxShadow: '0 12px 35px rgba(167, 139, 250, 0.4), 0 5px 15px rgba(167, 139, 250, 0.25)',
                borderColor: '#c4b5fd',
                glowColor: 'rgba(167, 139, 250, 0.7)',
                icon: '🌟',
                label: `✨ TOP ${numRank}`,
                textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                ringColor: '#a78bfa'
            };
        } else if (numRank <= 10) {
            return {
                type: 'top10',
                background: 'linear-gradient(135deg, #dbeafe 0%, #93c5fd 50%, #60a5fa 100%)',
                boxShadow: '0 10px 30px rgba(96, 165, 250, 0.35), 0 4px 12px rgba(96, 165, 250, 0.2)',
                borderColor: '#93c5fd',
                glowColor: 'rgba(96, 165, 250, 0.6)',
                icon: '⭐',
                label: `⭐ TOP ${numRank}`,
                textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                ringColor: '#60a5fa'
            };
        } else if (numRank <= 20) {
            return {
                type: 'top20',
                background: 'linear-gradient(135deg, #d1fae5 0%, #86efac 50%, #4ade80 100%)',
                boxShadow: '0 8px 25px rgba(74, 222, 128, 0.3), 0 3px 10px rgba(74, 222, 128, 0.15)',
                borderColor: '#86efac',
                glowColor: 'rgba(74, 222, 128, 0.5)',
                icon: numRank,
                label: `🎯 第${numRank}名`,
                textShadow: '0 1px 3px rgba(0,0,0,0.2)',
                ringColor: '#4ade80'
            };
        } else {
            return {
                type: 'regular',
                background: 'linear-gradient(135deg, #f1f5f9 0%, #cbd5e1 50%, #94a3b8 100%)',
                boxShadow: '0 6px 20px rgba(100, 116, 139, 0.25), 0 2px 8px rgba(100, 116, 139, 0.15)',
                borderColor: '#cbd5e1',
                glowColor: 'rgba(100, 116, 139, 0.4)',
                icon: numRank,
                label: `第${numRank}名`,
                textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                ringColor: '#94a3b8'
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
                    {/* 現代化排名徽章 - 手機版優化 */}
                    <div style={{
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px'
                    }}>
                        {/* 主要排名圓圈 */}
                        <div style={{
                            width: '56px',
                            height: '56px',
                            background: rankStyle.background,
                            border: `3px solid ${rankStyle.borderColor}`,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: '800',
                            fontSize: typeof rankStyle.icon === 'number' ? '16px' : '20px',
                            boxShadow: rankStyle.boxShadow,
                            position: 'relative',
                            zIndex: 2,
                            animation: rankStyle.special ? 'championPulse 2s ease-in-out infinite' : 'none',
                            textShadow: rankStyle.textShadow || '0 2px 4px rgba(0,0,0,0.3)'
                        }}>
                            {rankStyle.icon}

                            {/* 外環裝飾 */}
                            {rankStyle.ringColor && (
                                <div style={{
                                    position: 'absolute',
                                    top: '-6px',
                                    left: '-6px',
                                    right: '-6px',
                                    bottom: '-6px',
                                    borderRadius: '50%',
                                    border: `2px solid ${rankStyle.ringColor}`,
                                    opacity: 0.3,
                                    zIndex: -2,
                                    animation: 'ringPulse 3s ease-in-out infinite'
                                }} />
                            )}

                            {/* 發光效果 */}
                            <div style={{
                                position: 'absolute',
                                top: '-5px',
                                left: '-5px',
                                right: '-5px',
                                bottom: '-5px',
                                borderRadius: '50%',
                                background: rankStyle.glowColor,
                                opacity: 0.5,
                                zIndex: -1,
                                animation: 'breathe 3s ease-in-out infinite'
                            }} />

                            {/* 內部光暈 */}
                            <div style={{
                                position: 'absolute',
                                top: '8px',
                                left: '8px',
                                right: '8px',
                                bottom: '8px',
                                borderRadius: '50%',
                                background: 'rgba(255, 255, 255, 0.25)',
                                zIndex: -1
                            }} />

                            {/* 特殊效果 - 閃光 */}
                            {rankStyle.special && (
                                <div style={{
                                    position: 'absolute',
                                    top: '10px',
                                    left: '10px',
                                    width: '6px',
                                    height: '6px',
                                    borderRadius: '50%',
                                    background: 'rgba(255, 255, 255, 0.9)',
                                    animation: 'sparkle 2s ease-in-out infinite'
                                }} />
                            )}
                        </div>

                        {/* 排名標籤 - 優化版 */}
                        <div style={{
                            background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.95) 100%)',
                            color: 'white',
                            padding: '3px 10px',
                            borderRadius: '14px',
                            fontSize: '10px',
                            fontWeight: '700',
                            whiteSpace: 'nowrap',
                            backdropFilter: 'blur(12px)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                            textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                            letterSpacing: '0.5px'
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
                                background: isLineLoggedIn
                                    ? (isFavorited
                                        ? 'linear-gradient(135deg, #fecaca 0%, #fca5a5 100%)'
                                        : 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)'
                                    )
                                    : 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                                border: isLineLoggedIn
                                    ? `2px solid ${isFavorited ? '#ef4444' : '#9ca3af'}`
                                    : '2px solid #3b82f6',
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
                                boxShadow: isFavorited
                                    ? '0 2px 8px rgba(239, 68, 68, 0.3)'
                                    : '0 1px 4px rgba(0, 0, 0, 0.1)'
                            }}
                            title={!isLineLoggedIn ? '點擊登入 LINE 使用收藏功能' : favoriteLoading ? '處理中...' : (isFavorited ? '取消收藏' : '加入收藏')}
                        >
                            {favoriteLoading ? '⏳' : !isLineLoggedIn ? '💙' : (isFavorited ? '❤️' : '🤍')}
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

            {/* 現代化排名徽章 - 桌面版優化 */}
            {!isMobile && (
                <div style={{
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '10px',
                    flexShrink: 0
                }}>
                    {/* 主要排名圓圈 */}
                    <div style={{
                        width: '80px',
                        height: '80px',
                        background: rankStyle.background,
                        border: `4px solid ${rankStyle.borderColor}`,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: '800',
                        fontSize: typeof rankStyle.icon === 'number' ? '20px' : '28px',
                        boxShadow: rankStyle.boxShadow,
                        position: 'relative',
                        zIndex: 2,
                        animation: rankStyle.special ? 'championPulse 2s ease-in-out infinite' : 'none',
                        transition: 'all 0.3s ease',
                        textShadow: rankStyle.textShadow || '0 2px 4px rgba(0,0,0,0.3)'
                    }}>
                        {rankStyle.icon}

                        {/* 外環裝飾 */}
                        {rankStyle.ringColor && (
                            <div style={{
                                position: 'absolute',
                                top: '-8px',
                                left: '-8px',
                                right: '-8px',
                                bottom: '-8px',
                                borderRadius: '50%',
                                border: `3px solid ${rankStyle.ringColor}`,
                                opacity: 0.4,
                                zIndex: -2,
                                animation: 'ringPulse 3s ease-in-out infinite'
                            }} />
                        )}

                        {/* 外部發光效果 */}
                        <div style={{
                            position: 'absolute',
                            top: '-8px',
                            left: '-8px',
                            right: '-8px',
                            bottom: '-8px',
                            borderRadius: '50%',
                            background: rankStyle.glowColor,
                            opacity: 0.6,
                            zIndex: -1,
                            animation: 'breathe 3s ease-in-out infinite'
                        }} />

                        {/* 內部光暈 */}
                        <div style={{
                            position: 'absolute',
                            top: '10px',
                            left: '10px',
                            right: '10px',
                            bottom: '10px',
                            borderRadius: '50%',
                            background: 'rgba(255, 255, 255, 0.3)',
                            zIndex: -1
                        }} />

                        {/* 特殊效果 - 閃光 */}
                        {rankStyle.special && (
                            <>
                                <div style={{
                                    position: 'absolute',
                                    top: '14px',
                                    left: '14px',
                                    width: '10px',
                                    height: '10px',
                                    borderRadius: '50%',
                                    background: 'rgba(255, 255, 255, 0.9)',
                                    animation: 'sparkle 2s ease-in-out infinite'
                                }} />
                                <div style={{
                                    position: 'absolute',
                                    top: '20px',
                                    right: '16px',
                                    width: '6px',
                                    height: '6px',
                                    borderRadius: '50%',
                                    background: 'rgba(255, 255, 255, 0.7)',
                                    animation: 'sparkle 2s ease-in-out infinite 0.5s'
                                }} />
                            </>
                        )}
                    </div>

                    {/* 排名標籤 - 優化版 */}
                    <div style={{
                        background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0.95) 100%)',
                        color: 'white',
                        padding: '6px 16px',
                        borderRadius: '20px',
                        fontSize: '13px',
                        fontWeight: '700',
                        whiteSpace: 'nowrap',
                        backdropFilter: 'blur(15px)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        boxShadow: '0 6px 20px rgba(0, 0, 0, 0.4), 0 2px 6px rgba(0, 0, 0, 0.2)',
                        textShadow: '0 1px 3px rgba(0,0,0,0.6)',
                        letterSpacing: '0.5px',
                        minWidth: '80px',
                        textAlign: 'center'
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
                            background: isLineLoggedIn
                                ? (isFavorited
                                    ? 'linear-gradient(135deg, #fecaca 0%, #fca5a5 100%)'
                                    : 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)'
                                )
                                : 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                            border: isLineLoggedIn
                                ? `2px solid ${isFavorited ? '#ef4444' : '#9ca3af'}`
                                : '2px solid #3b82f6',
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
                            boxShadow: isFavorited
                                ? '0 4px 12px rgba(239, 68, 68, 0.3)'
                                : '0 2px 8px rgba(0, 0, 0, 0.1)',
                            transform: isFavorited ? 'scale(1.05)' : 'scale(1)',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                        title={!isLineLoggedIn ? '點擊登入 LINE 使用收藏功能' : favoriteLoading ? '處理中...' : (isFavorited ? '取消收藏' : '加入收藏')}
                        onMouseEnter={(e) => {
                            if (!favoriteLoading) {
                                e.currentTarget.style.transform = 'scale(1.1)';
                                e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.15)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!favoriteLoading) {
                                e.currentTarget.style.transform = isFavorited ? 'scale(1.05)' : 'scale(1)';
                                e.currentTarget.style.boxShadow = isFavorited
                                    ? '0 4px 12px rgba(239, 68, 68, 0.3)'
                                    : '0 2px 8px rgba(0, 0, 0, 0.1)';
                            }
                        }}
                    >
                        <div style={{ fontSize: '20px', marginBottom: '2px' }}>
                            {favoriteLoading ? '⏳' : !isLineLoggedIn ? '💙' : (isFavorited ? '❤️' : '🤍')}
                        </div>
                        <div style={{
                            fontSize: '10px',
                            fontWeight: '600',
                            color: isLineLoggedIn
                                ? (isFavorited ? '#dc2626' : '#6b7280')
                                : '#2563eb',
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

            {/* 收藏提示動畫 */}
            {favoriteToast && (
                <div style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 9999,
                    background: favoriteToast.type === 'added'
                        ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                        : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    color: 'white',
                    padding: '20px 32px',
                    borderRadius: '16px',
                    boxShadow: favoriteToast.type === 'added'
                        ? '0 20px 25px -5px rgba(16, 185, 129, 0.4), 0 10px 10px -5px rgba(16, 185, 129, 0.2)'
                        : '0 20px 25px -5px rgba(239, 68, 68, 0.4), 0 10px 10px -5px rgba(239, 68, 68, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontSize: '16px',
                    fontWeight: '600',
                    animation: 'favoriteToastIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                    backdropFilter: 'blur(10px)',
                    border: `2px solid ${favoriteToast.type === 'added' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                    minWidth: '200px',
                    justifyContent: 'center'
                }}>
                    <div style={{
                        fontSize: '24px',
                        animation: 'heartBeat 0.8s ease-in-out'
                    }}>
                        {favoriteToast.icon}
                    </div>
                    <span>{favoriteToast.message}</span>

                    {/* 進度條 */}
                    <div style={{
                        position: 'absolute',
                        bottom: '0',
                        left: '0',
                        height: '3px',
                        background: 'rgba(255, 255, 255, 0.3)',
                        borderRadius: '0 0 16px 16px',
                        width: '100%',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            height: '100%',
                            background: 'rgba(255, 255, 255, 0.8)',
                            animation: 'progressBar 3s linear',
                            borderRadius: '0 0 16px 16px'
                        }} />
                    </div>
                </div>
            )}

            {/* 添加CSS動畫 - 優化版 */}
            <style jsx>{`
                @keyframes championPulse {
                    0%, 100% {
                        transform: scale(1);
                        filter: brightness(1) saturate(1);
                    }
                    50% {
                        transform: scale(1.05);
                        filter: brightness(1.15) saturate(1.1);
                    }
                }

                @keyframes breathe {
                    0%, 100% {
                        opacity: 0.5;
                        transform: scale(1);
                    }
                    50% {
                        opacity: 0.8;
                        transform: scale(1.15);
                    }
                }

                @keyframes sparkle {
                    0%, 100% {
                        opacity: 0;
                        transform: scale(0.3) rotate(0deg);
                    }
                    25% {
                        opacity: 0.8;
                        transform: scale(1.2) rotate(90deg);
                    }
                    50% {
                        opacity: 1;
                        transform: scale(1) rotate(180deg);
                    }
                    75% {
                        opacity: 0.8;
                        transform: scale(1.2) rotate(270deg);
                    }
                }

                @keyframes ringPulse {
                    0%, 100% {
                        opacity: 0.3;
                        transform: scale(1);
                    }
                    50% {
                        opacity: 0.6;
                        transform: scale(1.1);
                    }
                }

                @keyframes glow {
                    0% { opacity: 0.4; }
                    100% { opacity: 0.8; }
                }

                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }

                @keyframes floatUp {
                    0% {
                        opacity: 0;
                        transform: translateY(20px) scale(0.8);
                    }
                    50% {
                        opacity: 1;
                        transform: translateY(-5px) scale(1.05);
                    }
                    100% {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }

                .rank-shimmer::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent);
                    animation: shimmer 3s infinite;
                }

                /* 收藏提示動畫 */
                @keyframes favoriteToastIn {
                    0% {
                        opacity: 0;
                        transform: translate(-50%, -50%) scale(0.3) rotate(-10deg);
                    }
                    50% {
                        opacity: 1;
                        transform: translate(-50%, -50%) scale(1.1) rotate(5deg);
                    }
                    100% {
                        opacity: 1;
                        transform: translate(-50%, -50%) scale(1) rotate(0deg);
                    }
                }

                @keyframes heartBeat {
                    0% { transform: scale(1); }
                    25% { transform: scale(1.3); }
                    50% { transform: scale(1); }
                    75% { transform: scale(1.2); }
                    100% { transform: scale(1); }
                }

                @keyframes progressBar {
                    0% { width: 100%; }
                    100% { width: 0%; }
                }

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

export default React.memo(TripCard);