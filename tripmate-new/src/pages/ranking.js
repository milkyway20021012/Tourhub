import React, { useState } from 'react';
import TripRanking from '../components/TripRanking';
import TripRankingEnhanced from '../components/TripRankingEnhanced';

const RankingPage = () => {
    const [useEnhancedVersion, setUseEnhancedVersion] = useState(true);

    return (
        <div>
            {/* 版本切換器 */}
            <div style={{
                position: 'fixed',
                top: '20px',
                right: '20px',
                zIndex: 999,
                background: 'white',
                padding: '8px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
                <button
                    onClick={() => setUseEnhancedVersion(!useEnhancedVersion)}
                    style={{
                        background: useEnhancedVersion ? '#e53e3e' : '#3182ce',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px'
                    }}
                >
                    {useEnhancedVersion ? '📊 基本版' : '🚀 增強版'}
                </button>
            </div>

            {/* 渲染選擇的版本 */}
            {useEnhancedVersion ? <TripRankingEnhanced /> : <TripRanking />}
        </div>
    );
};

export default RankingPage;