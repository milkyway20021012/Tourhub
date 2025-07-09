import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import dynamic from 'next/dynamic';
import Head from 'next/head';

// 動態載入組件，避免 SSR 問題
const TripDetail = dynamic(() => import('../../components/TripDetail'), {
    ssr: false,
    loading: () => null
});

const ShareTrip = dynamic(() => import('../../components/ShareTrip'), {
    ssr: false,
    loading: () => null
});

// 載入畫面組件
const LoadingScreen = ({ message = "載入中...", subMessage = "正在獲取行程資料" }) => (
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

// 錯誤頁面組件
const ErrorPage = ({ error, onRetry, onGoHome }) => (
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
            border: '2px solid #ef4444'
        }}>
            <div style={{
                fontSize: '64px',
                marginBottom: '24px'
            }}>
                😔
            </div>

            <h1 style={{
                fontSize: '28px',
                fontWeight: '700',
                color: '#1f2937',
                marginBottom: '16px'
            }}>
                找不到此行程
            </h1>

            <p style={{
                color: '#6b7280',
                marginBottom: '32px',
                lineHeight: '1.6',
                fontSize: '16px'
            }}>
                {error || '此行程可能已被刪除或不存在'}
            </p>

            <div style={{
                display: 'flex',
                gap: '16px',
                justifyContent: 'center',
                flexWrap: 'wrap'
            }}>
                <button
                    onClick={onRetry}
                    style={{
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        padding: '16px 32px',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: '600',
                        transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#2563eb';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#3b82f6';
                        e.currentTarget.style.transform = 'translateY(0)';
                    }}
                >
                    🔄 重新載入
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
                        fontSize: '16px',
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
                    🏠 返回首頁
                </button>
            </div>
        </div>
    </div>
);

// 行程展示頁面組件
const TripDisplayPage = ({ trip, details, participants }) => {
    const [showShareModal, setShowShareModal] = useState(false);
    const router = useRouter();

    const formatDate = (dateString) => {
        if (!dateString) return '';
        try {
            const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
            return new Date(dateString).toLocaleDateString('zh-TW', options);
        } catch (error) {
            return dateString;
        }
    };

    const calculateDuration = (startDate, endDate) => {
        if (!startDate || !endDate) return 0;
        try {
            const start = new Date(startDate);
            const end = new Date(endDate);
            return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
        } catch (error) {
            return 0;
        }
    };

    const handleShare = () => {
        setShowShareModal(true);
    };

    const handleGoHome = () => {
        router.push('/');
    };

    const duration = calculateDuration(trip.start_date, trip.end_date);

    return (
        <>
            <Head>
                <title>{trip.title} - Tourhub</title>
                <meta name="description" content={trip.description || `探索 ${trip.area} 的精彩 ${duration} 天行程`} />
                <meta property="og:title" content={`${trip.title} - Tourhub`} />
                <meta property="og:description" content={trip.description || `探索 ${trip.area} 的精彩 ${duration} 天行程`} />
                <meta property="og:type" content="website" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </Head>

            <div style={{
                minHeight: '100vh',
                background: '#f8fafc',
                padding: '20px'
            }}>
                <div style={{
                    maxWidth: '1200px',
                    margin: '0 auto'
                }}>
                    {/* 頂部導航 */}
                    <div style={{
                        marginBottom: '24px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '16px'
                    }}>
                        <button
                            onClick={handleGoHome}
                            style={{
                                background: '#f7fafc',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                padding: '12px 20px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontWeight: '500'
                            }}
                        >
                            ← 返回首頁
                        </button>

                        <button
                            onClick={handleShare}
                            style={{
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '12px 20px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontWeight: '500',
                                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                            }}
                        >
                            📤 分享此行程
                        </button>
                    </div>

                    {/* 行程標題卡片 */}
                    <div style={{
                        background: 'white',
                        borderRadius: '16px',
                        padding: '32px',
                        marginBottom: '24px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        border: '1px solid #e2e8f0'
                    }}>
                        <div style={{
                            textAlign: 'center',
                            marginBottom: '24px'
                        }}>
                            <h1 style={{
                                fontSize: '32px',
                                fontWeight: '700',
                                color: '#1e293b',
                                margin: '0 0 16px 0',
                                lineHeight: '1.2'
                            }}>
                                {trip.title}
                            </h1>

                            <div style={{
                                display: 'flex',
                                justifyContent: 'center',
                                gap: '24px',
                                flexWrap: 'wrap',
                                marginBottom: '16px'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    background: '#e0e7ff',
                                    color: '#3730a3',
                                    padding: '8px 16px',
                                    borderRadius: '20px',
                                    fontSize: '14px',
                                    fontWeight: '500'
                                }}>
                                    📍 {trip.area}
                                </div>

                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    background: '#fef3c7',
                                    color: '#92400e',
                                    padding: '8px 16px',
                                    borderRadius: '20px',
                                    fontSize: '14px',
                                    fontWeight: '500'
                                }}>
                                    ⏰ {duration}天
                                </div>
                            </div>

                            <div style={{
                                color: '#64748b',
                                fontSize: '16px',
                                fontWeight: '500'
                            }}>
                                {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
                            </div>
                        </div>

                        {trip.description && (
                            <div style={{
                                background: '#f8fafc',
                                padding: '24px',
                                borderRadius: '12px',
                                border: '1px solid #e2e8f0'
                            }}>
                                <h3 style={{
                                    margin: '0 0 12px 0',
                                    fontSize: '18px',
                                    fontWeight: '600',
                                    color: '#374151'
                                }}>
                                    行程介紹
                                </h3>
                                <p style={{
                                    margin: '0',
                                    color: '#64748b',
                                    fontSize: '15px',
                                    lineHeight: '1.6'
                                }}>
                                    {trip.description}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* 行程詳細安排 */}
                    {details && details.length > 0 ? (
                        <div style={{
                            background: 'white',
                            borderRadius: '16px',
                            padding: '32px',
                            marginBottom: '24px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            border: '1px solid #e2e8f0'
                        }}>
                            <h2 style={{
                                margin: '0 0 24px 0',
                                fontSize: '24px',
                                fontWeight: '700',
                                color: '#1e293b'
                            }}>
                                📅 行程安排
                            </h2>

                            <div style={{
                                position: 'relative'
                            }}>
                                {details.map((detail, index) => (
                                    <div
                                        key={detail.detail_id}
                                        style={{
                                            display: 'flex',
                                            gap: '20px',
                                            marginBottom: index === details.length - 1 ? '0' : '24px',
                                            position: 'relative'
                                        }}
                                    >
                                        {/* 時間軸 */}
                                        <div style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            minWidth: '120px'
                                        }}>
                                            <div style={{
                                                background: '#3b82f6',
                                                color: 'white',
                                                padding: '8px 12px',
                                                borderRadius: '8px',
                                                fontSize: '12px',
                                                fontWeight: '600',
                                                textAlign: 'center',
                                                marginBottom: '8px',
                                                minWidth: '80px'
                                            }}>
                                                {formatDate(detail.date).split(' ')[0]}
                                            </div>

                                            <div style={{
                                                background: '#f1f5f9',
                                                color: '#475569',
                                                padding: '4px 8px',
                                                borderRadius: '6px',
                                                fontSize: '11px',
                                                fontWeight: '500',
                                                textAlign: 'center'
                                            }}>
                                                {detail.start_time?.substring(0, 5)} - {detail.end_time?.substring(0, 5)}
                                            </div>

                                            {/* 連接線 */}
                                            {index !== details.length - 1 && (
                                                <div style={{
                                                    width: '2px',
                                                    height: '40px',
                                                    background: '#e2e8f0',
                                                    marginTop: '12px'
                                                }} />
                                            )}
                                        </div>

                                        {/* 內容 */}
                                        <div style={{
                                            flex: '1',
                                            background: '#f8fafc',
                                            padding: '20px',
                                            borderRadius: '12px',
                                            border: '1px solid #e2e8f0'
                                        }}>
                                            <h4 style={{
                                                margin: '0 0 8px 0',
                                                fontSize: '16px',
                                                fontWeight: '600',
                                                color: '#1e293b'
                                            }}>
                                                📍 {detail.location}
                                            </h4>

                                            {detail.description && (
                                                <p style={{
                                                    margin: '0',
                                                    color: '#64748b',
                                                    fontSize: '14px',
                                                    lineHeight: '1.5'
                                                }}>
                                                    {detail.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div style={{
                            background: 'white',
                            borderRadius: '16px',
                            padding: '48px 32px',
                            textAlign: 'center',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            border: '1px solid #e2e8f0',
                            marginBottom: '24px'
                        }}>
                            <div style={{
                                fontSize: '48px',
                                marginBottom: '16px'
                            }}>
                                📅
                            </div>
                            <h3 style={{
                                margin: '0 0 8px 0',
                                fontSize: '18px',
                                fontWeight: '600',
                                color: '#374151'
                            }}>
                                尚未安排詳細行程
                            </h3>
                            <p style={{
                                margin: '0',
                                color: '#64748b',
                                fontSize: '14px'
                            }}>
                                這個行程還沒有詳細的時間安排
                            </p>
                        </div>
                    )}

                    {/* 統計資訊 */}
                    <div style={{
                        background: 'white',
                        borderRadius: '16px',
                        padding: '32px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        border: '1px solid #e2e8f0'
                    }}>
                        <h3 style={{
                            margin: '0 0 20px 0',
                            fontSize: '20px',
                            fontWeight: '600',
                            color: '#1e293b'
                        }}>
                            📊 行程資訊
                        </h3>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                            gap: '20px'
                        }}>
                            <div style={{
                                textAlign: 'center',
                                padding: '16px',
                                background: '#f8fafc',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0'
                            }}>
                                <div style={{
                                    fontSize: '24px',
                                    fontWeight: '700',
                                    color: '#3b82f6',
                                    marginBottom: '4px'
                                }}>
                                    {duration}
                                </div>
                                <div style={{
                                    fontSize: '13px',
                                    color: '#64748b',
                                    fontWeight: '500'
                                }}>
                                    行程天數
                                </div>
                            </div>

                            <div style={{
                                textAlign: 'center',
                                padding: '16px',
                                background: '#f8fafc',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0'
                            }}>
                                <div style={{
                                    fontSize: '24px',
                                    fontWeight: '700',
                                    color: '#10b981',
                                    marginBottom: '4px'
                                }}>
                                    {details?.length || 0}
                                </div>
                                <div style={{
                                    fontSize: '13px',
                                    color: '#64748b',
                                    fontWeight: '500'
                                }}>
                                    活動安排
                                </div>
                            </div>

                            <div style={{
                                textAlign: 'center',
                                padding: '16px',
                                background: '#f8fafc',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0'
                            }}>
                                <div style={{
                                    fontSize: '24px',
                                    fontWeight: '700',
                                    color: '#f59e0b',
                                    marginBottom: '4px'
                                }}>
                                    {participants?.length || 0}
                                </div>
                                <div style={{
                                    fontSize: '13px',
                                    color: '#64748b',
                                    fontWeight: '500'
                                }}>
                                    參與人數
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 行動按鈕 */}
                    <div style={{
                        marginTop: '32px',
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '16px',
                        flexWrap: 'wrap'
                    }}>
                        <button
                            onClick={handleShare}
                            style={{
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                padding: '16px 32px',
                                cursor: 'pointer',
                                fontSize: '16px',
                                fontWeight: '600',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 8px 20px rgba(16, 185, 129, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                            }}
                        >
                            📤 分享此行程
                        </button>

                        <button
                            onClick={handleGoHome}
                            style={{
                                background: '#f3f4f6',
                                color: '#374151',
                                border: '1px solid #d1d5db',
                                borderRadius: '12px',
                                padding: '16px 32px',
                                cursor: 'pointer',
                                fontSize: '16px',
                                fontWeight: '500',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
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
                            🏠 探索更多行程
                        </button>
                    </div>
                </div>
            </div>

            {/* 分享彈窗 */}
            {showShareModal && (
                <ShareTrip
                    trip={trip}
                    details={details || []}
                    onClose={() => setShowShareModal(false)}
                />
            )}
        </>
    );
};

// 主要頁面組件
const TripPage = () => {
    const router = useRouter();
    const { id } = router.query;

    const [tripData, setTripData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchTripData = async (tripId) => {
        if (!tripId) return;

        setLoading(true);
        setError(null);

        try {
            console.log('正在載入行程資料，ID:', tripId);

            const response = await axios.get('/api/trip-detail', {
                params: { id: tripId },
                timeout: 10000
            });

            console.log('API 回應:', response.data);

            if (response.data && response.data.success) {
                setTripData(response.data);
                console.log('行程資料載入成功');
            } else {
                throw new Error(response.data?.message || '行程資料格式錯誤');
            }
        } catch (error) {
            console.error('載入行程失敗:', error);

            let errorMessage = '載入行程失敗';

            if (error.response?.status === 404) {
                errorMessage = '找不到此行程，可能已被刪除或不存在';
            } else if (error.response?.status >= 500) {
                errorMessage = '伺服器錯誤，請稍後再試';
            } else if (error.code === 'ECONNABORTED') {
                errorMessage = '載入超時，請檢查網路連接';
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id && router.isReady) {
            fetchTripData(id);
        }
    }, [id, router.isReady]);

    const handleRetry = () => {
        if (id) {
            fetchTripData(id);
        }
    };

    const handleGoHome = () => {
        router.push('/');
    };

    // 載入中
    if (loading) {
        return <LoadingScreen message="載入中..." subMessage="正在獲取行程資料" />;
    }

    // 錯誤狀態
    if (error) {
        return (
            <ErrorPage
                error={error}
                onRetry={handleRetry}
                onGoHome={handleGoHome}
            />
        );
    }

    // 沒有資料
    if (!tripData || !tripData.trip) {
        return (
            <ErrorPage
                error="找不到此行程"
                onRetry={handleRetry}
                onGoHome={handleGoHome}
            />
        );
    }

    // 顯示行程
    return (
        <TripDisplayPage
            trip={tripData.trip}
            details={tripData.details}
            participants={tripData.participants}
        />
    );
};

export default TripPage;