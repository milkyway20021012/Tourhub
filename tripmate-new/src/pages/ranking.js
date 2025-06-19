import React from 'react';
import TripRankingEnhanced from '../components/TripRankingEnhanced';

const RankingPage = () => {
    return (
        <div>
            {/* 直接顯示增強版，不再有版本切換 */}
            <TripRankingEnhanced />
        </div>
    );
};

export default RankingPage;