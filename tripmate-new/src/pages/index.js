import React, { useReducer } from 'react';
import dynamic from 'next/dynamic';
import api from '../utils/api';
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
// Toast 元件（支援多類型與佇列）
const Toast = ({ message, type = 'info', onClose }) => {
  // 顏色對應
  const typeMap = {
    success: { bg: '#22c55e', icon: '✅' },
    error: { bg: '#ef4444', icon: '❌' },
    warning: { bg: '#f59e42', icon: '⚠️' },
    info: { bg: '#323232', icon: '🔔' }
  };
  const { bg, icon } = typeMap[type] || typeMap.info;
  // 保證 5 秒內自動消失
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);
  return (
    <div style={{
      position: 'fixed',
      bottom: '40px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: bg,
      color: 'white',
      padding: '14px 32px',
      borderRadius: '24px',
      fontSize: '16px',
      fontWeight: '500',
      boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
      zIndex: 9999,
      opacity: 0.95,
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      animation: 'fadeInUp 0.3s',
      minWidth: '220px',
      maxWidth: '90vw',
      wordBreak: 'break-all',
    }}>
      <span>{icon}</span>
      <span>{message}</span>
      <button onClick={onClose} style={{
        background: 'none',
        border: 'none',
        color: 'white',
        fontSize: '18px',
        marginLeft: '12px',
        cursor: 'pointer',
        opacity: 0.7
      }}>×</button>
      <style jsx>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px) translateX(-50%); }
          to { opacity: 0.95; transform: translateY(0) translateX(-50%); }
        }
      `}</style>
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

  // 分頁狀態
  const [pagination, setPagination] = React.useState({
    currentPage: 1,
    totalPages: 0,
    total: 0,
    limit: 10,
    hasNextPage: false,
    hasPrevPage: false
  });

  // 搜尋狀態
  const [searchKeyword, setSearchKeyword] = React.useState('');
  const [searchLoading, setSearchLoading] = React.useState(false);
  const [searchResults, setSearchResults] = React.useState([]);
  const [isSearchMode, setIsSearchMode] = React.useState(false);
  const [searchHistory, setSearchHistory] = React.useState([]);
  const [debouncedSearchKeyword, setDebouncedSearchKeyword] = React.useState('');
  const [isTyping, setIsTyping] = React.useState(false);
  // infinite scroll 狀態
  const [searchOffset, setSearchOffset] = React.useState(0);
  const [searchHasMore, setSearchHasMore] = React.useState(false);
  const searchLimit = 20;
  const loaderRef = React.useRef();

  // 收藏狀態
  const [favorites, setFavorites] = React.useState(new Set());
  const [favoriteLoading, setFavoriteLoading] = React.useState({});

  // 分享狀態
  const [shareModalData, setShareModalData] = React.useState(null);
  const [shareLoading, setShareLoading] = React.useState({});

  // LIFF 狀態
  const [liffReady, setLiffReady] = React.useState(false);
  const [liffLoggedIn, setLiffLoggedIn] = React.useState(false);
  const [userProfile, setUserProfile] = React.useState(null);
  const [liffLoading, setLiffLoading] = React.useState(true);
  const [liffError, setLiffError] = React.useState(null);
  const [loginLoading, setLoginLoading] = React.useState(false);
  const [showLoginModal, setShowLoginModal] = React.useState(false);

  // 篩選狀態
  const [filters, setFilters] = React.useState({
    duration_type: '',
    season: '',
    area: ''
  });

  // 新增：排序狀態
  const [sortBy, setSortBy] = React.useState('popularity');
  // 初始化
  React.useEffect(() => {
    dispatch({ type: 'SET_MOUNTED', value: true });
    initializeLiff();
    loadSearchHistory();
  }, []);

  React.useEffect(() => {
    if (state.mounted) {
      initializeData();
    }
  }, [state.mounted, liffReady]);

  // 當分頁、篩選條件或排序改變時重新載入資料
  React.useEffect(() => {
    if (state.mounted && !state.isSearchMode) {
      fetchTripRankings(pagination.currentPage);
    }
  }, [state.mounted, filters, pagination.currentPage, sortBy]);

  // 當篩選條件或排序改變時重置到第一頁
  React.useEffect(() => {
    if (state.mounted && !state.isSearchMode) {
      setPagination(prev => ({ ...prev, currentPage: 1 }));
    }
  }, [filters, sortBy]);

  // Debounce 搜尋關鍵字
  React.useEffect(() => {
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
  React.useEffect(() => {
    if (debouncedSearchKeyword.trim().length > 0) {
      // 新搜尋，重設 offset
      setSearchResults([]);
      setSearchOffset(0);
      setSearchHasMore(false);
      performSearch(debouncedSearchKeyword.trim(), false, 0);
    } else if (!debouncedSearchKeyword.trim() && state.isSearchMode) {
      clearSearch();
    }
  }, [debouncedSearchKeyword]);

  // infinite scroll observer
  React.useEffect(() => {
    if (!state.isSearchMode || !searchHasMore || searchLoading) return;
    const observer = new window.IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        performSearch(searchKeyword, true, searchOffset);
      }
    }, { threshold: 1 });
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => {
      if (loaderRef.current) observer.unobserve(loaderRef.current);
    };
  }, [state.isSearchMode, searchHasMore, searchLoading, searchKeyword, searchOffset]);

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
      setLiffReady(true);
    } finally {
      setLiffLoading(false);
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
      const cache = localStorage.getItem('tripStatisticsCache');
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
        localStorage.setItem('tripStatisticsCache', JSON.stringify({ data: response.data, ts: Date.now() }));
      } catch (e) { }
    } catch (err) {
      console.error('獲取統計資料失敗:', err);
    }
  };

  const fetchAreas = async () => {
    if (!state.mounted) return;
    // localStorage 快取
    try {
      const cache = localStorage.getItem('tripAreasCache');
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
        localStorage.setItem('tripAreasCache', JSON.stringify({ data: response.data.areas || [], ts: Date.now() }));
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
        sort_by: sortBy,
        ...filters
      };

      const response = await getTripRankings(params);

      if (response.data.success) {
        dispatch({ type: 'SET_TRIPS', trips: response.data.data || [] });
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

      dispatch({ type: 'SET_ERROR', error: null });
    } catch (err) {
      console.error('獲取排行榜失敗:', err);
      dispatch({ type: 'SET_ERROR', error: '載入排行榜失敗，請稍後再試。' });
      dispatch({ type: 'SET_TRIPS', trips: [] });
    } finally {
      dispatch({ type: 'SET_LOADING', loading: false });
    }
  };

  const fetchUserFavorites = async () => {
    if (!state.mounted || !liffLoggedIn || !userProfile) return;

    const userId = getCurrentUserId();
    if (!userId) return;

    try {
      const response = await getUserFavorites(userId);

      if (response.data.success) {
        const favIds = new Set(response.data.favorites.map(f => f.trip_id));
        dispatch({ type: 'SET_FAVORITES', favorites: favIds });
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
    if (!state.mounted || !dateString) return '';
    try {
      const options = { year: 'numeric', month: 'short', day: 'numeric' };
      return new Date(dateString).toLocaleDateString('zh-TW', options);
    } catch (error) {
      return dateString;
    }
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
    if (newPage < 1 || newPage > pagination.totalPages || state.loading) return;

    window.scrollTo({ top: 0, behavior: 'smooth' });
    setPagination(prev => ({ ...prev, currentPage: newPage }));
  }, [pagination.totalPages, state.loading]);

  // 搜尋功能
  const performSearch = React.useCallback(async (keyword, append = false, offset = 0) => {
    if (!keyword.trim()) {
      setIsSearchMode(false);
      setSearchResults([]);
      setSearchOffset(0);
      setSearchHasMore(false);
      return;
    }
    setSearchLoading(true);
    setIsSearchMode(true);
    try {
      const response = await searchTrips({ keyword: keyword.trim(), limit: searchLimit, offset });
      if (response.data?.success && response.data?.trips) {
        dispatch({ type: 'SET_SEARCH_RESULTS', searchResults: prev => append ? [...prev, ...response.data.trips] : response.data.trips });
        dispatch({ type: 'SET_SEARCH_HAS_MORE', searchHasMore: response.data.pagination?.hasMore || false });
        dispatch({ type: 'SET_SEARCH_OFFSET', searchOffset: offset + response.data.trips.length });
      } else {
        dispatch({ type: 'SET_SEARCH_RESULTS', searchResults: [] });
        dispatch({ type: 'SET_SEARCH_HAS_MORE', searchHasMore: false });
        dispatch({ type: 'SET_SEARCH_OFFSET', searchOffset: 0 });
      }
      dispatch({ type: 'SET_ERROR', error: null });
      saveSearchHistory(keyword.trim());
    } catch (error) {
      console.error('搜尋失敗:', error);
      dispatch({ type: 'SET_ERROR', error: '搜尋失敗，請稍後再試' });
      dispatch({ type: 'SET_SEARCH_RESULTS', searchResults: [] });
      dispatch({ type: 'SET_SEARCH_HAS_MORE', searchHasMore: false });
      dispatch({ type: 'SET_SEARCH_OFFSET', searchOffset: 0 });
      saveSearchHistory(keyword.trim());
    } finally {
      setSearchLoading(false);
    }
  }, []);

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
    setSearchOffset(0);
    setSearchHasMore(false);
    dispatch({ type: 'SET_ERROR', error: null });
    setIsTyping(false);
  };

  const quickSearch = (keyword) => {
    setSearchKeyword(keyword);
  };
  // 收藏功能
  const updateFavoriteCount = (tripId, delta) => {
    dispatch({ type: 'SET_TRIPS', trips: state.trips.map(trip => trip.trip_id === tripId ? { ...trip, favorite_count: Math.max(0, (trip.favorite_count || 0) + delta) } : trip) });
    dispatch({ type: 'SET_SEARCH_RESULTS', searchResults: state.searchResults.map(trip => trip.trip_id === tripId ? { ...trip, favorite_count: Math.max(0, (trip.favorite_count || 0) + delta) } : trip) });
  };
  const toggleFavorite = async (tripId, event) => {
    event.stopPropagation();
    if (favoriteLoading[tripId]) return;
    if (!isLineLoggedIn()) {
      const shouldLogin = confirm('需要登入 LINE 才能使用收藏功能，是否要立即登入？');
      if (shouldLogin) setShowLoginModal(true);
      return;
    }
    const userId = getCurrentUserId();
    if (!userId) {
      alert('無法獲取用戶資訊，請重新登入');
      return;
    }
    setFavoriteLoading(prev => ({ ...prev, [tripId]: true }));
    const isFavorited = favorites.has(tripId);
    // optimistic update
    let rollback = false;
    if (isFavorited) {
      setFavorites(prev => {
        const newSet = new Set(prev);
        newSet.delete(tripId);
        return newSet;
      });
      updateFavoriteCount(tripId, -1);
    } else {
      setFavorites(prev => new Set([...prev, tripId]));
      updateFavoriteCount(tripId, 1);
    }
    try {
      if (isFavorited) {
        const response = await removeFavorite(userId, tripId);
        if (response.data.success) {
          await updateTripStatsWrapper(tripId, 'favorite_remove');
          showToast('已取消收藏', 'success');
        } else {
          rollback = true;
          throw new Error(response.data.message || '取消收藏失敗');
        }
      } else {
        const response = await addFavorite(userId, tripId);
        if (response.data.success) {
          await updateTripStatsWrapper(tripId, 'favorite_add');
          showToast('已加入收藏', 'success');
        } else {
          rollback = true;
          throw new Error(response.data.message || '新增收藏失敗');
        }
      }
    } catch (err) {
      // 回滾
      setFavorites(prev => {
        const newSet = new Set(prev);
        if (isFavorited) newSet.add(tripId);
        else newSet.delete(tripId);
        return newSet;
      });
      updateFavoriteCount(tripId, isFavorited ? 1 : -1);
      let errorMessage = '操作失敗，請稍後再試';
      if (err.response) {
        const status = err.response.status;
        const serverMessage = err.response.data?.message || '';
        switch (status) {
          case 400: errorMessage = '請求參數錯誤'; break;
          case 404: errorMessage = '行程不存在'; break;
          case 409: errorMessage = '已經收藏此行程'; break;
          case 500: errorMessage = `伺服器錯誤：${serverMessage}`; break;
          default: errorMessage = `操作失敗 (${status})：${serverMessage}`;
        }
      } else if (err.request) {
        errorMessage = '網路連接失敗，請檢查網路連接';
      } else if (err.code === 'ECONNABORTED') {
        errorMessage = '請求超時，請稍後再試';
      } else {
        errorMessage = err.message || '發生未知錯誤';
      }
      showToast(errorMessage, 'error');
    } finally {
      setFavoriteLoading(prev => ({ ...prev, [tripId]: false }));
    }
  };

  // 分享功能
  const handleDetailedShare = async (trip, e) => {
    e.stopPropagation();

    setShareLoading(prev => ({ ...prev, [trip.trip_id]: true }));

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
      setShareLoading(prev => ({ ...prev, [trip.trip_id]: false }));
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
    if (!liffReady) {
      alert('LINE 服務尚未準備就緒，請稍後再試');
      return;
    }

    setLoginLoading(true);

    try {

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
    // 修正導航到正確的收藏頁面
    window.location.href = '/favorites';
  };

  // HomePage 內 Toast 狀態與 showToast 優化
  const [toastQueue, setToastQueue] = React.useState([]); // [{message, type, id}]
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
      }, 900);
      // 強制保底 2 秒內消失
      const forceTimer = setTimeout(() => {
        setCurrentToast(null);
        setToastQueue(q => q.slice(1));
      }, 1000);
      return () => { clearTimeout(timer); clearTimeout(forceTimer); };
    }
  }, [toastQueue, currentToast]);

  if (!state.mounted) {
    return null;
  }

  const currentTrips = state.isSearchMode ? state.searchResults : state.trips;
  const currentLoading = state.isSearchMode ? state.searchLoading : state.loading;
  return (
    <ClientOnly>
      <div className="main" style={{
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
          {state.statistics && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: '24px',
              marginTop: '24px'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '28px', fontWeight: '700', marginBottom: '4px' }}>
                  {state.statistics.overview?.totalTrips || 0}
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
                  {state.statistics.overview?.avgDuration || 0}
                </div>
                <div style={{ fontSize: '14px', opacity: '0.9' }}>平均天數</div>
              </div>
            </div>
          )}
        </div>

        {/* 搜尋功能區域 */}
        <SearchBar
          searchKeyword={searchKeyword}
          onInput={handleSearchInput}
          onSubmit={handleSearchSubmit}
          isTyping={isTyping}
          isSearchMode={isSearchMode}
          onClear={clearSearch}
          searchHistory={searchHistory}
          onQuickSearch={quickSearch}
          onClearHistory={clearSearchHistory}
        />

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
                排序方式
              </div>
              <div style={{
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap'
              }}>
                {[
                  { key: 'popularity', label: '熱門排行', desc: '綜合熱度' },
                  { key: 'favorites', label: '最多收藏', desc: '收藏數排序' },
                  { key: 'shares', label: '最多分享', desc: '分享數排序' },
                  { key: 'views', label: '最多查看', desc: '查看數排序' }
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
              顯示第 {((pagination.currentPage - 1) * pagination.limit) + 1} - {Math.min(pagination.currentPage * pagination.limit, pagination.total)} 筆，
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
                    瀏覽全部行程
                  </button>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {currentTrips.map((trip, index) => (
                  <TripCard
                    key={trip.trip_id}
                    trip={{ ...trip, rank: isSearchMode ? '🔍' : ((pagination.currentPage - 1) * pagination.limit + index + 1) }}
                    isFavorited={favorites.has(trip.trip_id)}
                    favoriteLoading={favoriteLoading[trip.trip_id]}
                    onFavorite={e => toggleFavorite(trip.trip_id, e)}
                    onShare={e => handleDetailedShare(trip, e)}
                    isLineLoggedIn={isLineLoggedIn()}
                    shareLoading={shareLoading[trip.trip_id]}
                    onClick={() => handleTripClick(trip.trip_id)}
                  />
                ))}
                {/* infinite scroll 載入更多 */}
                {isSearchMode && (
                  <div ref={loaderRef} style={{ minHeight: '32px', textAlign: 'center', margin: '16px 0' }}>
                    {searchLoading ? '載入中...' : (searchHasMore ? '繼續下滑載入更多...' : '— 沒有更多結果 —')}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* 分頁組件 - 只在非搜尋模式顯示 */}
        {!isSearchMode && (
          <Pagination
            pagination={pagination}
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
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onLogin={handleLogin}
          isLoading={loginLoading}
        />
        {/* Toast 提示 */}
        {currentToast && (
          <CustomToast message={currentToast.message} type={currentToast.type} onClose={() => { setCurrentToast(null); setToastQueue(q => q.slice(1)); }} />
        )}
      </div>
    </ClientOnly>
  );
};

export default HomePage;