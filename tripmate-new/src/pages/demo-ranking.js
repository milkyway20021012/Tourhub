import React from 'react';
import TripCard from '../components/TripCard';

const DemoRanking = () => {
    // 模擬排行榜數據
    const mockTrips = [
        {
            trip_id: 1,
            rank: 1,
            title: "🏆 台北101跨年煙火之旅",
            description: "體驗台北最盛大的跨年慶典，欣賞世界級煙火秀，感受城市的熱情與活力。包含高級飯店住宿、美食饗宴和專業導遊服務。",
            area: "台北",
            start_date: "2024-12-30",
            end_date: "2025-01-02",
            duration_days: 3,
            season: "冬季",
            duration_type: "短期旅行",
            budget: 15000,
            favorite_count: 1250,
            share_count: 890,
            view_count: 5420
        },
        {
            trip_id: 2,
            rank: 2,
            title: "🥈 花蓮太魯閣國家公園深度遊",
            description: "探索台灣最美的峽谷風光，體驗原住民文化，享受溫泉放鬆。專業生態導覽，深入了解台灣自然之美。",
            area: "花蓮",
            start_date: "2024-11-15",
            end_date: "2024-11-18",
            duration_days: 4,
            season: "秋季",
            duration_type: "短期旅行",
            budget: 12000,
            favorite_count: 980,
            share_count: 720,
            view_count: 4200
        },
        {
            trip_id: 3,
            rank: 3,
            title: "🥉 墾丁海洋風情三日遊",
            description: "南台灣熱帶風情，享受陽光沙灘，體驗水上活動，品嚐新鮮海鮮。完美的度假勝地，讓您忘卻都市煩憂。",
            area: "屏東",
            start_date: "2024-10-20",
            end_date: "2024-10-22",
            duration_days: 3,
            season: "秋季",
            duration_type: "週末遊",
            budget: 8500,
            favorite_count: 750,
            share_count: 650,
            view_count: 3800
        },
        {
            trip_id: 4,
            rank: 4,
            title: "阿里山日出雲海之旅",
            description: "追尋台灣最美日出，漫步千年神木群，體驗高山鐵路的懷舊風情。季節限定的櫻花美景，不容錯過。",
            area: "嘉義",
            start_date: "2024-12-01",
            end_date: "2024-12-03",
            duration_days: 3,
            season: "冬季",
            duration_type: "短期旅行",
            budget: 9800,
            favorite_count: 620,
            share_count: 480,
            view_count: 2900
        },
        {
            trip_id: 5,
            rank: 5,
            title: "日月潭環湖單車之旅",
            description: "騎行台灣最美湖泊，享受清新空氣與湖光山色。包含纜車體驗、原住民文化體驗和特色美食品嚐。",
            area: "南投",
            start_date: "2024-11-08",
            end_date: "2024-11-10",
            duration_days: 3,
            season: "秋季",
            duration_type: "短期旅行",
            budget: 7200,
            favorite_count: 520,
            share_count: 380,
            view_count: 2400
        }
    ];

    const handleFavorite = (tripId, event) => {
        event.stopPropagation();
        console.log('收藏行程:', tripId);
    };

    const handleShare = (trip, event) => {
        event.stopPropagation();
        console.log('分享行程:', trip.title);
    };

    const handleTripClick = (tripId) => {
        console.log('查看行程詳情:', tripId);
    };

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
        <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: isMobile ? '12px' : '20px',
            minHeight: '100vh',
            background: '#f8fafc'
        }}>
            {/* 標題區域 */}
            <div style={{
                textAlign: 'center',
                marginBottom: isMobile ? '24px' : '32px',
                padding: isMobile ? '24px 16px' : '40px 32px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: isMobile ? '16px' : '20px',
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}>
                <div style={{
                    position: 'absolute',
                    top: '-50%',
                    left: '-50%',
                    width: '200%',
                    height: '200%',
                    background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
                    animation: 'float 6s ease-in-out infinite'
                }} />

                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{
                        fontSize: isMobile ? '36px' : '48px',
                        marginBottom: isMobile ? '12px' : '16px',
                        display: 'inline-block',
                        animation: 'bounce 2s infinite'
                    }}>
                        🏆
                    </div>
                    <h1 style={{
                        margin: '0 0 12px 0',
                        fontSize: isMobile ? '24px' : '36px',
                        fontWeight: '800',
                        letterSpacing: '-0.025em',
                        textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        lineHeight: '1.2'
                    }}>
                        現代化排行榜設計演示
                    </h1>
                    <p style={{
                        margin: isMobile ? '0 0 20px 0' : '0 0 32px 0',
                        fontSize: isMobile ? '14px' : '16px',
                        opacity: '0.9',
                        fontWeight: '500',
                        letterSpacing: '0.025em',
                        lineHeight: '1.4'
                    }}>
                        全新的排行榜UI設計，提供更好的視覺體驗和互動效果
                    </p>
                </div>
            </div>

            {/* 排行榜列表 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '16px' : '20px' }}>
                {mockTrips.map((trip, index) => (
                    <div key={trip.trip_id} className="ranking-card">
                        <TripCard
                            trip={trip}
                            isFavorited={false}
                            favoriteLoading={false}
                            onFavorite={(e) => handleFavorite(trip.trip_id, e)}
                            onShare={(e) => handleShare(trip, e)}
                            isLineLoggedIn={() => true}
                            shareLoading={false}
                            onClick={() => handleTripClick(trip.trip_id)}
                        />
                    </div>
                ))}
            </div>

            {/* 添加CSS動畫 */}
            <style jsx>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-10px) rotate(180deg); }
                }
                
                @keyframes bounce {
                    0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
                    40% { transform: translateY(-10px); }
                    60% { transform: translateY(-5px); }
                }
                
                @keyframes fadeInUp {
                    from { 
                        opacity: 0; 
                        transform: translateY(30px); 
                    }
                    to { 
                        opacity: 1; 
                        transform: translateY(0); 
                    }
                }
                
                .ranking-card {
                    animation: fadeInUp 0.6s ease-out;
                }
                
                .ranking-card:nth-child(1) { animation-delay: 0.1s; }
                .ranking-card:nth-child(2) { animation-delay: 0.2s; }
                .ranking-card:nth-child(3) { animation-delay: 0.3s; }
                .ranking-card:nth-child(4) { animation-delay: 0.4s; }
                .ranking-card:nth-child(5) { animation-delay: 0.5s; }
            `}</style>
        </div>
    );
};

export default DemoRanking;
