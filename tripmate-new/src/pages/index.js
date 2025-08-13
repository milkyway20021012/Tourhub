import React, { useReducer } from 'react';
import dynamic from 'next/dynamic';
import TripCard from '../components/TripCard';
import CustomToast from '../components/CustomToast';
import Pagination from '../components/Pagination';
import LoadingIndicator from '../components/LoadingIndicator';
import SearchBar from '../components/SearchBar';
import { getStatistics, getAreas, getTripRankings, getTripDetail, searchTrips, updateTripStats } from '../services/tripService';
import { getUserFavorites, addFavorite, removeFavorite } from '../services/userService';

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
  const [hasMounted, setHasMounted] = React.useState(false);

  React.useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return fallback;
  }

  return children;
};
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
          需要登入才能使用收藏功能
        </h3>

        <p style={{
          color: '#6b7280',
          marginBottom: '24px',
          lineHeight: '1.5'
        }}>
          您可以繼續瀏覽行程，但需要登入 LINE 帳號才能收藏喜愛的行程並同步您的收藏資料
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
  const initialState = {
    trips: [],
    statistics: null,
    loading: true,
    error: null,
    selectedTrip: null,
    areas: [],
    mounted: false,
    pagination: {
      currentPage: 1,
      totalPages: 0,
      total: 0,
      limit: 10,
      hasNextPage: false,
      hasPrevPage: false
    },
    searchKeyword: '',
    searchLoading: false,
    searchResults: [],
    isSearchMode: false,
    searchHistory: [],
    debouncedSearchKeyword: '',
    isTyping: false,
    searchOffset: 0,
    searchHasMore: false,
    favorites: new Set(),
    favoriteLoading: {},
    totalFavorites: 0,
    shareModalData: null,
    shareLoading: {},
    liffReady: false,
    liffLoggedIn: false,
    userProfile: null,
    liffLoading: true,
    liffError: null,
    loginLoading: false,
    showLoginModal: false,
    filters: { duration_type: '', season: '', area: '' },
    sortBy: 'popularity',
  };

  function reducer(state, action) {
    switch (action.type) {
      case 'SET_MOUNTED':
        return { ...state, mounted: action.value };
      case 'SET_LIFF_READY':
        return { ...state, liffReady: action.value };
      case 'SET_LIFF_LOGGED_IN':
        return { ...state, liffLoggedIn: action.value };
      case 'SET_USER_PROFILE':
        return { ...state, userProfile: action.value };
      case 'SET_LIFF_LOADING':
        return { ...state, liffLoading: action.value };
      case 'SET_LIFF_ERROR':
        return { ...state, liffError: action.value };
      case 'SET_LOGIN_LOADING':
        return { ...state, loginLoading: action.value };
      case 'SET_SHOW_LOGIN_MODAL':
        return { ...state, showLoginModal: action.value };
      case 'SET_TRIPS':
        return { ...state, trips: action.trips };
      case 'SET_STATISTICS':
        return { ...state, statistics: action.statistics };
      case 'SET_LOADING':
        return { ...state, loading: action.loading };
      case 'SET_ERROR':
        return { ...state, error: action.error };
      case 'SET_FAVORITES':
        return { ...state, favorites: action.favorites };
      case 'SET_FAVORITE_LOADING':
        return { ...state, favoriteLoading: { ...state.favoriteLoading, ...action.payload } };
      case 'SET_TOTAL_FAVORITES':
        return { ...state, totalFavorites: action.totalFavorites };
      case 'SET_SHARE_LOADING':
        return { ...state, shareLoading: { ...state.shareLoading, ...action.payload } };
      case 'SET_SELECTED_TRIP':
        return { ...state, selectedTrip: action.value };
      case 'SET_SEARCH_KEYWORD':
        return { ...state, searchKeyword: action.value };
      case 'SET_SEARCH_LOADING':
        return { ...state, searchLoading: action.value };
      case 'SET_SEARCH_RESULTS':
        return { ...state, searchResults: action.searchResults };
      case 'APPEND_SEARCH_RESULTS':
        return { ...state, searchResults: [...state.searchResults, ...action.searchResults] };
      case 'SET_IS_SEARCH_MODE':
        return { ...state, isSearchMode: action.value };
      case 'SET_SEARCH_HISTORY':
        return { ...state, searchHistory: action.value };
      case 'SET_DEBOUNCED_SEARCH_KEYWORD':
        return { ...state, debouncedSearchKeyword: action.value };
      case 'SET_IS_TYPING':
        return { ...state, isTyping: action.value };
      case 'SET_SEARCH_OFFSET':
        return { ...state, searchOffset: action.value };
      case 'SET_SEARCH_HAS_MORE':
        return { ...state, searchHasMore: action.value };
      case 'SET_PAGINATION':
        return { ...state, pagination: action.pagination };
      case 'SET_FILTERS':
        return { ...state, filters: action.filters };
      case 'SET_SORT_BY':
        return { ...state, sortBy: action.sortBy };
      case 'SET_AREAS':
        return { ...state, areas: action.areas };
      default:
        return state;
    }
  }

  const [state, dispatch] = useReducer(reducer, initialState);

  // 保留一些需要的本地狀態
  const searchLimit = 20;
  const loaderRef = React.useRef();

  // 分享狀態（不在 reducer 中）
  const [shareModalData, setShareModalData] = React.useState(null);
  // 帳號選單
  const [accountMenuOpen, setAccountMenuOpen] = React.useState(false);
  // 初始化
  React.useEffect(() => {
    dispatch({ type: 'SET_MOUNTED', value: true });
    initializeLiff();
    loadSearchHistory();

    // 優先從本機快取載入上次的收藏狀態（在 LIFF/登入完成前先給 UI 正確顏色）
    try {
      const lastKnownUserId = typeof window !== 'undefined' ? localStorage.getItem('last_known_user_id') : null;
      if (lastKnownUserId) {
        const cached = typeof window !== 'undefined' ? localStorage.getItem(`userFavorites_${lastKnownUserId}`) : null;
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && Array.isArray(parsed.favorites)) {
            const normalized = parsed.favorites.map(id => Number(id));
            dispatch({ type: 'SET_FAVORITES', favorites: new Set(normalized) });
            dispatch({ type: 'SET_TOTAL_FAVORITES', totalFavorites: normalized.length });
          }
        }
      }
    } catch (e) {
      console.warn('載入本機收藏快取失敗（可忽略）:', e);
    }

    // 延遲載入收藏狀態 - 等待 LIFF 初始化完成
    setTimeout(() => {
      const userId = getCurrentUserId();
      const isReallyLoggedIn = state.liffReady && state.liffLoggedIn && state.userProfile;

      if (userId && isReallyLoggedIn) {
        console.log('初始化：嘗試載入收藏狀態，用戶 ID:', userId);
        console.log('初始化：載入收藏總數');
        fetchUserFavoritesCount();
      } else {
        console.log('初始化：用戶未登入或 LIFF 未就緒，跳過收藏載入');
      }
    }, 2000);
  }, []);

  React.useEffect(() => {
    if (state.mounted) {
      initializeData();
    }
  }, [state.mounted, state.liffReady]);

  // 當用戶登入狀態改變時，載入收藏
  React.useEffect(() => {
    if (state.mounted) {
      const userId = getCurrentUserId();
      console.log('登入狀態變化檢查:', {
        mounted: state.mounted,
        liffLoggedIn: state.liffLoggedIn,
        userProfile: !!state.userProfile,
        userId,
        favoritesSize: state.favorites.size
      });

      // 只要有用戶ID且是真正的LINE登入，就載入收藏
      const isReallyLoggedIn = state.liffReady && state.liffLoggedIn && state.userProfile;
      if (userId && isReallyLoggedIn && state.favorites.size === 0) {
        console.log('登入狀態變化：載入收藏總數');
        fetchUserFavoritesCount();
      } else if (!isReallyLoggedIn) {
        // 如果用戶登出，清除收藏狀態
        console.log('用戶已登出，清除收藏狀態');
        dispatch({ type: 'SET_FAVORITES', favorites: new Set() });
      }
    }
  }, [state.liffLoggedIn, state.userProfile, state.mounted, state.liffReady]);

  // 備用檢查：確保收藏狀態載入
  React.useEffect(() => {
    if (state.mounted) {
      const timer = setTimeout(() => {
        const userId = getCurrentUserId();
        const isReallyLoggedIn = state.liffReady && state.liffLoggedIn && state.userProfile;

        // 只有在真正登入且沒有收藏數據時才載入
        if (userId && isReallyLoggedIn && state.favorites.size === 0) {
          console.log('備用檢查：載入收藏總數');
          fetchUserFavoritesCount();
        } else if (!isReallyLoggedIn) {
          console.log('備用檢查：用戶未登入，跳過');
        }
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [state.mounted, state.liffReady, state.liffLoggedIn, state.userProfile]);

  // 當分頁、篩選條件或排序改變時重新載入資料
  React.useEffect(() => {
    if (state.mounted && !state.isSearchMode) {
      fetchTripRankings(state.pagination.currentPage);
    }
  }, [state.mounted, state.filters, state.pagination.currentPage, state.sortBy]);

  // 當篩選條件或排序改變時重置到第一頁
  React.useEffect(() => {
    if (state.mounted && !state.isSearchMode) {
      dispatch({ type: 'SET_PAGINATION', pagination: { ...state.pagination, currentPage: 1 } });
    }
  }, [state.filters, state.sortBy]);

  // Debounce 搜尋關鍵字
  React.useEffect(() => {
    const timer = setTimeout(() => {
      dispatch({ type: 'SET_DEBOUNCED_SEARCH_KEYWORD', value: state.searchKeyword });
      dispatch({ type: 'SET_IS_TYPING', value: false });
    }, 300);

    if (state.searchKeyword.trim()) {
      dispatch({ type: 'SET_IS_TYPING', value: true });
    }

    return () => clearTimeout(timer);
  }, [state.searchKeyword]);

  // 搜尋執行
  React.useEffect(() => {
    if (state.debouncedSearchKeyword.trim().length > 0) {
      // 新搜尋，重設 offset
      dispatch({ type: 'SET_SEARCH_RESULTS', searchResults: [] });
      dispatch({ type: 'SET_SEARCH_OFFSET', value: 0 });
      dispatch({ type: 'SET_SEARCH_HAS_MORE', value: false });
      performSearch(state.debouncedSearchKeyword.trim(), false, 0);
    } else if (!state.debouncedSearchKeyword.trim() && state.isSearchMode) {
      clearSearch();
    }
  }, [state.debouncedSearchKeyword]);

  // infinite scroll observer
  React.useEffect(() => {
    if (!state.isSearchMode || !state.searchHasMore || state.searchLoading) return;
    const observer = new window.IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        performSearch(state.searchKeyword, true, state.searchOffset);
      }
    }, { threshold: 1 });
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => {
      if (loaderRef.current) observer.unobserve(loaderRef.current);
    };
  }, [state.isSearchMode, state.searchHasMore, state.searchLoading, state.searchKeyword, state.searchOffset]);

  // 搜尋歷史管理
  const loadSearchHistory = () => {
    if (typeof window !== 'undefined' && state.mounted) {
      try {
        const history = safeLocalStorage.getItem('tripSearchHistory');
        if (history) {
          dispatch({ type: 'SET_SEARCH_HISTORY', value: JSON.parse(history) });
        }
      } catch (e) {
        console.error('載入搜尋歷史失敗:', e);
      }
    }
  };

  const saveSearchHistory = (keyword) => {
    if (typeof window !== 'undefined' && state.mounted && keyword.trim()) {
      try {
        const newHistory = [keyword, ...state.searchHistory.filter(h => h !== keyword)].slice(0, 10);
        dispatch({ type: 'SET_SEARCH_HISTORY', value: newHistory });
        safeLocalStorage.setItem('tripSearchHistory', JSON.stringify(newHistory));
      } catch (e) {
        console.error('保存搜尋歷史失敗:', e);
      }
    }
  };

  const clearSearchHistory = () => {
    dispatch({ type: 'SET_SEARCH_HISTORY', value: [] });
    if (typeof window !== 'undefined' && state.mounted) {
      try {
        safeLocalStorage.removeItem('tripSearchHistory');
      } catch (e) {
        console.error('清除搜尋歷史失敗:', e);
      }
    }
  };

  // LIFF 初始化
  const initializeLiff = async () => {
    if (typeof window === 'undefined') return;

    try {
      dispatch({ type: 'SET_LIFF_LOADING', value: true });

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
        dispatch({ type: 'SET_LIFF_READY', value: true });
        dispatch({ type: 'SET_LIFF_LOADING', value: false });
        return;
      }

      await window.liff.init({
        liffId: liffId,
        // 不自動登入，但允許在外部瀏覽器中觸發登入流程
        withLoginOnExternalBrowser: true
      });

      dispatch({ type: 'SET_LIFF_READY', value: true });

      const isLoggedIn = window.liff.isLoggedIn();
      if (isLoggedIn) {
        dispatch({ type: 'SET_LIFF_LOGGED_IN', value: true });
        const profile = await window.liff.getProfile();
        dispatch({ type: 'SET_USER_PROFILE', value: profile });

        // LIFF 登入成功後立即載入收藏
        console.log('LIFF 登入成功，載入收藏狀態，用戶ID:', profile.userId);
        setTimeout(() => {
          console.log('LIFF 登入成功，載入收藏總數');
          fetchUserFavoritesCount();
        }, 100);
      } else {
        // 不自動登入：保留訪客模式，直到用戶主動進行需要登入的操作
        console.log('LIFF 準備完成（訪客模式）');
      }

    } catch (error) {
      console.error('LIFF 初始化失敗:', error);
      dispatch({ type: 'SET_LIFF_ERROR', value: error.message || 'LIFF 初始化失敗' });
      dispatch({ type: 'SET_LIFF_READY', value: true });
    } finally {
      dispatch({ type: 'SET_LIFF_LOADING', value: false });
    }
  };
  // 資料初始化
  const initializeData = async () => {
    if (!state.mounted) return;

    await Promise.all([
      fetchStatistics(),
      fetchAreas(),
      fetchTripRankings(1)
    ]);
  };

  const fetchStatistics = async () => {
    if (!state.mounted) return;
    // localStorage 快取
    try {
      const cache = safeLocalStorage.getItem('tripStatisticsCache');
      if (cache) {
        const { data, ts } = JSON.parse(cache);
        if (Date.now() - ts < 3600 * 1000) {
          dispatch({ type: 'SET_STATISTICS', statistics: data });
          return;
        }
      }
    } catch (e) { /* 忽略快取錯誤 */ }
    try {
      const response = await getStatistics();
      dispatch({ type: 'SET_STATISTICS', statistics: response.data });
      try {
        safeLocalStorage.setItem('tripStatisticsCache', JSON.stringify({ data: response.data, ts: Date.now() }));
      } catch (e) { }
    } catch (err) {
      console.error('獲取統計資料失敗:', err);
    }
  };

  const fetchAreas = async () => {
    if (!state.mounted) return;
    // localStorage 快取
    try {
      const cache = safeLocalStorage.getItem('tripAreasCache');
      if (cache) {
        const { data, ts } = JSON.parse(cache);
        if (Date.now() - ts < 3600 * 1000) {
          dispatch({ type: 'SET_AREAS', areas: data });
          return;
        }
      }
    } catch (e) { /* 忽略快取錯誤 */ }
    try {
      const response = await getAreas();
      dispatch({ type: 'SET_AREAS', areas: response.data.areas || [] });
      try {
        safeLocalStorage.setItem('tripAreasCache', JSON.stringify({ data: response.data.areas || [], ts: Date.now() }));
      } catch (e) { }
    } catch (err) {
      console.error('獲取地區失敗:', err);
    }
  };

  const fetchTripRankings = async (page = 1) => {
    if (!state.mounted) return;

    dispatch({ type: 'SET_LOADING', loading: true });
    try {
      const params = {
        type: 'all',
        page: page,
        limit: 10,
        sort_by: state.sortBy,
        ...state.filters
      };

      const response = await getTripRankings(params);

      if (response.data.success) {
        dispatch({ type: 'SET_TRIPS', trips: response.data.data || [] });
        dispatch({
          type: 'SET_PAGINATION', pagination: response.data.pagination || {
            currentPage: 1,
            totalPages: 0,
            total: 0,
            limit: 10,
            hasNextPage: false,
            hasPrevPage: false
          }
        });
      } else {
        throw new Error('API 回應格式錯誤');
      }

      dispatch({ type: 'SET_ERROR', error: null });
    } catch (err) {
      console.error('獲取排行榜失敗:', err);
      dispatch({ type: 'SET_ERROR', error: '載入排行榜失敗，請稍後再試。' });
      dispatch({ type: 'SET_TRIPS', trips: [] });
    } finally {
      dispatch({ type: 'SET_LOADING', loading: false });
    }
  };

  // 獲取用戶收藏總數
  const fetchUserFavoritesCount = async () => {
    const userId = getCurrentUserId();
    if (!userId) {
      console.log('fetchUserFavoritesCount: 無用戶 ID，跳過');
      return;
    }

    try {
      console.log('fetchUserFavoritesCount: 開始獲取收藏總數', { userId });
      const response = await getUserFavorites(userId);

      if (response.data.success) {
        const favoritesArr = response.data.favorites.map(f => Number(f.trip_id));
        const totalCount = favoritesArr.length;
        dispatch({ type: 'SET_TOTAL_FAVORITES', totalFavorites: totalCount });
        dispatch({ type: 'SET_FAVORITES', favorites: new Set(favoritesArr) });
        // 同步到 localStorage（持久化）
        safeLocalStorage.setItem(`userFavorites_${userId}`, JSON.stringify({ favorites: favoritesArr }));
        // 保存最後一次成功登入的 userId，供下次優先載入快取
        if (typeof window !== 'undefined') {
          try { localStorage.setItem('last_known_user_id', userId); } catch (e) { }
        }
        console.log('fetchUserFavoritesCount: 收藏總數載入成功', { totalCount });
      } else {
        console.log('fetchUserFavoritesCount: API 回應失敗', response.data);
      }
    } catch (err) {
      console.error('獲取收藏總數失敗:', err);
    }
  };



  // 安全的 localStorage 訪問函數
  const safeLocalStorage = {
    getItem: (key) => {
      if (typeof window === 'undefined' || !state.mounted) return null;
      try {
        return localStorage.getItem(key);
      } catch (e) {
        console.error('localStorage.getItem 失敗:', e);
        return null;
      }
    },
    setItem: (key, value) => {
      if (typeof window === 'undefined' || !state.mounted) return false;
      try {
        localStorage.setItem(key, value);
        return true;
      } catch (e) {
        console.error('localStorage.setItem 失敗:', e);
        return false;
      }
    },
    removeItem: (key) => {
      if (typeof window === 'undefined' || !state.mounted) return false;
      try {
        localStorage.removeItem(key);
        return true;
      } catch (e) {
        console.error('localStorage.removeItem 失敗:', e);
        return false;
      }
    }
  };

  // 工具函數
  const getCurrentUserId = () => {
    // 只返回真正的 LINE 用戶 ID，不自動創建瀏覽器 ID
    if (state.liffReady && state.liffLoggedIn && state.userProfile?.userId) {
      console.log('使用 LINE 用戶 ID:', state.userProfile.userId);
      return state.userProfile.userId;
    }

    console.log('無有效的用戶 ID');
    return null;
  };



  const isLineLoggedIn = () => {
    // 1. 真正的 LINE 登入狀態
    if (state.liffReady && state.liffLoggedIn && state.userProfile) {
      return true;
    }

    // 2. 非 LINE 環境但有瀏覽器 ID 也視為"登入"狀態
    if (typeof window !== 'undefined' && state.mounted) {
      const browserId = safeLocalStorage.getItem('browser_user_id');
      if (browserId) {
        return true;
      }
    }

    return false;
  };



  // 新增：更新統計資料的函數
  const updateTripStatsWrapper = async (tripId, action) => {
    try {
      await updateTripStats(tripId, action);
      // console.log(`統計更新成功: ${action} for trip ${tripId}`);
    } catch (error) {
      console.error('統計更新失敗:', error);
    }
  };

  // 分頁處理
  const handlePageChange = React.useCallback((newPage) => {
    if (newPage < 1 || newPage > state.pagination.totalPages || state.loading) return;

    window.scrollTo({ top: 0, behavior: 'smooth' });
    dispatch({ type: 'SET_PAGINATION', pagination: { ...state.pagination, currentPage: newPage } });
  }, [state.pagination.totalPages, state.loading]);

  // 搜尋功能
  const performSearch = React.useCallback(async (keyword, append = false, offset = 0) => {
    if (!keyword.trim()) {
      dispatch({ type: 'SET_IS_SEARCH_MODE', value: false });
      dispatch({ type: 'SET_SEARCH_RESULTS', searchResults: [] });
      dispatch({ type: 'SET_SEARCH_OFFSET', value: 0 });
      dispatch({ type: 'SET_SEARCH_HAS_MORE', value: false });
      return;
    }
    dispatch({ type: 'SET_SEARCH_LOADING', value: true });
    dispatch({ type: 'SET_IS_SEARCH_MODE', value: true });
    try {
      const response = await searchTrips({ keyword: keyword.trim(), limit: searchLimit, offset });
      if (response.data?.success && response.data?.trips) {
        const newResults = append ? [...state.searchResults, ...response.data.trips] : response.data.trips;
        dispatch({ type: 'SET_SEARCH_RESULTS', searchResults: newResults });
        dispatch({ type: 'SET_SEARCH_HAS_MORE', value: response.data.pagination?.hasMore || false });
        dispatch({ type: 'SET_SEARCH_OFFSET', value: offset + response.data.trips.length });
      } else {
        dispatch({ type: 'SET_SEARCH_RESULTS', searchResults: [] });
        dispatch({ type: 'SET_SEARCH_HAS_MORE', value: false });
        dispatch({ type: 'SET_SEARCH_OFFSET', value: 0 });
      }
      dispatch({ type: 'SET_ERROR', error: null });
      saveSearchHistory(keyword.trim());
    } catch (error) {
      console.error('搜尋失敗:', error);
      dispatch({ type: 'SET_ERROR', error: '搜尋失敗，請稍後再試' });
      dispatch({ type: 'SET_SEARCH_RESULTS', searchResults: [] });
      dispatch({ type: 'SET_SEARCH_HAS_MORE', value: false });
      dispatch({ type: 'SET_SEARCH_OFFSET', value: 0 });
      saveSearchHistory(keyword.trim());
    } finally {
      dispatch({ type: 'SET_SEARCH_LOADING', value: false });
    }
  }, []);

  const handleSearchInput = (e) => {
    const value = e.target.value;
    dispatch({ type: 'SET_SEARCH_KEYWORD', value });

    if (!value.trim()) {
      clearSearch();
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (state.searchKeyword.trim()) {
      if (!state.isSearchMode) {
        performSearch(state.searchKeyword.trim());
      }
    }
  };

  const clearSearch = () => {
    dispatch({ type: 'SET_SEARCH_KEYWORD', value: '' });
    dispatch({ type: 'SET_DEBOUNCED_SEARCH_KEYWORD', value: '' });
    dispatch({ type: 'SET_IS_SEARCH_MODE', value: false });
    dispatch({ type: 'SET_SEARCH_RESULTS', searchResults: [] });
    dispatch({ type: 'SET_SEARCH_OFFSET', value: 0 });
    dispatch({ type: 'SET_SEARCH_HAS_MORE', value: false });
    dispatch({ type: 'SET_ERROR', error: null });
    dispatch({ type: 'SET_IS_TYPING', value: false });
  };

  const quickSearch = (keyword) => {
    dispatch({ type: 'SET_SEARCH_KEYWORD', value: keyword });
  };
  // 收藏功能
  const updateFavoriteCount = (tripId, delta) => {
    const normalizeId = Number(tripId);
    dispatch({ type: 'SET_TRIPS', trips: state.trips.map(trip => trip.trip_id === normalizeId ? { ...trip, favorite_count: Math.max(0, (trip.favorite_count || 0) + delta) } : trip) });
    dispatch({ type: 'SET_SEARCH_RESULTS', searchResults: state.searchResults.map(trip => trip.trip_id === normalizeId ? { ...trip, favorite_count: Math.max(0, (trip.favorite_count || 0) + delta) } : trip) });
  };
  const toggleFavorite = async (tripId, event) => {
    event.stopPropagation();
    if (state.favoriteLoading[tripId]) return;

    // 檢查是否真正登入 LINE（不包括瀏覽器 ID）
    const isReallyLoggedIn = state.liffReady && state.liffLoggedIn && state.userProfile;
    if (!isReallyLoggedIn) {
      // 使用更友好的提示框
      dispatch({ type: 'SET_SHOW_LOGIN_MODAL', value: true });
      return;
    }
    const userId = getCurrentUserId();
    if (!userId) {
      alert('無法獲取用戶資訊，請重新登入');
      return;
    }

    dispatch({ type: 'SET_FAVORITE_LOADING', payload: { [tripId]: true } });

    try {
      // 判斷當前是否已收藏
      const isFavorited = state.favorites.has(Number(tripId));
      if (!isFavorited) {
        const response = await addFavorite(userId, tripId);
        if (response.data.success) {
          await updateTripStatsWrapper(tripId, 'favorite_add');
          updateFavoriteCount(tripId, 1);
          const next = new Set(state.favorites);
          next.add(Number(tripId));
          dispatch({ type: 'SET_FAVORITES', favorites: next });
          dispatch({ type: 'SET_TOTAL_FAVORITES', totalFavorites: state.totalFavorites + 1 });
          // 持久化到 localStorage
          safeLocalStorage.setItem(`userFavorites_${userId}`, JSON.stringify({ favorites: Array.from(next) }));
          showToast('收藏成功', 'success');
        } else {
          throw new Error(response.data.message || '收藏失敗');
        }
      } else {
        // 已收藏則移除
        const response = await removeFavorite(userId, tripId);
        if (response.data.success) {
          await updateTripStatsWrapper(tripId, 'favorite_remove');
          updateFavoriteCount(tripId, -1);
          const next = new Set(state.favorites);
          next.delete(Number(tripId));
          dispatch({ type: 'SET_FAVORITES', favorites: next });
          dispatch({ type: 'SET_TOTAL_FAVORITES', totalFavorites: Math.max(0, state.totalFavorites - 1) });
          // 更新 localStorage
          safeLocalStorage.setItem(`userFavorites_${userId}`, JSON.stringify({ favorites: Array.from(next) }));
          showToast('已取消收藏', 'info');
        } else {
          throw new Error(response.data.message || '取消收藏失敗');
        }
      }
    } catch (err) {
      console.error('收藏操作失敗:', err);
      showToast('操作失敗，請稍後再試', 'error');
    } finally {
      dispatch({ type: 'SET_FAVORITE_LOADING', payload: { [tripId]: false } });
    }
  };

  // 分享功能
  const handleDetailedShare = async (trip, e) => {
    e.stopPropagation();

    dispatch({ type: 'SET_SHARE_LOADING', payload: { [trip.trip_id]: true } });

    try {
      const response = await getTripDetail(trip.trip_id);

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
      await updateTripStatsWrapper(trip.trip_id, 'share');
    } catch (error) {
      console.error('獲取行程詳情失敗:', error);
      setShareModalData({
        trip: trip,
        details: []
      });
    } finally {
      dispatch({ type: 'SET_SHARE_LOADING', payload: { [trip.trip_id]: false } });
    }
  };

  const handleTripClick = async (tripId) => {
    try {
      // 更新統計：查看
      await updateTripStatsWrapper(tripId, 'view');

      const response = await getTripDetail(tripId);
      dispatch({ type: 'SET_SELECTED_TRIP', value: response.data });
    } catch (err) {
      console.error('獲取行程詳情失敗:', err);
      alert('載入行程詳情失敗');
    }
  };

  // LINE 登入功能
  const handleLogin = async () => {
    if (!state.liffReady) {
      alert('LINE 服務尚未準備就緒，請稍後再試');
      return;
    }

    dispatch({ type: 'SET_LOGIN_LOADING', value: true });

    try {

      if (typeof window !== 'undefined' && window.liff) {
        try {
          // 優先關閉登入提示
          dispatch({ type: 'SET_SHOW_LOGIN_MODAL', value: false });

          if (!window.liff.isLoggedIn()) {
            window.liff.login({ redirectUri: window.location.href });
            return; // 之後會重導
          }

          dispatch({ type: 'SET_LIFF_LOGGED_IN', value: true });
          const profile = await window.liff.getProfile();
          dispatch({ type: 'SET_USER_PROFILE', value: profile });
          setTimeout(() => {
            fetchUserFavoritesCount();
          }, 100);
          dispatch({ type: 'SET_SHOW_LOGIN_MODAL', value: false });
          alert(`歡迎，${profile.displayName}！`);
        } catch (e) {
          console.error('LIFF 登入流程出錯:', e);
          alert('登入啟動失敗，請重試');
        }
      }
    } catch (error) {
      console.error('LINE 登入失敗:', error);
      alert(`登入失敗：${error.message}`);
    } finally {
      dispatch({ type: 'SET_LOGIN_LOADING', value: false });
    }
  };

  const handleLogout = async () => {
    try {
      console.log('開始登出流程');

      // 獲取當前用戶ID以清除緩存
      const userId = getCurrentUserId();

      // 清除收藏緩存
      if (userId) {
        try {
          safeLocalStorage.removeItem(`userFavorites_${userId}`);
          console.log('已清除收藏緩存');
        } catch (e) {
          console.error('清除收藏緩存失敗:', e);
        }
      }

      // 清除瀏覽器用戶ID（如果存在）
      try {
        safeLocalStorage.removeItem('browser_user_id');
        console.log('已清除瀏覽器用戶ID');
      } catch (e) {
        console.error('清除瀏覽器用戶ID失敗:', e);
      }

      // 開發環境或生產環境都執行相同的清除邏輯
      if (typeof window !== 'undefined' && window.liff && window.liff.isLoggedIn()) {
        console.log('執行 LIFF 登出');
        window.liff.logout();
      }

      // 清除所有相關狀態
      dispatch({ type: 'SET_LIFF_LOGGED_IN', value: false });
      dispatch({ type: 'SET_USER_PROFILE', value: null });
      dispatch({ type: 'SET_FAVORITES', favorites: new Set() });

      console.log('登出完成');
      alert('已成功登出');

    } catch (error) {
      console.error('登出失敗:', error);
      alert('登出失敗，請重新整理頁面');
    }
  };

  const handleFavoritesNavigation = () => {
    // 檢查是否真正登入 LINE（不包括瀏覽器 ID）
    const isReallyLoggedIn = state.liffReady && state.liffLoggedIn && state.userProfile;
    if (!isReallyLoggedIn) {
      // 使用更友好的提示框
      dispatch({ type: 'SET_SHOW_LOGIN_MODAL', value: true });
      return;
    }
    // 修正導航到正確的收藏頁面
    window.location.href = '/favorites';
  };

  // Toast 功能
  const [toastQueue, setToastQueue] = React.useState([]);
  const [currentToast, setCurrentToast] = React.useState(null);

  const showToast = (msg, type = 'info') => {
    const id = Date.now() + Math.random();
    setToastQueue(q => [...q, { message: msg, type, id }]);
  };

  React.useEffect(() => {
    if (!currentToast && toastQueue.length > 0) {
      setCurrentToast(toastQueue[0]);
      const timer = setTimeout(() => {
        setCurrentToast(null);
        setToastQueue(q => q.slice(1));
      }, 2000); // 2秒後自動隱藏
      return () => { clearTimeout(timer); };
    }
  }, [toastQueue, currentToast]);

  if (!state.mounted) {
    return null;
  }

  // 開發環境調試信息
  if (process.env.NODE_ENV === 'development') {
    console.log('HomePage 渲染狀態:', {
      mounted: state.mounted,
      liffReady: state.liffReady,
      liffLoggedIn: state.liffLoggedIn,
      userProfile: state.userProfile,
      favoritesSize: state.favorites.size,
      favoritesList: Array.from(state.favorites),
      isLineLoggedIn: isLineLoggedIn(),
      currentUserId: getCurrentUserId(),
      browserUserId: typeof window !== 'undefined' && state.mounted ? safeLocalStorage.getItem('browser_user_id') : null
    });
  }

  const currentTrips = state.isSearchMode ? state.searchResults : state.trips;
  const currentLoading = state.isSearchMode ? state.searchLoading : state.loading;
  return (
    <ClientOnly>
      {/* 開發環境調試面板 */}
      {process.env.NODE_ENV === 'development' && state.mounted && (
        <div style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '10px',
          borderRadius: '8px',
          fontSize: '12px',
          zIndex: 9999,
          maxWidth: '300px'
        }}>
          <div><strong>調試信息</strong></div>
          <div>用戶ID: {getCurrentUserId()}</div>
          <div>登入狀態: {isLineLoggedIn() ? '是' : '否'}</div>
          <div>收藏數量: {state.favorites.size}</div>
          <div>收藏列表: {Array.from(state.favorites).join(', ') || '無'}</div>
          <div>LIFF狀態: {state.liffReady ? '就緒' : '未就緒'}</div>
          <div>收藏載入中: {favoritesLoading ? '是' : '否'}</div>

          <div style={{ marginTop: '5px', display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                const userId = getCurrentUserId();
                if (userId) {
                  console.log('手動重新載入收藏總數');
                  fetchUserFavoritesCount();
                }
              }}
              style={{ padding: '2px 5px', fontSize: '10px' }}
            >
              重新載入收藏
            </button>
            <button
              onClick={() => {
                const userId = getCurrentUserId();
                if (userId) {
                  console.log('清除收藏緩存');
                  safeLocalStorage.removeItem(`userFavorites_${userId}`);
                  dispatch({ type: 'SET_FAVORITES', favorites: new Set() });
                }
              }}
              style={{ padding: '2px 5px', fontSize: '10px' }}
            >
              清除緩存
            </button>
            <button
              onClick={() => {
                const userId = getCurrentUserId();
                if (userId) {
                  const cached = safeLocalStorage.getItem(`userFavorites_${userId}`);
                  console.log('緩存信息:', cached ? JSON.parse(cached) : '無緩存');
                  alert(`緩存信息已輸出到控制台`);
                }
              }}
              style={{ padding: '2px 5px', fontSize: '10px' }}
            >
              檢查緩存
            </button>
          </div>
        </div>
      )}

      <div className="main" style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: typeof window !== 'undefined' && window.innerWidth <= 768 ? '12px' : '20px',
        minHeight: '100vh',
        background: '#f8fafc'
      }}>
        {/* 標題區域 */}
        <div style={{
          textAlign: 'center',
          marginBottom: typeof window !== 'undefined' && window.innerWidth <= 768 ? '24px' : '32px',
          padding: typeof window !== 'undefined' && window.innerWidth <= 768 ? '24px 16px' : '40px 32px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: typeof window !== 'undefined' && window.innerWidth <= 768 ? '16px' : '20px',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }}>
          {/* 背景裝飾 */}
          <div style={{
            position: 'absolute',
            top: '-50%',
            left: '-50%',
            width: '200%',
            height: '200%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
            animation: 'float 6s ease-in-out infinite'
          }} />

          {/* 排行榜圖標和標題 */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{
              fontSize: typeof window !== 'undefined' && window.innerWidth <= 768 ? '36px' : '48px',
              marginBottom: typeof window !== 'undefined' && window.innerWidth <= 768 ? '12px' : '16px',
              display: 'inline-block',
              animation: 'bounce 2s infinite'
            }}>
              🏆
            </div>
            <h1 style={{
              margin: '0 0 12px 0',
              fontSize: typeof window !== 'undefined' && window.innerWidth <= 768 ? '24px' : '36px',
              fontWeight: '800',
              letterSpacing: '-0.025em',
              textShadow: '0 2px 4px rgba(0,0,0,0.1)',
              lineHeight: '1.2'
            }}>
              Tourhub 行程排行榜
            </h1>
            <p style={{
              margin: typeof window !== 'undefined' && window.innerWidth <= 768 ? '0 0 20px 0' : '0 0 32px 0',
              fontSize: typeof window !== 'undefined' && window.innerWidth <= 768 ? '14px' : '16px',
              opacity: '0.9',
              fontWeight: '500',
              letterSpacing: '0.025em',
              lineHeight: '1.4'
            }}>
              探索最受歡迎的旅遊行程，發現您的下一個冒險目的地
            </p>
          </div>

          {/* 用戶資訊 */}
          <div style={{ marginBottom: '16px', color: 'white', textAlign: 'center' }}>
            {state.liffError ? (
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
            ) : state.liffLoading ? (
              <div>
              </div>
            ) : (state.liffReady && state.liffLoggedIn && state.userProfile) ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span>👋 歡迎，{state.userProfile?.displayName || '用戶'}</span>
                {state.userProfile?.pictureUrl && (
                  <img
                    src={state.userProfile.pictureUrl}
                    alt="頭像"
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      verticalAlign: 'middle'
                    }}
                  />
                )}

                {/* 登出按鈕（取代頂部我的收藏） */}
                <button
                  onClick={handleLogout}
                  style={{
                    background: 'rgba(255, 255, 255, 0.15)',
                    borderRadius: '20px',
                    padding: '8px 16px',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <span>登出</span>
                </button>


              </div>
            ) : (
              <div>
                <span>👤 訪客模式</span>
              </div>
            )}
          </div>


        </div>

        {/* 搜尋功能區域 */}
        <SearchBar
          searchKeyword={state.searchKeyword}
          onInput={handleSearchInput}
          onSubmit={handleSearchSubmit}
          isTyping={state.isTyping}
          isSearchMode={state.isSearchMode}
          onClear={clearSearch}
          searchHistory={state.searchHistory}
          onQuickSearch={quickSearch}
          onClearHistory={clearSearchHistory}
        />

        {/* 排序選擇器 - 只在非搜尋模式顯示 */}
        {!state.isSearchMode && (
          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: typeof window !== 'undefined' && window.innerWidth <= 768 ? '16px' : '20px',
            padding: typeof window !== 'undefined' && window.innerWidth <= 768 ? '20px' : '28px',
            marginBottom: typeof window !== 'undefined' && window.innerWidth <= 768 ? '24px' : '32px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e2e8f0',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* 背景裝飾 */}
            <div style={{
              position: 'absolute',
              top: '-50%',
              right: '-50%',
              width: '100%',
              height: '100%',
              background: 'radial-gradient(circle, rgba(59, 130, 246, 0.05) 0%, transparent 70%)',
              pointerEvents: 'none'
            }} />

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '20px',
              position: 'relative',
              zIndex: 1
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{
                  fontSize: '24px',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  borderRadius: '12px',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  📊
                </div>
                <div>
                  <div style={{
                    fontSize: typeof window !== 'undefined' && window.innerWidth <= 768 ? '18px' : '20px',
                    fontWeight: '700',
                    color: '#1e293b',
                    marginBottom: '4px'
                  }}>
                    排序方式
                  </div>
                  <div style={{
                    fontSize: typeof window !== 'undefined' && window.innerWidth <= 768 ? '13px' : '14px',
                    color: '#64748b',
                    fontWeight: '500'
                  }}>
                    選擇您想要的排序標準
                  </div>
                </div>
              </div>

              <div style={{
                display: 'flex',
                gap: typeof window !== 'undefined' && window.innerWidth <= 768 ? '8px' : '12px',
                flexWrap: 'nowrap',
                overflowX: 'auto',
                WebkitOverflowScrolling: 'touch',
                width: '100%',
                paddingBottom: '4px',
                scrollbarWidth: 'none',
                maxWidth: typeof window !== 'undefined' && window.innerWidth <= 768 ? '100%' : '600px'
              }}>
                <style>{`
                  ::-webkit-scrollbar { display: none; }
                `}</style>
                {[
                  { key: 'favorites', label: '最多收藏', desc: '收藏數排序', icon: '❤️', color: '#ef4444' },
                  { key: 'shares', label: '最多分享', desc: '分享數排序', icon: '📤', color: '#10b981' },
                  { key: 'views', label: '最多查看', desc: '查看數排序', icon: '👁️', color: '#3b82f6' }
                ].map(option => (
                  <button
                    key={option.key}
                    onClick={() => dispatch({ type: 'SET_SORT_BY', sortBy: option.key })}
                    style={{
                      padding: typeof window !== 'undefined' && window.innerWidth <= 768 ? '12px 16px' : '16px 20px',
                      border: `2px solid ${state.sortBy === option.key ? option.color : '#e2e8f0'}`,
                      background: state.sortBy === option.key
                        ? `linear-gradient(135deg, ${option.color}15 0%, ${option.color}25 100%)`
                        : 'white',
                      color: state.sortBy === option.key ? option.color : '#374151',
                      borderRadius: typeof window !== 'undefined' && window.innerWidth <= 768 ? '12px' : '16px',
                      cursor: 'pointer',
                      fontSize: typeof window !== 'undefined' && window.innerWidth <= 768 ? '12px' : '14px',
                      fontWeight: state.sortBy === option.key ? '700' : '600',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      minWidth: typeof window !== 'undefined' && window.innerWidth <= 768 ? '90px' : '120px',
                      boxShadow: state.sortBy === option.key
                        ? `0 4px 12px ${option.color}30`
                        : '0 2px 4px rgba(0, 0, 0, 0.05)',
                      transform: state.sortBy === option.key ? 'translateY(-2px)' : 'translateY(0)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    title={option.desc}
                    onMouseEnter={(e) => {
                      if (state.sortBy !== option.key) {
                        e.currentTarget.style.borderColor = option.color + '80';
                        e.currentTarget.style.background = option.color + '10';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = `0 4px 8px ${option.color}20`;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (state.sortBy !== option.key) {
                        e.currentTarget.style.borderColor = '#e2e8f0';
                        e.currentTarget.style.background = 'white';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
                      }
                    }}
                  >
                    <div style={{
                      fontSize: typeof window !== 'undefined' && window.innerWidth <= 768 ? '16px' : '20px',
                      marginBottom: typeof window !== 'undefined' && window.innerWidth <= 768 ? '6px' : '8px',
                      filter: state.sortBy === option.key ? 'none' : 'grayscale(0.3)'
                    }}>
                      {option.icon}
                    </div>
                    <span style={{
                      marginBottom: typeof window !== 'undefined' && window.innerWidth <= 768 ? '2px' : '4px',
                      textAlign: 'center',
                      fontSize: typeof window !== 'undefined' && window.innerWidth <= 768 ? '11px' : '14px'
                    }}>
                      {option.label}
                    </span>
                    {typeof window !== 'undefined' && window.innerWidth > 768 && (
                      <span style={{
                        fontSize: '11px',
                        opacity: 0.8,
                        color: state.sortBy === option.key ? option.color : '#6b7280',
                        textAlign: 'center',
                        letterSpacing: '0.25px'
                      }}>
                        {option.desc}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 篩選面板 - 只在非搜尋模式顯示 */}
        {!state.isSearchMode && (
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
                  value={state.filters.area}
                  onChange={(e) => dispatch({ type: 'SET_FILTERS', filters: { ...state.filters, area: e.target.value } })}
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
                  {state.areas.map((area, index) => (
                    <option key={index} value={area}>{area}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontWeight: '600', color: '#374151', fontSize: '14px', display: 'block', marginBottom: '8px' }}>
                  行程長度
                </label>
                <select
                  value={state.filters.duration_type}
                  onChange={(e) => dispatch({ type: 'SET_FILTERS', filters: { ...state.filters, duration_type: e.target.value } })}
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
                  value={state.filters.season}
                  onChange={(e) => dispatch({ type: 'SET_FILTERS', filters: { ...state.filters, season: e.target.value } })}
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
                  onClick={() => dispatch({ type: 'SET_FILTERS', filters: { duration_type: '', season: '', area: '' } })}
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
        {!state.isSearchMode && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '24px',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
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
                    fontWeight: '500',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    minHeight: '44px'
                  }}
                  onClick={() => {
                    if (tab.key === 'favorites') {
                      handleFavoritesNavigation();
                    }
                  }}
                >
                  <span>{tab.label}</span>
                  {tab.key === 'favorites' && (
                    <span
                      style={{
                        background: '#9ca3af',
                        color: 'white',
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: 700
                      }}
                    >
                      {(state.liffReady && state.liffLoggedIn && state.userProfile) ? (state.favorites.size || 0) : 0}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* 常駐登入/帳號按鈕 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {(state.liffReady && state.liffLoggedIn && state.userProfile) ? (
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setAccountMenuOpen(v => !v)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '8px',
                      border: '1px solid #d1d5db', background: 'white', color: '#374151',
                      borderRadius: '9999px', padding: '6px 10px', cursor: 'pointer'
                    }}
                  >
                    {state.userProfile?.pictureUrl && (
                      <img src={state.userProfile.pictureUrl} alt="頭像" style={{ width: 24, height: 24, borderRadius: '50%' }} />
                    )}
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{state.userProfile?.displayName || '我的帳號'}</span>
                  </button>
                  {accountMenuOpen && (
                    <div style={{ position: 'absolute', right: 0, marginTop: 6, background: 'white', border: '1px solid #e5e7eb', borderRadius: 8, boxShadow: '0 8px 16px rgba(0,0,0,0.08)', minWidth: 160, zIndex: 10 }}>
                      <div style={{ padding: '10px 12px', fontSize: 12, color: '#6b7280' }}>已登入</div>
                      <button onClick={handleLogout} style={{ width: '100%', textAlign: 'left', padding: '10px 12px', background: 'white', border: 'none', cursor: 'pointer' }}>登出</button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={handleLogin}
                  style={{ border: '1px solid #d1d5db', background: 'white', color: '#374151', borderRadius: '8px', padding: '10px 14px', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
                >
                  登入 LINE
                </button>
              )}
            </div>
          </div>
        )}

        {/* 分頁資訊顯示 */}
        {!state.isSearchMode && state.pagination.total > 0 && (
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
              顯示第 {((state.pagination.currentPage - 1) * state.pagination.limit) + 1} - {Math.min(state.pagination.currentPage * state.pagination.limit, state.pagination.total)} 筆，
              共 {state.pagination.total} 筆行程資料
            </div>
          </div>
        )}

        {/* 載入指示器 */}
        {currentLoading && (
          <LoadingIndicator
            message={state.isSearchMode ? "搜尋中..." : `載入第 ${state.pagination.currentPage} 頁資料中...`}
          />
        )}
        {/* 行程列表 */}
        {!currentLoading && (
          <>
            {state.error ? (
              <div style={{
                textAlign: 'center',
                padding: '60px 20px',
                background: '#fef2f2',
                borderRadius: '12px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                border: '1px solid #fecaca'
              }}>
                <div style={{ fontSize: '18px', marginBottom: '8px' }}>❌ {isSearchMode ? '搜尋失敗' : '載入失敗'}</div>
                <div style={{ fontSize: '14px', marginBottom: '16px' }}>{state.error}</div>
                <button
                  onClick={() => state.isSearchMode ? performSearch(state.searchKeyword) : fetchTripRankings(state.pagination.currentPage)}
                  style={{
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  重試
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
                  {state.isSearchMode ? '🔍' : '📍'}
                </div>
                <div style={{ fontSize: '18px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                  {state.isSearchMode ? `沒有找到與「${state.searchKeyword}」相關的行程` : '沒有找到符合條件的行程'}
                </div>
                <div style={{ color: '#64748b', fontSize: '14px' }}>
                  {state.isSearchMode ? '試試其他關鍵字或檢查拼寫' : '嘗試調整篩選條件或選擇其他分類'}
                </div>
                {state.isSearchMode && (
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
                    瀏覽全部行程
                  </button>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {currentTrips.map((trip, index) => (
                  <TripCard
                    key={trip.trip_id}
                    trip={{ ...trip, rank: state.isSearchMode ? '🔍' : ((state.pagination.currentPage - 1) * state.pagination.limit + index + 1) }}
                    favoriteLoading={state.favoriteLoading[trip.trip_id]}
                    onFavorite={e => toggleFavorite(trip.trip_id, e)}
                    onShare={e => handleDetailedShare(trip, e)}
                    isLineLoggedIn={state.liffReady && state.liffLoggedIn && state.userProfile}
                    shareLoading={state.shareLoading[trip.trip_id]}
                    onClick={() => handleTripClick(trip.trip_id)}
                    isFavorited={state.favorites.has(trip.trip_id)}
                  />
                ))}
                {/* infinite scroll 載入更多 */}
                {state.isSearchMode && (
                  <div ref={loaderRef} style={{ minHeight: '32px', textAlign: 'center', margin: '16px 0' }}>
                    {state.searchLoading ? '載入中...' : (state.searchHasMore ? '繼續下滑載入更多...' : '— 沒有更多結果 —')}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* 分頁組件 - 只在非搜尋模式顯示 */}
        {!state.isSearchMode && (
          <Pagination
            pagination={state.pagination}
            onPageChange={handlePageChange}
            loading={state.loading}
          />
        )}

        {/* 行程詳情彈窗 */}
        {state.selectedTrip && (
          <TripDetail
            trip={state.selectedTrip.trip}
            details={state.selectedTrip.details}
            participants={state.selectedTrip.participants}
            onClose={() => dispatch({ type: 'SET_SELECTED_TRIP', payload: null })}
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
          isOpen={state.showLoginModal}
          onClose={() => dispatch({ type: 'SET_SHOW_LOGIN_MODAL', value: false })}
          onLogin={handleLogin}
          isLoading={state.loginLoading}
        />

        {/* Toast 提示 */}
        {currentToast && (
          <CustomToast
            message={currentToast.message}
            type={currentToast.type}
            onClose={() => {
              setCurrentToast(null);
              setToastQueue(q => q.slice(1));
            }}
          />
        )}

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
    </ClientOnly>
  );
};

export default HomePage;