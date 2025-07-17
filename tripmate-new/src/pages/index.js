import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import dynamic from 'next/dynamic';

// 動態載入組件
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
// 分頁組件
const Pagination = ({ pagination, onPageChange, loading }) => {
  const { currentPage, totalPages, total, hasNextPage, hasPrevPage } = pagination;

  if (totalPages <= 1) return null;

  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  const visiblePages = getVisiblePages();

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '8px',
      margin: '32px 0',
      flexWrap: 'wrap'
    }}>
      {/* 上一頁 */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!hasPrevPage || loading}
        style={{
          padding: '8px 16px',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          background: hasPrevPage && !loading ? 'white' : '#f9fafb',
          color: hasPrevPage && !loading ? '#374151' : '#9ca3af',
          cursor: hasPrevPage && !loading ? 'pointer' : 'not-allowed',
          fontSize: '14px',
          fontWeight: '500',
          opacity: loading ? 0.6 : 1
        }}
      >
        ← 上一頁
      </button>

      {/* 頁碼 */}
      {visiblePages.map((page, index) => (
        <React.Fragment key={index}>
          {page === '...' ? (
            <span style={{
              padding: '8px 4px',
              color: '#9ca3af',
              fontSize: '14px'
            }}>
              ...
            </span>
          ) : (
            <button
              onClick={() => onPageChange(page)}
              disabled={loading}
              style={{
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                background: page === currentPage ? '#3b82f6' : 'white',
                color: page === currentPage ? 'white' : '#374151',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: page === currentPage ? '600' : '500',
                minWidth: '40px',
                opacity: loading ? 0.6 : 1
              }}
            >
              {page}
            </button>
          )}
        </React.Fragment>
      ))}

      {/* 下一頁 */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!hasNextPage || loading}
        style={{
          padding: '8px 16px',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          background: hasNextPage && !loading ? 'white' : '#f9fafb',
          color: hasNextPage && !loading ? '#374151' : '#9ca3af',
          cursor: hasNextPage && !loading ? 'pointer' : 'not-allowed',
          fontSize: '14px',
          fontWeight: '500',
          opacity: loading ? 0.6 : 1
        }}
      >
        下一頁 →
      </button>

      {/* 頁面資訊 */}
      <div style={{
        marginLeft: '16px',
        fontSize: '14px',
        color: '#64748b',
        fontWeight: '500'
      }}>
        第 {currentPage} 頁，共 {totalPages} 頁 (總計 {total} 筆)
      </div>
    </div>
  );
};
// 載入指示器組件
const LoadingIndicator = ({ message = "載入中..." }) => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '40px',
    background: 'white',
    borderRadius: '12px',
    margin: '16px 0',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
  }}>
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      color: '#3b82f6',
      fontSize: '16px',
      fontWeight: '500'
    }}>
      <div style={{
        width: '20px',
        height: '20px',
        border: '2px solid #e5e7eb',
        borderTop: '2px solid #3b82f6',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
      {message}
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  </div>
);

// LINE 登入彈窗組件
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

        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔐</div>

        <h3 style={{
          fontSize: '20px',
          fontWeight: '700',
          color: '#1f2937',
          marginBottom: '12px'
        }}>
          登入 LINE 享受完整功能
        </h3>

        <p style={{
          color: '#6b7280',
          marginBottom: '24px',
          lineHeight: '1.5'
        }}>
          登入您的 LINE 帳號即可收藏喜愛的行程，並同步您的收藏資料
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
  // 核心狀態
  const [trips, setTrips] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [areas, setAreas] = useState([]);
  const [mounted, setMounted] = useState(false);

  // 分頁狀態
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    total: 0,
    limit: 10,
    hasNextPage: false,
    hasPrevPage: false
  });

  // 搜尋狀態
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [debouncedSearchKeyword, setDebouncedSearchKeyword] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // 收藏狀態
  const [favorites, setFavorites] = useState(new Set());
  const [favoriteLoading, setFavoriteLoading] = useState({});

  // 分享狀態
  const [shareModalData, setShareModalData] = useState(null);
  const [shareLoading, setShareLoading] = useState({});

  // LIFF 狀態
  const [liffReady, setLiffReady] = useState(false);
  const [liffLoggedIn, setLiffLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [liffLoading, setLiffLoading] = useState(true);
  const [liffError, setLiffError] = useState(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // 篩選狀態
  const [filters, setFilters] = useState({
    duration_type: '',
    season: '',
    area: ''
  });

  // 新增：排序狀態
  const [sortBy, setSortBy] = useState('popularity');
  // 初始化
  useEffect(() => {
    setMounted(true);
    initializeLiff();
    loadSearchHistory();
  }, []);

  useEffect(() => {
    if (mounted) {
      initializeData();
    }
  }, [mounted, liffReady]);

  // 當分頁、篩選條件或排序改變時重新載入資料
  useEffect(() => {
    if (mounted && !isSearchMode) {
      fetchTripRankings(pagination.currentPage);
    }
  }, [mounted, filters, pagination.currentPage, sortBy]);

  // 當篩選條件或排序改變時重置到第一頁
  useEffect(() => {
    if (mounted && !isSearchMode) {
      setPagination(prev => ({ ...prev, currentPage: 1 }));
    }
  }, [filters, sortBy]);

  // Debounce 搜尋關鍵字
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchKeyword(searchKeyword);
      setIsTyping(false);
    }, 300);

    if (searchKeyword.trim()) {
      setIsTyping(true);
    }

    return () => clearTimeout(timer);
  }, [searchKeyword]);

  // 搜尋執行
  useEffect(() => {
    if (debouncedSearchKeyword.trim().length > 0) {
      performSearch(debouncedSearchKeyword.trim());
    } else if (!debouncedSearchKeyword.trim() && isSearchMode) {
      clearSearch();
    }
  }, [debouncedSearchKeyword]);

  // 搜尋歷史管理
  const loadSearchHistory = () => {
    if (typeof window !== 'undefined') {
      try {
        const history = localStorage.getItem('tripSearchHistory');
        if (history) {
          setSearchHistory(JSON.parse(history));
        }
      } catch (e) {
        console.error('載入搜尋歷史失敗:', e);
      }
    }
  };

  const saveSearchHistory = (keyword) => {
    if (typeof window !== 'undefined' && keyword.trim()) {
      try {
        const newHistory = [keyword, ...searchHistory.filter(h => h !== keyword)].slice(0, 10);
        setSearchHistory(newHistory);
        localStorage.setItem('tripSearchHistory', JSON.stringify(newHistory));
      } catch (e) {
        console.error('保存搜尋歷史失敗:', e);
      }
    }
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('tripSearchHistory');
      } catch (e) {
        console.error('清除搜尋歷史失敗:', e);
      }
    }
  };

  // LIFF 初始化
  const initializeLiff = async () => {
    if (typeof window === 'undefined') return;

    try {
      setLiffLoading(true);

      // 開發環境下跳過 LIFF 初始化
      if (process.env.NODE_ENV === 'development') {
        console.log('開發環境：跳過 LIFF 初始化');
        setLiffReady(true);
        setLiffLoading(false);
        return;
      }

      if (typeof window.liff === 'undefined') {
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
        console.warn('LIFF ID 未設定，使用訪客模式');
        setLiffReady(true);
        setLiffLoading(false);
        return;
      }

      await window.liff.init({
        liffId: liffId,
        withLoginOnExternalBrowser: true
      });

      setLiffReady(true);

      const isLoggedIn = window.liff.isLoggedIn();
      if (isLoggedIn) {
        setLiffLoggedIn(true);
        const profile = await window.liff.getProfile();
        setUserProfile(profile);
        setTimeout(() => {
          fetchUserFavorites();
        }, 100);
      }

    } catch (error) {
      console.error('LIFF 初始化失敗:', error);
      setLiffError(error.message || 'LIFF 初始化失敗');
      // 即使 LIFF 失敗也設為準備就緒，允許訪客模式
      setLiffReady(true);
    } finally {
      setLiffLoading(false);
    }
  };
  // 資料初始化
  const initializeData = async () => {
    if (!mounted) return;

    await Promise.all([
      fetchStatistics(),
      fetchAreas(),
      fetchTripRankings(1)
    ]);
  };

  const fetchStatistics = async () => {
    if (!mounted) return;

    try {
      const response = await axios.get('/api/trip-statistics');
      setStatistics(response.data);
    } catch (err) {
      console.error('獲取統計資料失敗:', err);
    }
  };

  const fetchAreas = async () => {
    if (!mounted) return;

    try {
      const response = await axios.get('/api/get-filters');
      setAreas(response.data.areas || []);
    } catch (err) {
      console.error('獲取地區失敗:', err);
    }
  };

  const fetchTripRankings = async (page = 1) => {
    if (!mounted) return;

    setLoading(true);
    try {
      const params = {
        type: 'all',
        page: page,
        limit: 10,
        sort_by: sortBy,
        ...filters
      };

      const response = await axios.get('/api/trip-rankings-enhanced', { params });

      if (response.data.success) {
        setTrips(response.data.data || []);
        setPagination(response.data.pagination || {
          currentPage: 1,
          totalPages: 0,
          total: 0,
          limit: 10,
          hasNextPage: false,
          hasPrevPage: false
        });
      } else {
        throw new Error('API 回應格式錯誤');
      }

      setError(null);
    } catch (err) {
      console.error('獲取排行榜失敗:', err);
      setError('載入排行榜失敗，請稍後再試。');
      setTrips([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserFavorites = async () => {
    if (!mounted || !liffLoggedIn || !userProfile) return;

    const userId = getCurrentUserId();
    if (!userId) return;

    try {
      const response = await axios.get('/api/user-favorites', {
        params: { line_user_id: userId },
        timeout: 10000
      });

      if (response.data.success) {
        const favIds = new Set(response.data.favorites.map(f => f.trip_id));
        setFavorites(favIds);
      }
    } catch (err) {
      console.error('獲取收藏列表失敗:', err);
    }
  };

  // 工具函數
  const getCurrentUserId = () => {
    if (liffLoggedIn && userProfile?.userId) {
      return userProfile.userId;
    }
    // 開發環境下允許使用模擬用戶 ID，但不自動登入
    if (process.env.NODE_ENV === 'development') {
      console.log('開發環境：訪客模式，未提供用戶 ID');
      return null;
    }
    return null;
  };

  const isLineLoggedIn = () => {
    return liffReady && liffLoggedIn && userProfile;
  };

  const formatDate = (dateString) => {
    if (!mounted || !dateString) return '';
    try {
      const options = { year: 'numeric', month: 'short', day: 'numeric' };
      return new Date(dateString).toLocaleDateString('zh-TW', options);
    } catch (error) {
      return dateString;
    }
  };

  // 新增：更新統計資料的函數
  const updateTripStats = async (tripId, action) => {
    try {
      await axios.post('/api/update-trip-stats', {
        trip_id: tripId,
        action: action
      });
      console.log(`統計更新成功: ${action} for trip ${tripId}`);
    } catch (error) {
      console.error('統計更新失敗:', error);
    }
  };

  // 分頁處理
  const handlePageChange = useCallback((newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages || loading) return;

    window.scrollTo({ top: 0, behavior: 'smooth' });
    setPagination(prev => ({ ...prev, currentPage: newPage }));
  }, [pagination.totalPages, loading]);

  // 搜尋功能
  const performSearch = useCallback(async (keyword) => {
    if (!keyword.trim()) {
      setIsSearchMode(false);
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    setIsSearchMode(true);

    try {
      const response = await axios.get('/api/search-trips', {
        params: {
          keyword: keyword.trim(),
          limit: 50
        },
        timeout: 8000
      });

      if (response.data?.success && response.data?.trips) {
        setSearchResults(response.data.trips);
      } else {
        setSearchResults([]);
      }

      setError(null);
      saveSearchHistory(keyword.trim());

    } catch (error) {
      console.error('搜尋失敗:', error);
      setError('搜尋失敗，請稍後再試');
      setSearchResults([]);
      saveSearchHistory(keyword.trim());
    } finally {
      setSearchLoading(false);
    }
  }, [searchHistory]);

  const handleSearchInput = (e) => {
    const value = e.target.value;
    setSearchKeyword(value);

    if (!value.trim()) {
      clearSearch();
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchKeyword.trim()) {
      if (!isSearchMode) {
        performSearch(searchKeyword.trim());
      }
    }
  };

  const clearSearch = () => {
    setSearchKeyword('');
    setDebouncedSearchKeyword('');
    setIsSearchMode(false);
    setSearchResults([]);
    setError(null);
    setIsTyping(false);
  };

  const quickSearch = (keyword) => {
    setSearchKeyword(keyword);
  };
  // 收藏功能
  const toggleFavorite = async (tripId, event) => {
    event.stopPropagation();

    // 如果未登入，提示用戶登入，但不強制
    if (!isLineLoggedIn()) {
      const shouldLogin = confirm('需要登入 LINE 才能使用收藏功能，是否要立即登入？');
      if (shouldLogin) {
        setShowLoginModal(true);
      }
      return;
    }

    const userId = getCurrentUserId();
    if (!userId) {
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

        // 更新統計：移除收藏
        await updateTripStats(tripId, 'favorite_remove');
      } else {
        await axios.post('/api/user-favorites', {
          line_user_id: userId,
          trip_id: tripId
        }, {
          timeout: 10000
        });

        setFavorites(prev => new Set([...prev, tripId]));

        // 更新統計：添加收藏
        await updateTripStats(tripId, 'favorite_add');
      }
    } catch (err) {
      console.error('收藏操作失敗:', err);
      alert('操作失敗，請稍後再試');
    } finally {
      setFavoriteLoading(prev => ({ ...prev, [tripId]: false }));
    }
  };

  // 分享功能
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

      // 更新統計：分享
      await updateTripStats(trip.trip_id, 'share');
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

  const handleTripClick = async (tripId) => {
    try {
      // 更新統計：查看
      await updateTripStats(tripId, 'view');

      const response = await axios.get(`/api/trip-detail?id=${tripId}`);
      setSelectedTrip(response.data);
    } catch (err) {
      console.error('獲取行程詳情失敗:', err);
      alert('載入行程詳情失敗');
    }
  };

  // LINE 登入功能
  const handleLogin = async () => {
    if (!liffReady) {
      alert('LINE 服務尚未準備就緒，請稍後再試');
      return;
    }

    setLoginLoading(true);

    try {
      // 開發環境模擬登入
      if (process.env.NODE_ENV === 'development') {
        console.log('開發環境：模擬 LINE 登入');
        setLiffLoggedIn(true);
        setUserProfile({
          userId: 'demo_user_123',
          displayName: '測試用戶',
          pictureUrl: null
        });
        setShowLoginModal(false);
        alert('開發環境：模擬登入成功！');
        setTimeout(() => {
          fetchUserFavorites();
        }, 100);
        return;
      }

      if (typeof window !== 'undefined' && window.liff) {
        if (!window.liff.isLoggedIn()) {
          setShowLoginModal(false);

          window.liff.login({
            redirectUri: window.location.href
          });
        } else {
          setLiffLoggedIn(true);
          const profile = await window.liff.getProfile();
          setUserProfile(profile);
          setTimeout(() => {
            fetchUserFavorites();
          }, 100);
          setShowLoginModal(false);
          alert(`歡迎，${profile.displayName}！`);
        }
      }
    } catch (error) {
      console.error('LINE 登入失敗:', error);
      alert(`登入失敗：${error.message}`);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      // 開發環境直接清除狀態
      if (process.env.NODE_ENV === 'development') {
        console.log('開發環境：模擬登出');
        setLiffLoggedIn(false);
        setUserProfile(null);
        setFavorites(new Set());
        alert('已成功登出');
        return;
      }

      if (typeof window !== 'undefined' && window.liff && window.liff.isLoggedIn()) {
        window.liff.logout();
      }

      setLiffLoggedIn(false);
      setUserProfile(null);
      setFavorites(new Set());
      alert('已成功登出');

    } catch (error) {
      console.error('登出失敗:', error);
    }
  };

  const handleFavoritesNavigation = () => {
    // 如果未登入，提示用戶登入，但不強制
    if (!isLineLoggedIn()) {
      const shouldLogin = confirm('需要登入 LINE 才能查看收藏列表，是否要立即登入？');
      if (shouldLogin) {
        setShowLoginModal(true);
      }
      return;
    }
    window.location.href = '/favorites';
  };

  if (!mounted) {
    return null;
  }

  const currentTrips = isSearchMode ? searchResults : trips;
  const currentLoading = isSearchMode ? searchLoading : loading;
  return (
    <ClientOnly>
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
                <span>⚠️ LINE 服務連接失敗，使用訪客模式</span>
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
                <span>🔄 正在初始化服務...</span>
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
                  登入 LINE
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

        {/* 搜尋功能區域 */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '16px'
          }}>
            <div style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#374151'
            }}>
              🔍 搜尋行程
            </div>
            {isSearchMode && (
              <button
                onClick={clearSearch}
                style={{
                  background: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '500'
                }}
              >
                ✖ 清除搜尋
              </button>
            )}
          </div>

          <form onSubmit={handleSearchSubmit} style={{ marginBottom: '16px' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={searchKeyword}
                onChange={handleSearchInput}
                placeholder="輸入關鍵字搜尋行程... (如：東京、台北、溫泉、美食)"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  paddingRight: isTyping ? '50px' : '16px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '16px',
                  outline: 'none',
                  transition: 'border-color 0.2s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3b82f6';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e2e8f0';
                }}
              />
              {isTyping && (
                <div style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '16px'
                }}>
                  ⏳
                </div>
              )}
            </div>
          </form>

          {/* 搜尋歷史 */}
          {searchHistory.length > 0 && !isSearchMode && (
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '8px'
              }}>
                <div style={{
                  fontSize: '14px',
                  color: '#6b7280',
                  fontWeight: '500'
                }}>
                  最近搜尋：
                </div>
                <button
                  onClick={clearSearchHistory}
                  style={{
                    background: '#fef2f2',
                    color: '#dc2626',
                    border: '1px solid #fecaca',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}
                >
                  ✖ 清除
                </button>
              </div>
              <div style={{
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap'
              }}>
                {searchHistory.slice(0, 8).map((keyword, index) => (
                  <button
                    key={index}
                    onClick={() => quickSearch(keyword)}
                    style={{
                      background: '#f8fafc',
                      color: '#374151',
                      border: '1px solid #e2e8f0',
                      padding: '6px 12px',
                      borderRadius: '16px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '500',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {keyword}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 搜尋結果統計 */}
          {isSearchMode && (
            <div style={{
              padding: '12px 16px',
              background: '#eff6ff',
              borderRadius: '8px',
              border: '1px solid #bfdbfe',
              fontSize: '14px',
              color: '#1e40af',
              fontWeight: '500'
            }}>
              {searchLoading || isTyping ? (
                '🔍 正在搜尋...'
              ) : (
                <>
                  🎯 找到 {searchResults.length} 個相關行程
                  {searchKeyword && ` (關鍵字: ${searchKeyword})`}
                  {searchResults.length === 0 && (
                    <span style={{ color: '#dc2626', marginLeft: '8px' }}>
                      - 嘗試使用不同的關鍵字
                    </span>
                  )}
                </>
              )}
            </div>
          )}
        </div>
        {/* 排序選擇器 - 只在非搜尋模式顯示 */}
        {!isSearchMode && (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '24px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              <div style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#374151'
              }}>
                📊 排序方式
              </div>
              <div style={{
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap'
              }}>
                {[
                  { key: 'popularity', label: '🔥 熱門排行', desc: '綜合熱度' },
                  { key: 'favorites', label: '❤️ 最多收藏', desc: '收藏數排序' },
                  { key: 'shares', label: '📤 最多分享', desc: '分享數排序' },
                  { key: 'views', label: '👀 最多查看', desc: '查看數排序' }
                ].map(option => (
                  <button
                    key={option.key}
                    onClick={() => setSortBy(option.key)}
                    style={{
                      padding: '8px 16px',
                      border: `2px solid ${sortBy === option.key ? '#3b82f6' : '#e2e8f0'}`,
                      background: sortBy === option.key ? '#eff6ff' : 'white',
                      color: sortBy === option.key ? '#1e40af' : '#374151',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: sortBy === option.key ? '600' : '500',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      minWidth: '100px'
                    }}
                    title={option.desc}
                    onMouseEnter={(e) => {
                      if (sortBy !== option.key) {
                        e.currentTarget.style.borderColor = '#93c5fd';
                        e.currentTarget.style.background = '#f8fafc';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (sortBy !== option.key) {
                        e.currentTarget.style.borderColor = '#e2e8f0';
                        e.currentTarget.style.background = 'white';
                      }
                    }}
                  >
                    <span style={{ marginBottom: '2px' }}>{option.label}</span>
                    <span style={{
                      fontSize: '10px',
                      opacity: 0.7,
                      color: sortBy === option.key ? '#1e40af' : '#6b7280'
                    }}>
                      {option.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 篩選面板 - 只在非搜尋模式顯示 */}
        {!isSearchMode && (
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
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
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

              <div>
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
                    width: '100%'
                  }}
                >
                  重置篩選
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 標籤切換 - 只在非搜尋模式顯示 */}
        {!isSearchMode && (
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
                  background: 'white',
                  color: '#374151',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
                onClick={() => {
                  if (tab.key === 'favorites') {
                    handleFavoritesNavigation();
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
                        background: '#60a5fa',
                        color: 'white',
                        borderRadius: '10px',
                        padding: '2px 6px',
                        fontSize: '12px'
                      }}>
                        登入查看
                      </span>
                    )}
                  </>
                )}
              </button>
            ))}
          </div>
        )}

        {/* 分頁資訊顯示 */}
        {!isSearchMode && pagination.total > 0 && (
          <div style={{
            background: 'white',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '16px',
            boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e2e8f0',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '14px',
              color: '#64748b',
              fontWeight: '500'
            }}>
              📊 正在顯示第 {((pagination.currentPage - 1) * pagination.limit) + 1} - {Math.min(pagination.currentPage * pagination.limit, pagination.total)} 筆，
              共 {pagination.total} 筆行程資料
            </div>
          </div>
        )}

        {/* 載入指示器 */}
        {currentLoading && (
          <LoadingIndicator
            message={isSearchMode ? "搜尋中..." : `載入第 ${pagination.currentPage} 頁資料中...`}
          />
        )}
        {/* 行程列表 */}
        {!currentLoading && (
          <>
            {error ? (
              <div style={{
                textAlign: 'center',
                padding: '60px 20px',
                background: '#fef2f2',
                borderRadius: '12px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                border: '1px solid #fecaca'
              }}>
                <div style={{ fontSize: '18px', marginBottom: '8px' }}>❌ {isSearchMode ? '搜尋失敗' : '載入失敗'}</div>
                <div style={{ fontSize: '14px', marginBottom: '16px' }}>{error}</div>
                <button
                  onClick={() => isSearchMode ? performSearch(searchKeyword) : fetchTripRankings(pagination.currentPage)}
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
            ) : currentTrips.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '60px 20px',
                background: 'white',
                borderRadius: '12px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>
                  {isSearchMode ? '🔍' : '📍'}
                </div>
                <div style={{ fontSize: '18px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                  {isSearchMode ? `沒有找到與「${searchKeyword}」相關的行程` : '沒有找到符合條件的行程'}
                </div>
                <div style={{ color: '#64748b', fontSize: '14px' }}>
                  {isSearchMode ? '試試其他關鍵字或檢查拼寫' : '嘗試調整篩選條件或選擇其他分類'}
                </div>
                {isSearchMode && (
                  <button
                    onClick={clearSearch}
                    style={{
                      background: '#3182ce',
                      color: 'white',
                      border: 'none',
                      padding: '12px 24px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      marginTop: '16px'
                    }}
                  >
                    🏠 瀏覽全部行程
                  </button>
                )}
              </div>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}>
                {currentTrips.map((trip, index) => (
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
                      background: isSearchMode ?
                        'linear-gradient(135deg, #10b981 0%, #059669 100%)' :
                        'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                      color: 'white',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '700',
                      fontSize: '18px',
                      flexShrink: '0'
                    }}>
                      {isSearchMode ? '🔍' : ((pagination.currentPage - 1) * pagination.limit + index + 1)}
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
                          📍 {trip.area}
                        </span>
                        <span style={{
                          color: '#64748b',
                          fontSize: '14px',
                          fontWeight: '500'
                        }}>
                          📅 {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
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
                            ⏰ {trip.duration_days}天
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
                            🌸 {trip.season}
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
                            🎯 {trip.duration_type}
                          </span>
                        )}
                        {/* 統計資料標籤 */}
                        {trip.favorite_count > 0 && (
                          <span style={{
                            background: '#fee2e2',
                            color: '#991b1b',
                            padding: '4px 10px',
                            borderRadius: '16px',
                            fontSize: '12px',
                            fontWeight: '500',
                            border: '1px solid #fecaca'
                          }}>
                            ❤️ {trip.favorite_count}
                          </span>
                        )}
                        {trip.share_count > 0 && (
                          <span style={{
                            background: '#ecfdf5',
                            color: '#065f46',
                            padding: '4px 10px',
                            borderRadius: '16px',
                            fontSize: '12px',
                            fontWeight: '500',
                            border: '1px solid #bbf7d0'
                          }}>
                            📤 {trip.share_count}
                          </span>
                        )}
                        {trip.view_count > 0 && (
                          <span style={{
                            background: '#eff6ff',
                            color: '#1e40af',
                            padding: '4px 10px',
                            borderRadius: '16px',
                            fontSize: '12px',
                            fontWeight: '500',
                            border: '1px solid #bfdbfe'
                          }}>
                            👀 {trip.view_count}
                          </span>
                        )}
                        {trip.popularity_score > 0 && sortBy === 'popularity' && (
                          <span style={{
                            background: '#fef3c7',
                            color: '#92400e',
                            padding: '4px 10px',
                            borderRadius: '16px',
                            fontSize: '12px',
                            fontWeight: '500',
                            border: '1px solid #fde68a'
                          }}>
                            🔥 {parseFloat(trip.popularity_score).toFixed(1)}
                          </span>
                        )}
                        {isSearchMode && (
                          <span style={{
                            background: '#dcfce7',
                            color: '#166534',
                            padding: '4px 10px',
                            borderRadius: '16px',
                            fontSize: '12px',
                            fontWeight: '500',
                            border: '1px solid #bbf7d0'
                          }}>
                            🔍 搜尋結果
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

                    {/* 右側按鈕區域 */}
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      alignItems: 'center',
                      flexShrink: '0',
                      minWidth: '60px'
                    }}>
                      {/* 收藏按鈕 */}
                      <button
                        onClick={(e) => toggleFavorite(trip.trip_id, e)}
                        disabled={favoriteLoading[trip.trip_id]}
                        style={{
                          background: isLineLoggedIn() ?
                            (favorites.has(trip.trip_id) ? 'rgba(239, 68, 68, 0.1)' : 'rgba(156, 163, 175, 0.1)') :
                            'rgba(59, 130, 246, 0.1)',
                          border: isLineLoggedIn() ?
                            `1px solid ${favorites.has(trip.trip_id) ? '#f87171' : '#d1d5db'}` :
                            '1px solid #93c5fd',
                          borderRadius: '50%',
                          width: '44px',
                          height: '44px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: favoriteLoading[trip.trip_id] ? 'not-allowed' : 'pointer',
                          fontSize: '18px',
                          transition: 'all 0.2s ease',
                          opacity: favoriteLoading[trip.trip_id] ? 0.7 : 1
                        }}
                        title={
                          !isLineLoggedIn() ? '點擊登入 LINE 使用收藏功能' :
                            favoriteLoading[trip.trip_id] ? '處理中...' :
                              (favorites.has(trip.trip_id) ? '取消收藏' : '加入收藏')
                        }
                        onMouseEnter={(e) => {
                          if (!favoriteLoading[trip.trip_id]) {
                            e.currentTarget.style.transform = 'scale(1.05)';
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
                          !isLineLoggedIn() ? '💙' :
                            (favorites.has(trip.trip_id) ? '❤️' : '🤍')}
                      </button>

                      {/* 分享按鈕 */}
                      <button
                        onClick={(e) => handleDetailedShare(trip, e)}
                        disabled={shareLoading[trip.trip_id]}
                        title="分享行程"
                        style={{
                          width: '44px',
                          height: '44px',
                          border: 'none',
                          borderRadius: '50%',
                          cursor: shareLoading[trip.trip_id] ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '18px',
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
              </div>
            )}
          </>
        )}

        {/* 分頁組件 - 只在非搜尋模式顯示 */}
        {!isSearchMode && (
          <Pagination
            pagination={pagination}
            onPageChange={handlePageChange}
            loading={loading}
          />
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