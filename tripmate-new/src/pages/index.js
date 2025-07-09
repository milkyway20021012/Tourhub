import React, { useState, useEffect, useCallback } from 'react';
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
  // 基本狀態
  const [trips, setTrips] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [areas, setAreas] = useState([]);
  const [mounted, setMounted] = useState(false);

  // 搜尋相關狀態 - 新增即時搜尋功能
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [debouncedSearchKeyword, setDebouncedSearchKeyword] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [allTripsCache, setAllTripsCache] = useState([]); // 緩存所有行程用於前端搜索

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
    loadSearchHistory();
  }, []);

  useEffect(() => {
    if (mounted) {
      initializeData();
    }
  }, [mounted, liffReady]);

  useEffect(() => {
    if (mounted && !isSearchMode) {
      fetchTripRankings(activeTab);
    }
  }, [mounted, activeTab, filters]);

  // Debounce 搜索關鍵字 - 用戶停止輸入 300ms 後才執行搜索
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchKeyword(searchKeyword);
      setIsTyping(false);
    }, 300); // 縮短延遲以提供更好的用戶體驗

    if (searchKeyword.trim()) {
      setIsTyping(true);
    }

    return () => clearTimeout(timer);
  }, [searchKeyword]);

  // 當 debounced 關鍵字改變時自動執行搜索
  useEffect(() => {
    if (debouncedSearchKeyword.trim().length > 0) {
      performSearch(debouncedSearchKeyword.trim());
    } else if (!debouncedSearchKeyword.trim() && isSearchMode) {
      clearSearch();
    }
  }, [debouncedSearchKeyword]);

  // 緩存所有行程數據
  useEffect(() => {
    if (mounted && !isSearchMode) {
      cacheAllTrips();
    }
  }, [mounted, trips]);

  // 載入搜尋歷史
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

  // 保存搜尋歷史
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

  // 緩存所有行程用於前端搜索
  const cacheAllTrips = async () => {
    if (allTripsCache.length > 0) return; // 已有緩存則跳過

    try {
      const response = await axios.get('/api/trip-rankings-enhanced', {
        params: {
          type: 'all',
          limit: 500 // 獲取更多數據
        },
        timeout: 15000
      });

      const data = response.data.success ? response.data.data : response.data;
      setAllTripsCache(data || []);
      console.log('緩存行程數據:', data?.length || 0);
    } catch (error) {
      console.warn('緩存行程數據失敗:', error);
    }
  };
  // LIFF 初始化
  const initializeLiff = async () => {
    if (typeof window === 'undefined') return;

    try {
      setLiffLoading(true);

      // 檢查 LIFF SDK 是否已載入
      if (typeof window.liff === 'undefined') {
        console.log('正在載入 LIFF SDK...');

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

        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
      if (!liffId) {
        throw new Error('LIFF ID 未設定，請檢查環境變數 NEXT_PUBLIC_LIFF_ID');
      }

      console.log('正在初始化 LIFF，ID:', liffId);

      await window.liff.init({
        liffId: liffId,
        withLoginOnExternalBrowser: true
      });

      console.log('LIFF 初始化成功');
      setLiffReady(true);

      const isLoggedIn = window.liff.isLoggedIn();
      console.log('LIFF 登入狀態:', isLoggedIn);

      if (isLoggedIn) {
        setLiffLoggedIn(true);

        try {
          const profile = await window.liff.getProfile();
          console.log('用戶資料:', profile);
          setUserProfile(profile);

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

  const getCurrentUserId = () => {
    if (liffLoggedIn && userProfile?.userId) {
      return userProfile.userId;
    }

    if (process.env.NODE_ENV === 'development' && !liffReady) {
      console.warn('開發環境：使用測試用戶 ID');
      return 'demo_user_123';
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
  // 優化的搜索函數 - 混合使用 API 和前端搜索
  const performSearch = useCallback(async (keyword) => {
    if (!keyword.trim()) {
      setIsSearchMode(false);
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    setIsSearchMode(true);

    try {
      console.log('開始搜尋:', keyword);

      // 同時執行 API 搜索和前端搜索
      const [apiResult, clientResult] = await Promise.allSettled([
        searchViaAPI(keyword),
        searchViaClient(keyword)
      ]);

      let finalResults = [];
      let searchSource = 'none';

      // 優先使用 API 結果
      if (apiResult.status === 'fulfilled' && apiResult.value.length > 0) {
        finalResults = apiResult.value;
        searchSource = 'api';
        console.log('使用 API 搜索結果:', finalResults.length);
      }
      // API 無結果時使用前端搜索結果
      else if (clientResult.status === 'fulfilled' && clientResult.value.length > 0) {
        finalResults = clientResult.value;
        searchSource = 'client';
        console.log('使用前端搜索結果:', finalResults.length);
      }

      setSearchResults(finalResults);
      setError(null);

      // 只有在手動搜索時才保存歷史（非即時搜索）
      if (!isTyping && finalResults.length > 0) {
        saveSearchHistory(keyword.trim());
      }

      console.log(`搜索完成 - 來源: ${searchSource}, 結果數: ${finalResults.length}`);

    } catch (error) {
      console.error('搜索失敗:', error);
      setError('搜索失敗，請稍後再試');
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, [isTyping, allTripsCache]);

  // API 搜索
  const searchViaAPI = async (keyword) => {
    try {
      const response = await axios.get('/api/search-trips', {
        params: {
          keyword: keyword.trim(),
          limit: 50
        },
        timeout: 8000 // 減少超時時間
      });

      if (response.data?.success && response.data?.trips) {
        return response.data.trips;
      }

      throw new Error('API 搜索無結果');
    } catch (error) {
      console.warn('API 搜索失敗:', error.message);
      return [];
    }
  };

  // 前端搜索 - 增強版
  const searchViaClient = async (keyword) => {
    if (!allTripsCache || allTripsCache.length === 0) {
      // 如果沒有緩存，嘗試獲取當前頁面的行程數據
      const currentTrips = trips.length > 0 ? trips : [];
      return performClientSideSearch(currentTrips, keyword);
    }

    return performClientSideSearch(allTripsCache, keyword);
  };

  // 增強的前端搜索邏輯
  const performClientSideSearch = (tripsData, keyword) => {
    if (!tripsData || tripsData.length === 0) return [];

    const searchTerm = keyword.toLowerCase().trim();
    const searchTokens = tokenizeSearchTerm(searchTerm);

    console.log('前端搜索 - 關鍵字:', searchTerm, '分詞:', searchTokens);

    const results = tripsData.filter(trip => {
      // 構建搜索文本
      const searchableFields = [
        trip.title || '',
        trip.area || '',
        trip.description || '',
        trip.season || '',
        trip.duration_type || '',
        formatDate(trip.start_date) || '',
        formatDate(trip.end_date) || ''
      ];

      const searchText = searchableFields.join(' ').toLowerCase();

      // 多種匹配策略
      return searchTokens.some(token => {
        return searchText.includes(token) ||
          searchableFields.some(field =>
            field.toLowerCase().includes(token)
          );
      }) ||
        // 完整匹配
        searchText.includes(searchTerm) ||
        // 模糊匹配（移除空格）
        searchText.replace(/\s/g, '').includes(searchTerm.replace(/\s/g, ''));
    });

    // 按相關性排序
    const sortedResults = results.sort((a, b) => {
      const aScore = calculateRelevanceScore(a, searchTerm, searchTokens);
      const bScore = calculateRelevanceScore(b, searchTerm, searchTokens);
      return bScore - aScore;
    });

    return sortedResults.slice(0, 50); // 限制結果數量
  };

  // 分詞函數
  const tokenizeSearchTerm = (searchTerm) => {
    const tokens = new Set();

    // 1. 按空格分割
    const words = searchTerm.split(/\s+/).filter(w => w.length > 0);
    words.forEach(word => tokens.add(word));

    // 2. 中文字符處理
    if (/[\u4e00-\u9fff]/.test(searchTerm)) {
      for (let i = 0; i < searchTerm.length; i++) {
        const char = searchTerm[i];
        if (/[\u4e00-\u9fff]/.test(char)) {
          tokens.add(char);

          // 雙字組合
          if (i < searchTerm.length - 1) {
            const nextChar = searchTerm[i + 1];
            if (/[\u4e00-\u9fff]/.test(nextChar)) {
              tokens.add(char + nextChar);
            }
          }
        }
      }
    }

    // 3. 英文單詞處理
    const englishMatches = searchTerm.match(/[a-zA-Z]+/g) || [];
    englishMatches.forEach(word => {
      if (word.length > 1) {
        tokens.add(word);
        // 部分匹配
        if (word.length > 3) {
          tokens.add(word.substring(0, word.length - 1));
        }
      }
    });

    return Array.from(tokens).filter(token => token.length > 0);
  };

  // 計算相關性分數
  const calculateRelevanceScore = (trip, searchTerm, tokens) => {
    let score = 0;
    const title = (trip.title || '').toLowerCase();
    const area = (trip.area || '').toLowerCase();
    const description = (trip.description || '').toLowerCase();

    // 完整匹配獲得最高分
    if (title.includes(searchTerm)) score += 10;
    if (area.includes(searchTerm)) score += 8;
    if (description.includes(searchTerm)) score += 3;

    // Token 匹配
    tokens.forEach(token => {
      if (title.includes(token)) score += 5;
      if (area.includes(token)) score += 4;
      if (description.includes(token)) score += 1;
    });

    return score;
  };

  // 修改搜索輸入處理
  const handleSearchInput = (e) => {
    const value = e.target.value;
    setSearchKeyword(value);

    // 如果輸入為空，立即清除搜索
    if (!value.trim()) {
      clearSearch();
    }
  };

  // 修改表單提交處理
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchKeyword.trim()) {
      // 立即執行搜索並保存歷史
      performSearch(searchKeyword.trim());
      saveSearchHistory(searchKeyword.trim());
    }
  };

  // 清除搜索
  const clearSearch = () => {
    setSearchKeyword('');
    setDebouncedSearchKeyword('');
    setIsSearchMode(false);
    setSearchResults([]);
    setError(null);
    setIsTyping(false);
  };

  // 快速搜索
  const quickSearch = (keyword) => {
    setSearchKeyword(keyword);
    // useEffect 會自動處理搜索
  };
  const toggleFavorite = async (tripId, event) => {
    event.stopPropagation();

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

  const handleQuickShare = async (trip, e) => {
    e.stopPropagation();

    setQuickShareLoading(prev => ({ ...prev, [trip.trip_id]: true }));

    const shareText = `🎯 推薦行程：${trip.title}\n📍 ${trip.area}\n📅 ${formatDate(trip.start_date)} - ${formatDate(trip.end_date)}\n\n✨ 透過 Tourhub 分享`;

    try {
      if (typeof window !== 'undefined' && window.liff && liffReady) {

        if (window.liff.isLoggedIn()) {
          try {
            console.log('使用 LINE 分享功能');

            await window.liff.shareTargetPicker([
              {
                type: 'text',
                text: shareText
              }
            ]);

            console.log('LINE 分享成功');

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

            if (liffShareError.message && liffShareError.message.includes('cancel')) {
              console.log('用戶取消分享');
              return;
            }
          }
        } else {
          console.log('用戶未登入 LINE，使用備用分享方式');
        }
      }

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

          if (shareError.name === 'AbortError') {
            console.log('用戶取消分享');
            return;
          }
        }
      }

      try {
        await navigator.clipboard.writeText(shareText);
        alert('行程資訊已複製到剪貼簿！您可以貼到任何地方分享');
        console.log('複製到剪貼簿成功');
      } catch (clipboardError) {
        console.error('複製到剪貼簿失敗:', clipboardError);

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

  const handleTripClick = async (tripId) => {
    try {
      const response = await axios.get(`/api/trip-detail?id=${tripId}`);
      setSelectedTrip(response.data);
    } catch (err) {
      console.error('獲取行程詳情失敗:', err);
      alert('載入行程詳情失敗');
    }
  };
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

          setShowLoginModal(false);

          window.liff.login({
            redirectUri: window.location.href
          });

          return;
        } else {
          console.log('用戶已登入，更新狀態');

          setLiffLoggedIn(true);

          try {
            const profile = await window.liff.getProfile();
            setUserProfile(profile);
            console.log('用戶資料更新成功:', profile);

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

  const handleLogout = async () => {
    try {
      if (typeof window !== 'undefined' && window.liff && window.liff.isLoggedIn()) {
        window.liff.logout();
      }

      setLiffLoggedIn(false);
      setUserProfile(null);
      setFavorites(new Set());

      console.log('登出成功');
      alert('已成功登出');

    } catch (error) {
      console.error('登出失敗:', error);
    }
  };

  const handleFavoritesNavigation = () => {
    if (!isLineLoggedIn()) {
      setShowLoginModal(true);
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

        {/* 即時搜尋功能區域 - 優化版 */}
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
              color: '#374151',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              🔍 即時搜尋行程
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

          {/* 即時搜尋輸入框 */}
          <form onSubmit={handleSearchSubmit} style={{ marginBottom: '16px' }}>
            <div style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'center'
            }}>
              <div style={{ flex: '1', position: 'relative' }}>
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={handleSearchInput}
                  placeholder="輸入關鍵字即時搜尋... (如：東京、台北、溫泉、美食)"
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
                {/* 輸入中的指示器 */}
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
              <button
                type="submit"
                disabled={searchLoading || !searchKeyword.trim()}
                style={{
                  background: (searchLoading || !searchKeyword.trim()) ? '#9ca3af' : '#3b82f6',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  cursor: (searchLoading || !searchKeyword.trim()) ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  minWidth: '120px',
                  justifyContent: 'center'
                }}
              >
                {searchLoading ? '⏳ 搜尋中...' : '📌 加入歷史'}
              </button>
            </div>
          </form>

          {/* 搜尋提示 */}
          {searchKeyword && !isSearchMode && !isTyping && (
            <div style={{
              padding: '8px 12px',
              background: '#fef3c7',
              borderRadius: '6px',
              fontSize: '14px',
              color: '#92400e',
              marginBottom: '16px'
            }}>
              💡 繼續輸入或等待 0.3 秒後自動搜尋
            </div>
          )}

          {/* 搜尋歷史 */}
          {searchHistory.length > 0 && !isSearchMode && (
            <div>
              <div style={{
                fontSize: '14px',
                color: '#6b7280',
                marginBottom: '8px',
                fontWeight: '500'
              }}>
                📚 最近搜尋：
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
                    onMouseEnter={(e) => {
                      e.target.style.background = '#3b82f6';
                      e.target.style.color = 'white';
                      e.target.style.borderColor = '#3b82f6';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = '#f8fafc';
                      e.target.style.color = '#374151';
                      e.target.style.borderColor = '#e2e8f0';
                    }}
                  >
                    {keyword}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 搜尋結果統計 - 增強版 */}
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
        )}
        {/* 行程列表 */}
        {liffLoading ? (
          <LoadingScreen message="載入中..." subMessage="正在初始化 LINE 服務" />
        ) : currentLoading ? (
          <LoadingScreen
            message={isSearchMode ? "搜尋中..." : "載入中..."}
            subMessage={isSearchMode ? `正在搜尋「${searchKeyword}」相關行程` : "正在獲取行程資料"}
          />
        ) : error ? (
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
              onClick={() => isSearchMode ? performSearch(searchKeyword) : fetchTripRankings(activeTab)}
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
                  {isSearchMode ? '🔍' : index + 1}
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
                        🎯 搜尋結果
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
                  gap: '8px',
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

            {currentTrips.length >= 20 && (
              <div style={{ textAlign: 'center', marginTop: '24px' }}>
                <button
                  onClick={() => isSearchMode ? performSearch(searchKeyword) : fetchTripRankings(activeTab)}
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