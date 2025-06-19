import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './TripRanking.module.css';

const TripStatistics = () => {
    const [statistics, setStatistics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedView, setSelectedView] = useState('overview');

    useEffect(() => {
        fetchStatistics();
    }, []);

    const fetchStatistics = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/trip-statistics');
            setStatistics(response.data);
            console.log('統計資料載入成功:', response.data);
        } catch (err) {
            console.error('獲取統計資料失敗:', err);
            setError('載入統計資料失敗，請稍後再試。');
        } finally {
            setLoading(false);
        }
    };

    const renderOverview = () => {
        if (!statistics) return null;

        return (
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '20px',
                marginBottom: '24px'
            }}>
                <div style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    padding: '24px',
                    borderRadius: '12px',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
                        {statistics.overview.totalTrips}
                    </div>
                    <div style={{ fontSize: '14px', opacity: 0.9 }}>總行程數</div>
                </div>

                <div style={{
                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    color: 'white',
                    padding: '24px',
                    borderRadius: '12px',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
                        {statistics.overview.avgDuration}
                    </div>
                    <div style={{ fontSize: '14px', opacity: 0.9 }}>平均天數</div>
                </div>

                <div style={{
                    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                    color: 'white',
                    padding: '24px',
                    borderRadius: '12px',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
                        {statistics.overview.upcomingTrips}
                    </div>
                    <div style={{ fontSize: '14px', opacity: 0.9 }}>即將出發</div>
                </div>

                <div style={{
                    background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                    color: 'white',
                    padding: '24px',
                    borderRadius: '12px',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
                        {statistics.overview.ongoingTrips}
                    </div>
                    <div style={{ fontSize: '14px', opacity: 0.9 }}>進行中</div>
                </div>
            </div>
        );
    };

    const renderAreaDistribution = () => {
        if (!statistics?.popularAreas) return null;

        return (
            <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '24px',
                border: '1px solid #e2e8f0',
                marginBottom: '24px'
            }}>
                <h3 style={{ margin: '0 0 20px 0', color: '#2d3748' }}>熱門地區分布</h3>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: '16px'
                }}>
                    {statistics.popularAreas.map((area, index) => (
                        <div key={area.area} style={{
                            padding: '16px',
                            background: `hsl(${200 + index * 30}, 70%, 95%)`,
                            borderRadius: '8px',
                            textAlign: 'center',
                            border: `1px solid hsl(${200 + index * 30}, 70%, 85%)`
                        }}>
                            <div style={{
                                fontSize: '24px',
                                fontWeight: 'bold',
                                color: `hsl(${200 + index * 30}, 70%, 40%)`,
                                marginBottom: '4px'
                            }}>
                                {area.count}
                            </div>
                            <div style={{ fontSize: '14px', color: '#718096' }}>
                                {area.area}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderDurationDistribution = () => {
        if (!statistics?.durationDistribution) return null;

        const durationIcons = {
            '週末遊': '🏖️',
            '短期旅行': '🎒',
            '長假期': '🌴',
            '深度旅行': '✈️'
        };

        return (
            <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '24px',
                border: '1px solid #e2e8f0',
                marginBottom: '24px'
            }}>
                <h3 style={{ margin: '0 0 20px 0', color: '#2d3748' }}>⏰ 行程長度分布</h3>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '16px'
                }}>
                    {statistics.durationDistribution.map((duration, index) => (
                        <div key={duration.duration_type} style={{
                            padding: '20px',
                            background: '#f7fafc',
                            borderRadius: '8px',
                            textAlign: 'center',
                            border: '1px solid #e2e8f0'
                        }}>
                            <div style={{ fontSize: '32px', marginBottom: '8px' }}>
                                {durationIcons[duration.duration_type] || '📅'}
                            </div>
                            <div style={{
                                fontSize: '20px',
                                fontWeight: 'bold',
                                color: '#3182ce',
                                marginBottom: '4px'
                            }}>
                                {duration.count}
                            </div>
                            <div style={{ fontSize: '14px', color: '#718096' }}>
                                {duration.duration_type}
                            </div>
                            <div style={{ fontSize: '12px', color: '#a0aec0', marginTop: '4px' }}>
                                平均 {Math.round(duration.avg_days)} 天
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderSeasonDistribution = () => {
        if (!statistics?.seasonDistribution) return null;

        const seasonColors = {
            '春季': { bg: '#fef5e7', color: '#744210', icon: '🌸' },
            '夏季': { bg: '#fff5f5', color: '#742a2a', icon: '☀️' },
            '秋季': { bg: '#f0fff4', color: '#22543d', icon: '🍂' },
            '冬季': { bg: '#ebf8ff', color: '#2c5282', icon: '❄️' }
        };

        return (
            <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '24px',
                border: '1px solid #e2e8f0',
                marginBottom: '24px'
            }}>
                <h3 style={{ margin: '0 0 20px 0', color: '#2d3748' }}>🌸 季節分布</h3>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: '16px'
                }}>
                    {statistics.seasonDistribution.map((season) => {
                        const style = seasonColors[season.season] || { bg: '#f7fafc', color: '#718096', icon: '📅' };
                        return (
                            <div key={season.season} style={{
                                padding: '20px',
                                background: style.bg,
                                borderRadius: '8px',
                                textAlign: 'center',
                                border: `1px solid ${style.color}20`
                            }}>
                                <div style={{ fontSize: '32px', marginBottom: '8px' }}>
                                    {style.icon}
                                </div>
                                <div style={{
                                    fontSize: '24px',
                                    fontWeight: 'bold',
                                    color: style.color,
                                    marginBottom: '4px'
                                }}>
                                    {season.count}
                                </div>
                                <div style={{ fontSize: '14px', color: style.color }}>
                                    {season.season}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderTabs = () => {
        const tabs = [
            { key: 'overview', label: '📊 總覽', description: '整體統計資料' },
            { key: 'area', label: '🗺️ 地區', description: '地區分布統計' },
            { key: 'duration', label: '⏰ 長度', description: '行程長度分析' },
            { key: 'season', label: '🌸 季節', description: '季節分布統計' }
        ];

        return (
            <div className={styles.rankingTabs} style={{ marginBottom: '24px' }}>
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        className={selectedView === tab.key ? styles.active : ''}
                        onClick={() => setSelectedView(tab.key)}
                        title={tab.description}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
        );
    };

    const renderContent = () => {
        switch (selectedView) {
            case 'area':
                return renderAreaDistribution();
            case 'duration':
                return renderDurationDistribution();
            case 'season':
                return renderSeasonDistribution();
            default:
                return (
                    <>
                        {renderOverview()}
                        {renderAreaDistribution()}
                        {renderDurationDistribution()}
                        {renderSeasonDistribution()}
                    </>
                );
        }
    };

    if (loading) return <div className={styles.loading}>載入統計資料中...</div>;
    if (error) return <div className={styles.error}>{error}</div>;

    return (
        <div className={styles.tripRankingContainer}>
            <h2>📊 行程統計面板</h2>

            {/* 重新整理按鈕 */}
            <div style={{ textAlign: 'right', marginBottom: '20px' }}>
                <button
                    onClick={fetchStatistics}
                    style={{
                        background: '#3182ce',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px'
                    }}
                >
                    🔄 重新整理
                </button>
            </div>

            {/* 標籤切換 */}
            {renderTabs()}

            {/* 內容區域 */}
            {renderContent()}

            {/* 更新時間 */}
            {statistics?.timestamp && (
                <div style={{
                    textAlign: 'center',
                    color: '#a0aec0',
                    fontSize: '12px',
                    marginTop: '24px'
                }}>
                    最後更新: {new Date(statistics.timestamp).toLocaleString('zh-TW')}
                </div>
            )}
        </div>
    );
};

export default TripStatistics;