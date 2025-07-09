import React, { useState, useEffect } from 'react';
import axios from 'axios';
import dynamic from 'next/dynamic';

// 完全禁用 SSR 的動態組件載入
const TripDetail = dynamic(() => import('../components/TripDetail'), {
  ssr: false,
  loading: () => null
});

const ShareTrip = dynamic(() => import('../components/ShareTrip'), {
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

// LINE 登入提示彈窗
const LineLoginModal = ({ isOpen, onClose, onLogin, isLoading }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }} onClick={onClose}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '32px',
        maxWidth: '400px',
        width: '100%',
        textAlign: 'center',
        position: 'relative'
      }} onClick={e => e.stopPropagation()}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: '#9ca3af'
          }}
        >
          ×
        </button>

        <div style={{
          fontSize: '48px',
          marginBottom: '16px'
        }}>
          🔐
        </div>

        <h3 style={{
          fontSize: '20px',
          fontWeight: '700',
          color: '#1f2937',
          marginBottom: '12px'
        }}>
          需要登入 LINE 才能使用收藏功能
        </h3>

        <p style={{
          color: '#6b7280',
          marginBottom: '24px',
          lineHeight: '1.5'
        }}>
          登入您的 LINE 帳號即可收藏喜愛的行程，並在任何時候查看您的收藏列表
        </p>

        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'center'
        }}>
          <button
            onClick={onLogin}
            disabled={isLoading}
            style={{
              background: isLoading ? '#9ca3af' : '#00C300',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              opacity: isLoading ? 0.6 : 1
            }}
          >
            {isLoading ? '⏳ 登入中...' : '📱 登入 LINE'}
          </button>
          <button
            onClick={onClose}
            disabled={isLoading}
            style={{
              background: '#f3f4f6',
              color: '#374151',
              border: '1px solid #d1d5db',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              opacity: isLoading ? 0.6 : 1
            }}
          >
            稍後再說
          </button>
        </div>
      </div>
    </div>
  );
};

const HomePage = () => {
  const [trips, setTrips] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [areas, setAreas] = useState([]);
  const [mounted, setMounted] = useState(false);

  // 收藏功能相關狀態
  const [favorites, setFavorites] = useState(new Set());
  const [favoriteLoading, setFavoriteLoading] = useState({});

  // 分享功能相關狀態
  const [shareModalData, setShareModalData] = useState(null);
  const [shareLoading, setShareLoading] = useState({});
  const [quickShareLoading, setQuickShareLoading] = useState({});

  // LIFF 相關狀態
  const [liffReady, setLiffReady] = useState(false);
  const [liffLoggedIn, setLiffLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [liffLoading, setLiffLoading] = useState(true);
  const [liffError, setLiffError] = useState(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // LINE 登入彈窗狀態
  const [showLoginModal, setShowLoginModal] = useState(false);

  // 篩選狀態
  const [filters, setFilters] = useState({
    duration_type: '',
    season: '',
    area: ''
  });

  // 初始化
  useEffect(() => {
    setMounted(true);
    initializeLiff();
  }, []);

  useEffect(() => {
    if (mounted) {
      initializeData();
    }
  }, [mounted, liffReady]);

  useEffect(() => {
    if (mounted) {
      fetchTripRankings(activeTab);
    }
  }, [mounted, activeTab, filters]);

  // LIFF 初始化（修復版本）
  const initializeLiff = async () => {
    if (typeof window === 'undefined') return;

    try {
      setLiffLoading(true);

      // 檢查 LIFF SDK 是否已載入
      if (typeof window.liff === 'undefined') {
        console.log('正在載入 LIFF SDK...');

        // 動態載入 LIFF SDK
        const script = document.createElement('script');
        script.src = 'https://static.line-scdn.net/liff/edge/2/sdk.js';
        script.async = true;
        document.head.appendChild(script);

        await new Promise((resolve, reject) => {
          script.onload = () => {
            console.log('LIFF SDK 載入成功');
            resolve();
          };
          script.onerror = (error) => {
            console.error('LIFF SDK 載入失敗:', error);
            reject(new Error('LIFF SDK 載入失敗'));
          };
        });

        // 等待 SDK 完全初始化
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // 檢查環境變數
      const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
      if (!liffId) {
        throw new Error('LIFF ID 未設定，請檢查環境變數 NEXT_PUBLIC_LIFF_ID');
      }

      console.log('正在初始化 LIFF，ID:', liffId);

      // 初始化 LIFF - 修復版本
      await window.liff.init({
        liffId: liffId,
        withLoginOnExternalBrowser: true
      });

      console.log('LIFF 初始化成功');
      setLiffReady(true);

      // 檢查登入狀態
      const isLoggedIn = window.liff.isLoggedIn();
      console.log('LIFF 登入狀態:', isLoggedIn);

      if (isLoggedIn) {
        setLiffLoggedIn(true);

        // 獲取用戶資料 - 使用 await 確保完成
        try {
          const profile = await window.liff.getProfile();
          console.log('用戶資料:', profile);
          setUserProfile(profile);

          // 等待狀態更新後再載入收藏
          setTimeout(() => {
            fetchUserFavorites();
          }, 100);
        } catch (profileError) {
          console.error('獲取用戶資料失敗:', profileError);
          setLiffError('獲取用戶資料失敗');
        }
      } else {
        console.log('用戶尚未登入 LINE');
      }

    } catch (error) {
      console.error('LIFF 初始化失敗:', error);
      setLiffError(error.message || 'LIFF 初始化失敗');
    } finally {
      setLiffLoading(false);
    }
  };

  const initializeData = async () => {
    if (!mounted) return;

    await Promise.all([
      fetchStatistics(),
      fetchAreas(),
      fetchTripRankings(activeTab)
    ]);
  };

  // 獲取統計資料
  const fetchStatistics = async () => {
    if (!mounted) return;

    try {
      const response = await axios.get('/api/trip-statistics');
      setStatistics(response.data);
    } catch (err) {
      console.error('獲取統計資料失敗:', err);
    }
  };

  // 獲取地區選項
  const fetchAreas = async () => {
    if (!mounted) return;

    try {
      const response = await axios.get('/api/get-filters');
      setAreas(response.data.areas || []);
    } catch (err) {
      console.error('獲取地區失敗:', err);
    }
  };

  // 獲取行程排行榜
  const fetchTripRankings = async (rankingType) => {
    if (!mounted) return;

    setLoading(true);
    try {
      const params = {
        type: rankingType,
        ...filters
      };

      const response = await axios.get('/api/trip-rankings-enhanced', { params });
      const data = response.data.success ? response.data.data : response.data;
      setTrips(data || []);
      setError(null);
    } catch (err) {
      console.error('獲取排行榜失敗:', err);
      setError('載入排行榜失敗，請稍後再試。');
      setTrips([]);
    } finally {
      setLoading(false);
    }
  };

  // 獲取用戶收藏 - 修復版本
  const fetchUserFavorites = async () => {
    if (!mounted || !liffLoggedIn || !userProfile) {
      console.log('條件不滿足，跳過載入收藏:', { mounted, liffLoggedIn, userProfile: !!userProfile });
      return;
    }

    const userId = getCurrentUserId();
    if (!userId) {
      console.log('無法獲取用戶 ID，跳過載入收藏');
      return;
    }

    try {
      console.log('正在載入用戶收藏，用戶 ID:', userId);
      const response = await axios.get('/api/user-favorites', {
        params: { line_user_id: userId },
        timeout: 10000
      });

      if (response.data.success) {
        const favIds = new Set(response.data.favorites.map(f => f.trip_id));
        setFavorites(favIds);
        console.log('收藏載入成功，數量:', favIds.size);
      } else {
        console.error('API 返回失敗:', response.data);
      }
    } catch (err) {
      console.error('獲取收藏列表失敗:', err);
    }
  };

  // 獲取當前用戶 ID - 修復版本
  const getCurrentUserId = () => {
    if (liffLoggedIn && userProfile?.userId) {
      return userProfile.userId;
    }

    // 開發環境備用方案
    if (process.env.NODE_ENV === 'development' && !liffReady) {
      console.warn('開發環境：使用測試用戶 ID');
      return 'demo_user_123';
    }

    return null;
  };

  // 檢查是否已登入 LINE
  const isLineLoggedIn = () => {
    return liffReady && liffLoggedIn && userProfile;
  };

  // 格式化日期
  const formatDate = (dateString) => {
    if (!mounted || !dateString) return '';
    try {
      const options = { year: 'numeric', month: 'short', day: 'numeric' };
      return new Date(dateString).toLocaleDateString('zh-TW', options);
    } catch (error) {
      return dateString;
    }
  };

  // 切換收藏狀態 - 修復版本
  const toggleFavorite = async (tripId, event) => {
    event.stopPropagation();

    // 檢查是否已登入 LINE
    if (!isLineLoggedIn()) {
      setShowLoginModal(true);
      return;
    }

    const userId = getCurrentUserId();
    if (!userId) {
      console.error('無法獲取用戶 ID');
      alert('無法獲取用戶資訊，請重新登入');
      return;
    }

    setFavoriteLoading(prev => ({ ...prev, [tripId]: true }));

    try {
      const isFavorited = favorites.has(tripId);

      if (isFavorited) {
        await axios.delete('/api/user-favorites', {
          data: { line_user_id: userId, trip_id: tripId },
          timeout: 10000
        });

        setFavorites(prev => {
          const newSet = new Set(prev);
          newSet.delete(tripId);
          return newSet;
        });
        console.log('取消收藏成功:', tripId);
      } else {
        await axios.post('/api/user-favorites', {
          line_user_id: userId,
          trip_id: tripId
        }, {
          timeout: 10000
        });

        setFavorites(prev => new Set([...prev, tripId]));
        console.log('添加收藏成功:', tripId);
      }
    } catch (err) {
      console.error('收藏操作失敗:', err);
      let errorMessage = '操作失敗，請稍後再試';

      if (err.response?.status === 404) {
        errorMessage = '行程不存在';
      } else if (err.code === 'ECONNABORTED') {
        errorMessage = '請求超時，請檢查網路連接';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }

      alert(errorMessage);
    } finally {
      setFavoriteLoading(prev => ({ ...prev, [tripId]: false }));
    }
  };

  // 詳細分享
  const handleDetailedShare = async (trip, e) => {
    e.stopPropagation();

    setShareLoading(prev => ({ ...prev, [trip.trip_id]: true }));

    try {
      const response = await axios.get(`/api/trip-detail?id=${trip.trip_id}`);

      if (response.data.success) {
        setShareModalData({
          trip: response.data.trip,
          details: response.data.details || []
        });
      } else {
        setShareModalData({
          trip: trip,
          details: []
        });
      }
    } catch (error) {
      console.error('獲取行程詳情失敗:', error);
      setShareModalData({
        trip: trip,
        details: []
      });
    } finally {
      setShareLoading(prev => ({ ...prev, [trip.trip_id]: false }));
    }
  };

  // 快速分享 - 修復版本
  const handleQuickShare = async (trip, e) => {
    e.stopPropagation();

    setQuickShareLoading(prev => ({ ...prev, [trip.trip_id]: true }));

    const shareText = `🎯 推薦行程：${trip.title}\n📍 ${trip.area}\n📅 ${formatDate(trip.start_date)} - ${formatDate(trip.end_date)}\n\n✨ 透過 Tourhub 分享`;

    try {
      // 檢查 LIFF 是否準備就緒且用戶已登入
      if (typeof window !== 'undefined' && window.liff && liffReady) {

        // 檢查是否已登入
        if (window.liff.isLoggedIn()) {
          try {
            console.log('使用 LINE 分享功能');

            // 使用正確的 LINE 分享 API
            await window.liff.shareTargetPicker([
              {
                type: 'text',
                text: shareText
              }
            ]);

            console.log('LINE 分享成功');

            // 記錄分享行為
            const userId = getCurrentUserId();
            if (userId) {
              try {
                await axios.post('/api/user-shares', {
                  line_user_id: userId,
                  trip_id: trip.trip_id,
                  share_type: 'quick',
                  share_content: { type: 'quick', format: 'text' }
                });
                console.log('分享記錄成功');
              } catch (recordError) {
                console.warn('記錄分享失敗:', recordError);
              }
            }

            return;
          } catch (liffShareError) {
            console.error('LINE 分享失敗:', liffShareError);

            // 檢查是否是用戶取消分享
            if (liffShareError.message && liffShareError.message.includes('cancel')) {
              console.log('用戶取消分享');
              return;
            }

            // 繼續嘗試其他分享方式
          }
        } else {
          console.log('用戶未登入 LINE，使用備用分享方式');
        }
      }

      // 備用分享方式：使用瀏覽器原生分享
      if (navigator.share) {
        try {
          await navigator.share({
            title: trip.title,
            text: shareText
          });
          console.log('瀏覽器原生分享成功');
          return;
        } catch (shareError) {
          console.error('瀏覽器分享失敗:', shareError);

          // 如果是用戶取消，不需要顯示錯誤
          if (shareError.name === 'AbortError') {
            console.log('用戶取消分享');
            return;
          }
        }
      }

      // 最後備用：複製到剪貼簿
      try {
        await navigator.clipboard.writeText(shareText);
        alert('行程資訊已複製到剪貼簿！您可以貼到任何地方分享');
        console.log('複製到剪貼簿成功');
      } catch (clipboardError) {
        console.error('複製到剪貼簿失敗:', clipboardError);

        // 手動選取文字複製（最後的備用方案）
        const textArea = document.createElement('textarea');
        textArea.value = shareText;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();

        try {
          document.execCommand('copy');
          alert('行程資訊已複製到剪貼簿！您可以貼到任何地方分享');
        } catch (execError) {
          console.error('手動複製失敗:', execError);
          alert('分享失敗，請手動複製以下內容：\n\n' + shareText);
        }

        document.body.removeChild(textArea);
      }

    } catch (error) {
      console.error('快速分享失敗:', error);
      alert('分享失敗，請稍後再試');
    } finally {
      setQuickShareLoading(prev => ({ ...prev, [trip.trip_id]: false }));
    }
  };

  // 點擊行程
  const handleTripClick = async (tripId) => {
    try {
      const response = await axios.get(`/api/trip-detail?id=${tripId}`);
      setSelectedTrip(response.data);
    } catch (err) {
      console.error('獲取行程詳情失敗:', err);
      alert('載入行程詳情失敗');
    }
  };

  // 真正的 LINE 登入 - 修復版本
  const handleLogin = async () => {
    if (!liffReady) {
      alert('LINE 服務尚未準備就緒，請稍後再試');
      return;
    }

    setLoginLoading(true);

    try {
      console.log('開始 LINE 登入流程');

      if (typeof window !== 'undefined' && window.liff) {
        if (!window.liff.isLoggedIn()) {
          console.log('執行 LINE 登入');

          // 關閉彈窗
          setShowLoginModal(false);

          // 在外部瀏覽器中，LIFF 會開啟 LINE 登入頁面
          window.liff.login({
            redirectUri: window.location.href
          });

          // 注意：這裡不會立即返回，因為會跳轉到登入頁面
          return;
        } else {
          console.log('用戶已登入，更新狀態');

          // 用戶已經登入，更新本地狀態
          setLiffLoggedIn(true);

          try {
            const profile = await window.liff.getProfile();
            setUserProfile(profile);
            console.log('用戶資料更新成功:', profile);

            // 登入成功後載入收藏
            setTimeout(() => {
              fetchUserFavorites();
            }, 100);

            setShowLoginModal(false);
            alert(`歡迎，${profile.displayName}！`);
          } catch (profileError) {
            console.error('獲取用戶資料失敗:', profileError);
            alert('登入成功，但獲取用戶資料失敗');
          }
        }
      } else {
        throw new Error('LIFF 尚未初始化');
      }
    } catch (error) {
      console.error('LINE 登入失敗:', error);
      alert(`登入失敗：${error.message}`);
    } finally {
      setLoginLoading(false);
    }
  };

  // 登出功能
  const handleLogout = async () => {
    try {
      if (typeof window !== 'undefined' && window.liff && window.liff.isLoggedIn()) {
        window.liff.logout();
      }

      // 清除本地狀態
      setLiffLoggedIn(false);
      setUserProfile(null);
      setFavorites(new Set());

      console.log('登出成功');
      alert('已成功登出');

    } catch (error) {
      console.error('登出失敗:', error);
    }
  };

  // 處理收藏頁面導航 - 需要登入驗證
  const handleFavoritesNavigation = () => {
    if (!isLineLoggedIn()) {
      setShowLoginModal(true);
      return;
    }
    window.location.href = '/favorites';
  };

  // 如果尚未掛載，不渲染任何內容 (避免 hydration 錯誤)
  if (!mounted) {
    return null;
  }

  return (
    <ClientOnly
      fallback={<LoadingScreen message="載入中..." subMessage="正在初始化 Tourhub 行程排行榜" />}
    >
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '20px',
        minHeight: '100vh',
        background: '#f8fafc'
      }}>
        {/* 標題區域 */}
        <div style={{
          textAlign: 'center',
          marginBottom: '32px',
          padding: '32px 24px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '16px',
          color: 'white'
        }}>
          <h1 style={{
            margin: '0 0 24px 0',
            fontSize: '32px',
            fontWeight: '700'
          }}>
            Tourhub 行程排行榜
          </h1>

          {/* 用戶資訊 */}
          <div style={{ marginBottom: '16px', color: 'white', textAlign: 'center' }}>
            {liffError ? (
              <div>
                <span>⚠️ LINE 服務連接失敗: {liffError}</span>
                <button
                  onClick={() => window.location.reload()}
                  style={{
                    marginLeft: '8px',
                    padding: '4px 8px',
                    background: 'rgba(255,255,255,0.2)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    borderRadius: '4px',
                    color: 'white',
                    cursor: 'pointer'
                  }}
                >
                  重新載入
                </button>
              </div>
            ) : liffLoading ? (
              <div>
                <span>🔄 正在初始化 LINE 服務...</span>
              </div>
            ) : isLineLoggedIn() ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <span>👋 歡迎，{userProfile?.displayName || '用戶'}</span>
                {userProfile?.pictureUrl && (
                  <img
                    src={userProfile.pictureUrl}
                    alt="頭像"
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      verticalAlign: 'middle'
                    }}
                  />
                )}
                <button
                  onClick={handleLogout}
                  style={{
                    marginLeft: '8px',
                    padding: '4px 8px',
                    background: 'rgba(255,255,255,0.2)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    borderRadius: '4px',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  登出
                </button>
              </div>
            ) : (
              <div>
                <span>👤 訪客模式</span>
                <button
                  onClick={() => setShowLoginModal(true)}
                  disabled={!liffReady}
                  style={{
                    marginLeft: '8px',
                    padding: '4px 8px',
                    background: liffReady ? 'rgba(255,255,255,0.2)' : 'rgba(156,163,175,0.2)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    borderRadius: '4px',
                    color: 'white',
                    cursor: liffReady ? 'pointer' : 'not-allowed',
                    opacity: liffReady ? 1 : 0.6
                  }}
                >
                  {liffReady ? '登入 LINE' : '初始化中...'}
                </button>
              </div>
            )}
          </div>

          {/* 統計面板 */}
          {statistics && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: '24px',
              marginTop: '24px'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '28px', fontWeight: '700', marginBottom: '4px' }}>
                  {statistics.overview?.totalTrips || 0}
                </div>
                <div style={{ fontSize: '14px', opacity: '0.9' }}>總行程</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '28px', fontWeight: '700', marginBottom: '4px' }}>
                  {isLineLoggedIn() ? favorites.size : '--'}
                </div>
                <div style={{ fontSize: '14px', opacity: '0.9' }}>
                  我的收藏 {!isLineLoggedIn() && '(需登入)'}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '28px', fontWeight: '700', marginBottom: '4px' }}>
                  {statistics.overview?.avgDuration || 0}
                </div>
                <div style={{ fontSize: '14px', opacity: '0.9' }}>平均天數</div>
              </div>
            </div>
          )}
        </div>

        {/* 篩選面板 */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr auto',
            gap: '16px',
            alignItems: 'end'
          }}>
            <div>
              <label style={{ fontWeight: '600', color: '#374151', fontSize: '14px', display: 'block', marginBottom: '8px' }}>
                地區
              </label>
              <select
                value={filters.area}
                onChange={(e) => setFilters({ ...filters, area: e.target.value })}
                style={{
                  padding: '12px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  background: 'white',
                  width: '100%'
                }}
              >
                <option value="">全部地區</option>
                {areas.map((area, index) => (
                  <option key={index} value={area}>{area}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontWeight: '600', color: '#374151', fontSize: '14px', display: 'block', marginBottom: '8px' }}>
                行程長度
              </label>
              <select
                value={filters.duration_type}
                onChange={(e) => setFilters({ ...filters, duration_type: e.target.value })}
                style={{
                  padding: '12px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  background: 'white',
                  width: '100%'
                }}
              >
                <option value="">旅途天數</option>
                <option value="週末遊">1-2天</option>
                <option value="短期旅行">3-5天</option>
                <option value="長假期">6-10天</option>
                <option value="深度旅行">10天以上</option>
              </select>
            </div>

            <div>
              <label style={{ fontWeight: '600', color: '#374151', fontSize: '14px', display: 'block', marginBottom: '8px' }}>
                季節
              </label>
              <select
                value={filters.season}
                onChange={(e) => setFilters({ ...filters, season: e.target.value })}
                style={{
                  padding: '12px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  background: 'white',
                  width: '100%'
                }}
              >
                <option value="">全部季節</option>
                <option value="春季">春季 (3-5月)</option>
                <option value="夏季">夏季 (6-8月)</option>
                <option value="秋季">秋季 (9-11月)</option>
                <option value="冬季">冬季 (12-2月)</option>
              </select>
            </div>

            <button
              onClick={() => setFilters({ duration_type: '', season: '', area: '' })}
              style={{
                background: '#f3f4f6',
                color: '#374151',
                border: '1px solid #d1d5db',
                padding: '12px 20px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '500',
                height: 'fit-content'
              }}
            >
              重置篩選
            </button>
          </div>
        </div>

        {/* 標籤切換 */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '24px',
          flexWrap: 'wrap'
        }}>
          {[
            { key: 'all', label: '全部行程' },
            { key: 'favorites', label: '我的收藏' }
          ].map(tab => (
            <button
              key={tab.key}
              style={{
                padding: '12px 24px',
                border: '1px solid #d1d5db',
                background: activeTab === tab.key ? '#3b82f6' : 'white',
                color: activeTab === tab.key ? 'white' : '#374151',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                opacity: tab.key === 'favorites' && !isLineLoggedIn() ? 0.6 : 1
              }}
              onClick={() => {
                if (tab.key === 'favorites') {
                  handleFavoritesNavigation();
                } else {
                  setActiveTab(tab.key);
                }
              }}
            >
              {tab.label}
              {tab.key === 'favorites' && (
                <>
                  {isLineLoggedIn() && favorites.size > 0 && (
                    <span style={{
                      marginLeft: '8px',
                      background: '#ef4444',
                      color: 'white',
                      borderRadius: '10px',
                      padding: '2px 6px',
                      fontSize: '12px'
                    }}>
                      {favorites.size}
                    </span>
                  )}
                  {!isLineLoggedIn() && (
                    <span style={{
                      marginLeft: '8px',
                      background: '#fbbf24',
                      color: 'white',
                      borderRadius: '10px',
                      padding: '2px 6px',
                      fontSize: '12px'
                    }}>
                      🔒
                    </span>
                  )}
                </>
              )}
            </button>
          ))}
        </div>

        {/* 行程列表 */}
        {liffLoading ? (
          <LoadingScreen message="載入中..." subMessage="正在初始化 LINE 服務" />
        ) : loading ? (
          <LoadingScreen message="載入中..." subMessage="正在獲取行程資料" />
        ) : error ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: '#fef2f2',
            borderRadius: '12px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: '1px solid #fecaca'
          }}>
            <div style={{ fontSize: '18px', marginBottom: '8px' }}>❌ 載入失敗</div>
            <div style={{ fontSize: '14px', marginBottom: '16px' }}>{error}</div>
            <button
              onClick={() => fetchTripRankings(activeTab)}
              style={{
                background: '#ef4444',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              🔄 重試
            </button>
          </div>
        ) : trips.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📍</div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
              沒有找到符合條件的行程
            </div>
            <div style={{ color: '#64748b', fontSize: '14px' }}>
              嘗試調整篩選條件或選擇其他分類
            </div>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            {trips.map((trip, index) => (
              <div
                key={trip.trip_id}
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
                onClick={() => handleTripClick(trip.trip_id)}
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
                {/* 排名 */}
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
                  {index + 1}
                </div>

                {/* 內容區域 */}
                <div style={{ flex: '1', minWidth: '0' }}>
                  <h3 style={{
                    margin: '0 0 12px 0',
                    fontSize: '20px',
                    fontWeight: '600',
                    color: '#1e293b',
                    lineHeight: '1.3'
                  }}>
                    {trip.title}
                  </h3>

                  <div style={{
                    display: 'flex',
                    gap: '16px',
                    marginBottom: '12px',
                    flexWrap: 'wrap'
                  }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      background: '#e0e7ff',
                      color: '#3730a3',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '13px',
                      fontWeight: '500'
                    }}>
                      {trip.area}
                    </span>
                    <span style={{
                      color: '#64748b',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}>
                      {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
                    </span>
                  </div>

                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    marginBottom: '12px',
                    flexWrap: 'wrap'
                  }}>
                    {trip.duration_days && (
                      <span style={{
                        background: '#f1f5f9',
                        color: '#475569',
                        padding: '4px 10px',
                        borderRadius: '16px',
                        fontSize: '12px',
                        fontWeight: '500',
                        border: '1px solid #e2e8f0'
                      }}>
                        {trip.duration_days}天
                      </span>
                    )}
                    {trip.season && (
                      <span style={{
                        background: '#f1f5f9',
                        color: '#475569',
                        padding: '4px 10px',
                        borderRadius: '16px',
                        fontSize: '12px',
                        fontWeight: '500',
                        border: '1px solid #e2e8f0'
                      }}>
                        {trip.season}
                      </span>
                    )}
                    {trip.duration_type && (
                      <span style={{
                        background: '#f1f5f9',
                        color: '#475569',
                        padding: '4px 10px',
                        borderRadius: '16px',
                        fontSize: '12px',
                        fontWeight: '500',
                        border: '1px solid #e2e8f0'
                      }}>
                        {trip.duration_type}
                      </span>
                    )}
                  </div>

                  {trip.description && (
                    <p style={{
                      margin: '0',
                      color: '#64748b',
                      fontSize: '14px',
                      lineHeight: '1.5'
                    }}>
                      {trip.description.length > 100
                        ? trip.description.substring(0, 100) + '...'
                        : trip.description}
                    </p>
                  )}
                </div>

                {/* 右側按鈕區域 - 收藏功能需要登入 */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  alignItems: 'center',
                  flexShrink: '0',
                  minWidth: '60px'
                }}>
                  {/* 收藏按鈕 - 需要 LINE 登入 */}
                  <button
                    onClick={(e) => toggleFavorite(trip.trip_id, e)}
                    disabled={favoriteLoading[trip.trip_id]}
                    style={{
                      background: isLineLoggedIn() ?
                        (favorites.has(trip.trip_id) ? 'rgba(239, 68, 68, 0.1)' : 'rgba(156, 163, 175, 0.1)') :
                        'rgba(156, 163, 175, 0.05)',
                      border: isLineLoggedIn() ?
                        `1px solid ${favorites.has(trip.trip_id) ? '#f87171' : '#d1d5db'}` :
                        '1px solid #e5e7eb',
                      borderRadius: '50%',
                      width: '40px',
                      height: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: favoriteLoading[trip.trip_id] ? 'not-allowed' : 'pointer',
                      fontSize: '16px',
                      transition: 'all 0.2s ease',
                      opacity: favoriteLoading[trip.trip_id] ? 0.7 : (isLineLoggedIn() ? 1 : 0.5),
                      position: 'relative'
                    }}
                    title={
                      !isLineLoggedIn() ? '需要登入 LINE 才能使用收藏功能' :
                        favoriteLoading[trip.trip_id] ? '處理中...' :
                          (favorites.has(trip.trip_id) ? '取消收藏' : '加入收藏')
                    }
                    onMouseEnter={(e) => {
                      if (!favoriteLoading[trip.trip_id] && isLineLoggedIn()) {
                        e.currentTarget.style.transform = 'scale(1.1)';
                        e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!favoriteLoading[trip.trip_id]) {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = 'none';
                      }
                    }}
                  >
                    {favoriteLoading[trip.trip_id] ? '⏳' :
                      !isLineLoggedIn() ? '🔒' :
                        (favorites.has(trip.trip_id) ? '❤️' : '🤍')}
                  </button>

                  {/* 快速分享按鈕 */}
                  <button
                    onClick={(e) => handleQuickShare(trip, e)}
                    disabled={quickShareLoading[trip.trip_id]}
                    title="快速分享"
                    style={{
                      width: '40px',
                      height: '40px',
                      border: 'none',
                      borderRadius: '50%',
                      cursor: quickShareLoading[trip.trip_id] ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                      background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                      color: 'white',
                      opacity: quickShareLoading[trip.trip_id] ? 0.6 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (!quickShareLoading[trip.trip_id]) {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 8px rgba(245, 158, 11, 0.3)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!quickShareLoading[trip.trip_id]) {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                      }
                    }}
                  >
                    {quickShareLoading[trip.trip_id] ? '⏳' : '🚀'}
                  </button>

                  {/* 詳細分享按鈕 */}
                  <button
                    onClick={(e) => handleDetailedShare(trip, e)}
                    disabled={shareLoading[trip.trip_id]}
                    title="詳細分享"
                    style={{
                      width: '40px',
                      height: '40px',
                      border: 'none',
                      borderRadius: '50%',
                      cursor: shareLoading[trip.trip_id] ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: 'white',
                      opacity: shareLoading[trip.trip_id] ? 0.6 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (!shareLoading[trip.trip_id]) {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #059669 0%, #047857 100%)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 8px rgba(16, 185, 129, 0.3)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!shareLoading[trip.trip_id]) {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                      }
                    }}
                  >
                    {shareLoading[trip.trip_id] ? '⏳' : '📤'}
                  </button>
                </div>
              </div>
            ))}

            {trips.length >= 20 && (
              <div style={{ textAlign: 'center', marginTop: '24px' }}>
                <button
                  onClick={() => fetchTripRankings(activeTab)}
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
                  重新載入
                </button>
              </div>
            )}
          </div>
        )}

        {/* 行程詳情彈窗 */}
        {selectedTrip && (
          <TripDetail
            trip={selectedTrip.trip}
            details={selectedTrip.details}
            participants={selectedTrip.participants}
            onClose={() => setSelectedTrip(null)}
          />
        )}

        {/* 分享彈窗 */}
        {shareModalData && (
          <ShareTrip
            trip={shareModalData.trip}
            details={shareModalData.details}
            onClose={() => setShareModalData(null)}
          />
        )}

        {/* LINE 登入彈窗 */}
        <LineLoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onLogin={handleLogin}
          isLoading={loginLoading}
        />
      </div>
    </ClientOnly>
  );
};

export default HomePage;