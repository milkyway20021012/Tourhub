import React from 'react';

const TripCard = ({ trip, isFavorited, favoriteLoading, onFavorite, onShare, isLineLoggedIn, shareLoading, onClick }) => {
    return (
        <div
            style={{
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
            }}
            onClick={onClick}
        >
            {/* 排名/圖示 */}
            <div style={{
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
            }}>
                {trip.rank || '🏷️'}
            </div>
            {/* 內容區域 */}
            <div style={{ flex: '1', minWidth: '0' }}>
                <h3 style={{
                    margin: '0 0 12px 0',
                    fontSize: '20px',
                    fontWeight: '600',
                    color: '#1e293b',
                    lineHeight: '1.3'
                }}>{trip.title}</h3>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '12px', flexWrap: 'wrap' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', background: '#e0e7ff', color: '#3730a3', padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '500' }}>{trip.area}</span>
                    <span style={{ color: '#64748b', fontSize: '14px', fontWeight: '500' }}>{trip.start_date} - {trip.end_date}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                    {trip.duration_days && <span style={{ background: '#f1f5f9', color: '#475569', padding: '4px 10px', borderRadius: '16px', fontSize: '12px', fontWeight: '500', border: '1px solid #e2e8f0' }}>{trip.duration_days}天</span>}
                    {trip.season && <span style={{ background: '#f1f5f9', color: '#475569', padding: '4px 10px', borderRadius: '16px', fontSize: '12px', fontWeight: '500', border: '1px solid #e2e8f0' }}>{trip.season}</span>}
                    {trip.duration_type && <span style={{ background: '#f1f5f9', color: '#475569', padding: '4px 10px', borderRadius: '16px', fontSize: '12px', fontWeight: '500', border: '1px solid #e2e8f0' }}>{trip.duration_type}</span>}
                    {trip.favorite_count > 0 && <span style={{ background: '#fee2e2', color: '#991b1b', padding: '4px 10px', borderRadius: '16px', fontSize: '12px', fontWeight: '500', border: '1px solid #fecaca' }}>❤️ {trip.favorite_count}</span>}
                    {trip.share_count > 0 && <span style={{ background: '#ecfdf5', color: '#065f46', padding: '4px 10px', borderRadius: '16px', fontSize: '12px', fontWeight: '500', border: '1px solid #bbf7d0' }}>📤 {trip.share_count}</span>}
                    {trip.view_count > 0 && <span style={{ background: '#eff6ff', color: '#1e40af', padding: '4px 10px', borderRadius: '16px', fontSize: '12px', fontWeight: '500', border: '1px solid #bfdbfe' }}>👀 {trip.view_count}</span>}
                </div>
                {trip.description && <p style={{ margin: '0', color: '#64748b', fontSize: '14px', lineHeight: '1.5' }}>{trip.description.length > 100 ? trip.description.substring(0, 100) + '...' : trip.description}</p>}
            </div>
            {/* 右側按鈕區域 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center', flexShrink: '0', minWidth: '60px' }}>
                <button
                    onClick={onFavorite}
                    disabled={favoriteLoading}
                    style={{
                        background: isLineLoggedIn ? (isFavorited ? 'rgba(239, 68, 68, 0.1)' : 'rgba(156, 163, 175, 0.1)') : 'rgba(59, 130, 246, 0.1)',
                        border: isLineLoggedIn ? `1px solid ${isFavorited ? '#f87171' : '#d1d5db'}` : '1px solid #93c5fd',
                        borderRadius: '50%',
                        width: '44px',
                        height: '44px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: favoriteLoading ? 'not-allowed' : 'pointer',
                        fontSize: '18px',
                        transition: 'all 0.2s ease',
                        opacity: favoriteLoading ? 0.7 : 1
                    }}
                    title={!isLineLoggedIn ? '點擊登入 LINE 使用收藏功能' : favoriteLoading ? '處理中...' : (isFavorited ? '取消收藏' : '加入收藏')}
                >
                    {favoriteLoading ? '⏳' : !isLineLoggedIn ? '💙' : (isFavorited ? '❤️' : '🤍')}
                </button>
                <button
                    onClick={onShare}
                    disabled={shareLoading}
                    title="分享行程"
                    style={{
                        width: '44px',
                        height: '44px',
                        border: 'none',
                        borderRadius: '50%',
                        cursor: shareLoading ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: 'white',
                        opacity: shareLoading ? 0.6 : 1
                    }}
                >
                    {shareLoading ? '⏳' : '📤'}
                </button>
            </div>
        </div>
    );
};

export default React.memo(TripCard); 