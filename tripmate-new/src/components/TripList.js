// components/TripList.js - 繁體中文版本，包含分享功能
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TripDetail from './TripDetail';
import ShareTrip from './ShareTrip';
import styles from './TripList.module.css';

const TripList = () => {
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({
        total: 0,
        total_pages: 0,
        current_page: 1,
        limit: 10
    });
    const [selectedTrip, setSelectedTrip] = useState(null);
    const [tripDetails, setTripDetails] = useState({
        trip: null,
        details: [],
        participants: []
    });

    // 分享功能相關狀態
    const [shareModalData, setShareModalData] = useState(null);
    const [shareLoading, setShareLoading] = useState({});
    const [quickShareLoading, setQuickShareLoading] = useState({});

    // 排序狀態 - 預設按預算排序
    const [sortField, setSortField] = useState('budget');
    const [sortOrder, setSortOrder] = useState('DESC');

    // 篩選選項 - 從資料庫獲取
    const [areas, setAreas] = useState([]);
    const [filterLoading, setFilterLoading] = useState(true);

    // 篩選狀態
    const [selectedArea, setSelectedArea] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [timeFilter, setTimeFilter] = useState('all');

    // UI狀態
    const [viewMode, setViewMode] = useState('table');

    useEffect(() => {
        // 獲取篩選選項
        fetchFilterOptions();

        // 獲取行程資料
        fetchTrips(
            pagination.current_page,
            pagination.limit,
            sortField,
            sortOrder,
            selectedArea,
            startDate,
            endDate,
            searchTerm
        );
    }, [pagination.current_page, sortField, sortOrder, selectedArea, startDate, endDate, searchTerm]);

    const fetchFilterOptions = async () => {
        setFilterLoading(true);
        try {
            console.log('正在從資料庫獲取篩選選項...');
            const response = await axios.get(`/api/get-filters`);

            console.log('資料庫返回的地區:', response.data.areas);

            setAreas(response.data.areas || []);

            console.log('篩選選項設定完成 - 地區數量:', response.data.areas?.length);
        } catch (err) {
            console.error('獲取篩選選項失敗:', err);
            setError('獲取篩選選項失敗，請稍後再試。');
        } finally {
            setFilterLoading(false);
        }
    };

    const fetchTrips = async (page, limit, sort, order, area, startDate, endDate, search) => {
        setLoading(true);
        try {
            const response = await axios.get(`/api/trips-paged`, {
                params: {
                    page,
                    limit,
                    sort,
                    order,
                    area,
                    startDate,
                    endDate,
                    search
                }
            });

            setTrips(response.data.data);
            setPagination(response.data.pagination);
            setError(null);
        } catch (err) {
            console.error('獲取行程失敗:', err);
            setError('載入行程失敗，請稍後再試。');
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.total_pages) {
            setPagination({
                ...pagination,
                current_page: newPage
            });
        }
    };

    const handleSort = (field) => {
        if (field === sortField) {
            setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
        } else {
            setSortField(field);
            setSortOrder('DESC');
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;

        switch (name) {
            case 'area':
                setSelectedArea(value);
                console.log('選擇地區:', value);
                break;
            case 'startDate':
                setStartDate(value);
                break;
            case 'endDate':
                setEndDate(value);
                break;
            default:
                break;
        }

        setPagination({
            ...pagination,
            current_page: 1
        });
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleSearch = () => {
        setPagination({
            ...pagination,
            current_page: 1
        });
        setIsSearching(true);

        fetchTrips(
            1,
            pagination.limit,
            sortField,
            sortOrder,
            selectedArea,
            startDate,
            endDate,
            searchTerm
        );
    };

    const handleTimeFilterChange = (filter) => {
        setTimeFilter(filter);

        let startDateFilter = '';
        let endDateFilter = '';

        const today = new Date();

        if (filter === 'week') {
            const firstDayOfWeek = new Date(today);
            firstDayOfWeek.setDate(today.getDate() - today.getDay());
            startDateFilter = firstDayOfWeek.toISOString().split('T')[0];
        } else if (filter === 'month') {
            const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            startDateFilter = firstDayOfMonth.toISOString().split('T')[0];
        } else if (filter === 'season') {
            const currentMonth = today.getMonth();
            const firstMonthOfQuarter = Math.floor(currentMonth / 3) * 3;
            const firstDayOfQuarter = new Date(today.getFullYear(), firstMonthOfQuarter, 1);
            startDateFilter = firstDayOfQuarter.toISOString().split('T')[0];
        }

        setStartDate(startDateFilter);
        setEndDate(endDateFilter);

        setPagination({
            ...pagination,
            current_page: 1
        });

        fetchTrips(
            1,
            pagination.limit,
            sortField,
            sortOrder,
            selectedArea,
            startDateFilter,
            endDateFilter,
            searchTerm
        );
    };

    const handleViewModeChange = (mode) => {
        setViewMode(mode);
    };

    const handleResetFilters = () => {
        setSelectedArea('');
        setStartDate('');
        setEndDate('');
        setSearchTerm('');
        setTimeFilter('all');
        setIsSearching(false);
        setPagination({
            ...pagination,
            current_page: 1
        });

        fetchTrips(1, pagination.limit, sortField, sortOrder, '', '', '', '');
    };

    const handleTripClick = async (tripId) => {
        console.log('點擊行程:', tripId);
        try {
            // 獲取行程詳情
            const response = await axios.get(`/api/trip-detail`, {
                params: { id: tripId }
            });

            console.log('行程詳情回應:', response.data);

            // 設定行程詳情
            setTripDetails(response.data);
            setSelectedTrip(tripId);

        } catch (err) {
            console.error('獲取行程詳情失敗:', err);
        }
    };

    const handleCloseDetail = () => {
        setSelectedTrip(null);
    };

    // === 分享功能相關函數 ===

    // 詳細分享（開啟分享彈窗）
    const handleDetailedShare = async (trip, e) => {
        e.stopPropagation();

        setShareLoading(prev => ({ ...prev, [trip.trip_id]: true }));

        try {
            // 獲取完整的行程詳情
            const response = await axios.get(`/api/trip-detail?id=${trip.trip_id}`);

            if (response.data.success) {
                setShareModalData({
                    trip: response.data.trip,
                    details: response.data.details || []
                });
            } else {
                // 即使 API 失敗，也使用基本資訊進行分享
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

    // 快速分享（不開啟彈窗）
    const handleQuickShare = async (trip, e) => {
        e.stopPropagation();

        setQuickShareLoading(prev => ({ ...prev, [trip.trip_id]: true }));

        const shareText = `🎯 推薦行程：${trip.title}\n📍 ${trip.area}\n📅 ${formatDate(trip.start_date)} - ${formatDate(trip.end_date)}\n\n✨ 透過 Tourhub 分享`;

        try {
            // 優先使用 LINE 分享
            if (typeof window !== 'undefined' && window.liff) {
                try {
                    await window.liff.shareTargetPicker([{
                        type: 'text',
                        text: shareText
                    }]);
                    console.log('✅ LINE 快速分享成功');
                    return;
                } catch (error) {
                    console.error('LINE 分享失敗:', error);
                }
            }

            // 備用：瀏覽器原生分享
            if (navigator.share) {
                await navigator.share({
                    title: trip.title,
                    text: shareText
                });
                console.log('✅ 瀏覽器快速分享成功');
            } else {
                // 最後備用：複製到剪貼簿
                await navigator.clipboard.writeText(shareText);
                alert('行程資訊已複製到剪貼簿！');
            }

            // 記錄快速分享
            const userId = getCurrentUserId();
            if (userId) {
                await axios.post('/api/user-shares', {
                    line_user_id: userId,
                    trip_id: trip.trip_id,
                    share_type: 'quick',
                    share_content: { type: 'quick', format: 'text' }
                });
            }
        } catch (error) {
            console.error('快速分享失敗:', error);
            alert('分享失敗，請稍後再試');
        } finally {
            setQuickShareLoading(prev => ({ ...prev, [trip.trip_id]: false }));
        }
    };

    // 獲取當前用戶 ID
    const getCurrentUserId = () => {
        if (typeof window !== 'undefined' && window.liff && window.liff.getProfile) {
            try {
                return window.liff.getProfile().then(profile => profile.userId);
            } catch (error) {
                console.error('獲取用戶 ID 失敗:', error);
            }
        }
        return 'demo_user_123'; // 開發環境備用
    };

    // 關閉分享彈窗
    const closeShareModal = () => {
        setShareModalData(null);
    };

    // === 輔助函數 ===

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('zh-TW', options);
    };

    const renderSortIcon = (field) => {
        if (field !== sortField) return null;
        return sortOrder === 'ASC' ? ' ↑' : ' ↓';
    };

    const renderTimeFilterTabs = () => {
        return (
            <div className={styles.timeFilterTabs}>
                <button
                    className={`${styles.timeFilterTab} ${timeFilter === 'all' ? styles.active : ''}`}
                    onClick={() => handleTimeFilterChange('all')}
                >
                    全部
                </button>
                <button
                    className={`${styles.timeFilterTab} ${timeFilter === 'week' ? styles.active : ''}`}
                    onClick={() => handleTimeFilterChange('week')}
                >
                    本週
                </button>
                <button
                    className={`${styles.timeFilterTab} ${timeFilter === 'month' ? styles.active : ''}`}
                    onClick={() => handleTimeFilterChange('month')}
                >
                    本月
                </button>
                <button
                    className={`${styles.timeFilterTab} ${timeFilter === 'season' ? styles.active : ''}`}
                    onClick={() => handleTimeFilterChange('season')}
                >
                    本季
                </button>
            </div>
        );
    };

    const renderViewToggle = () => {
        return (
            <div className={styles.viewToggle}>
                <button
                    className={viewMode === 'table' ? styles.active : ''}
                    onClick={() => handleViewModeChange('table')}
                >
                    <span>表格檢視</span>
                </button>
                <button
                    className={viewMode === 'card' ? styles.active : ''}
                    onClick={() => handleViewModeChange('card')}
                >
                    <span>卡片檢視</span>
                </button>
            </div>
        );
    };

    const renderFilterPanel = () => {
        return (
            <div className={styles.filterPanel}>
                <h3>篩選選項</h3>

                {renderTimeFilterTabs()}

                <div className={styles.filterRow}>
                    <div className={`${styles.filterGroup} ${styles.searchGroup}`}>
                        <label htmlFor="search">搜尋行程</label>
                        <div className={styles.searchInputContainer}>
                            <input
                                type="text"
                                id="search"
                                name="search"
                                value={searchTerm}
                                onChange={handleSearchChange}
                                placeholder="輸入關鍵字搜尋行程..."
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        handleSearch();
                                    }
                                }}
                            />
                            <button
                                className={styles.searchButton}
                                onClick={handleSearch}
                            >
                                搜尋
                            </button>
                        </div>
                    </div>
                </div>

                <div className={styles.filterRow}>
                    <div className={styles.filterGroup}>
                        <label htmlFor="area">地區</label>
                        <select
                            id="area"
                            name="area"
                            value={selectedArea}
                            onChange={handleFilterChange}
                            disabled={filterLoading}
                        >
                            <option value="">所有地區</option>
                            {areas.map((area, index) => (
                                <option key={`area-${index}`} value={area}>{area}</option>
                            ))}
                        </select>
                        {filterLoading && <small style={{ color: '#666' }}>載入地區中...</small>}
                        {!filterLoading && areas.length === 0 && <small style={{ color: '#999' }}>無可用地區</small>}
                    </div>
                </div>

                <div className={styles.filterActions}>
                    <button
                        className={styles.resetButton}
                        onClick={handleResetFilters}
                    >
                        重置篩選
                    </button>
                </div>

            </div>
        );
    };

    const renderPagination = () => {
        const { current_page, total_pages } = pagination;

        if (total_pages === 0) return null;

        let startPage = Math.max(1, current_page - 2);
        let endPage = Math.min(total_pages, startPage + 4);

        if (endPage - startPage < 4 && total_pages > 5) {
            startPage = Math.max(1, endPage - 4);
        }

        const pageNumbers = [];
        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(i);
        }

        return (
            <div className={styles.pagination}>
                <button
                    onClick={() => handlePageChange(1)}
                    disabled={current_page === 1}
                    className={styles.paginationButton}
                >
                    &laquo;
                </button>

                <button
                    onClick={() => handlePageChange(current_page - 1)}
                    disabled={current_page === 1}
                    className={styles.paginationButton}
                >
                    &lt;
                </button>

                {pageNumbers.map(number => (
                    <button
                        key={number}
                        onClick={() => handlePageChange(number)}
                        className={`${styles.paginationButton} ${current_page === number ? styles.active : ''}`}
                    >
                        {number}
                    </button>
                ))}

                <button
                    onClick={() => handlePageChange(current_page + 1)}
                    disabled={current_page === total_pages}
                    className={styles.paginationButton}
                >
                    &gt;
                </button>

                <button
                    onClick={() => handlePageChange(total_pages)}
                    disabled={current_page === total_pages}
                    className={styles.paginationButton}
                >
                    &raquo;
                </button>

                <span className={styles.paginationInfo}>
                    第 {current_page}/{total_pages} 頁，共 {pagination.total} 筆
                </span>
            </div>
        );
    };

    const renderTripTable = () => {
        if (loading) return <div className={styles.loading}>載入中...</div>;
        if (error) return <div className={styles.error}>{error}</div>;
        if (trips.length === 0) return <div className={styles.noTrips}>沒有找到符合條件的行程。</div>;

        return (
            <div className={styles.tripTableContainer}>
                <table className={styles.tripTable}>
                    <thead>
                        <tr>
                            <th>排名</th>
                            <th onClick={() => handleSort('title')}>
                                行程標題 {renderSortIcon('title')}
                            </th>
                            <th onClick={() => handleSort('area')}>
                                地區 {renderSortIcon('area')}
                            </th>
                            <th onClick={() => handleSort('budget')}>
                                預算 {renderSortIcon('budget')}
                            </th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {trips.map((trip, index) => {
                            // 計算實際排名，考慮分頁
                            const rank = (pagination.current_page - 1) * pagination.limit + index + 1;

                            return (
                                <tr
                                    key={trip.trip_id}
                                    onClick={() => handleTripClick(trip.trip_id)}
                                    className={styles.tripRow}
                                >
                                    <td>
                                        <div className={`${styles.rank} ${styles[`rank${rank}`]}`}>
                                            {rank}
                                        </div>
                                    </td>
                                    <td className={styles.tripTitle}>{trip.title}</td>
                                    <td>{trip.area}</td>
                                    <td>
                                        {trip.budget ? `${trip.budget.toLocaleString()}` : '未設定'}
                                    </td>
                                    <td>
                                        <div className={styles.actionButtons}>
                                            <button
                                                className={styles.quickShareButton}
                                                onClick={(e) => handleQuickShare(trip, e)}
                                                disabled={quickShareLoading[trip.trip_id]}
                                                title="快速分享"
                                            >
                                                {quickShareLoading[trip.trip_id] ? '⏳' : '🚀'}
                                            </button>
                                            <button
                                                className={styles.detailedShareButton}
                                                onClick={(e) => handleDetailedShare(trip, e)}
                                                disabled={shareLoading[trip.trip_id]}
                                                title="詳細分享"
                                            >
                                                {shareLoading[trip.trip_id] ? '⏳' : '📤'}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        );
    };

    const renderCardView = () => {
        if (loading) return <div className={styles.loading}>載入中...</div>;
        if (error) return <div className={styles.error}>{error}</div>;
        if (trips.length === 0) return <div className={styles.noTrips}>沒有找到符合條件的行程。</div>;

        return (
            <div className={styles.tripCardView}>
                {trips.map((trip, index) => {
                    const rank = (pagination.current_page - 1) * pagination.limit + index + 1;

                    return (
                        <div
                            key={trip.trip_id}
                            className={styles.tripCard}
                            onClick={() => handleTripClick(trip.trip_id)}
                        >
                            <div className={styles.tripCardHeader}>
                                <div className={styles.tripCardTitle}>{trip.title}</div>
                                <div className={`${styles.tripCardRank} ${styles.rank} ${styles[`rank${rank}`]}`}>
                                    {rank}
                                </div>
                            </div>
                            <div className={styles.tripCardContent}>
                                <div className={styles.tripCardInfo}>
                                    <span className={styles.tripCardArea}>{trip.area}</span>
                                </div>
                                <div className={styles.tripCardInfo}>
                                    <span className={styles.tripCardDate}>
                                        {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
                                    </span>
                                </div>
                                {trip.description && (
                                    <div className={styles.tripCardDescription}>
                                        {trip.description.length > 80
                                            ? trip.description.substring(0, 80) + '...'
                                            : trip.description}
                                    </div>
                                )}
                            </div>
                            <div className={styles.tripCardActions}>
                                <button
                                    className={styles.quickShareCardButton}
                                    onClick={(e) => handleQuickShare(trip, e)}
                                    disabled={quickShareLoading[trip.trip_id]}
                                    title="快速分享"
                                >
                                    {quickShareLoading[trip.trip_id] ? '⏳' : '🚀'}
                                </button>
                                <button
                                    className={styles.detailedShareCardButton}
                                    onClick={(e) => handleDetailedShare(trip, e)}
                                    disabled={shareLoading[trip.trip_id]}
                                    title="詳細分享"
                                >
                                    {shareLoading[trip.trip_id] ? '⏳' : '📤'}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className={styles.tripListContainer}>
            <h2>行程列表</h2>
            {renderFilterPanel()}

            <div className={styles.listHeader}>
                {renderViewToggle()}
            </div>

            {viewMode === 'table' ? renderTripTable() : renderCardView()}
            {renderPagination()}

            {/* 行程詳情彈窗 */}
            {selectedTrip && (
                <TripDetail
                    trip={tripDetails.trip}
                    details={tripDetails.details}
                    participants={tripDetails.participants}
                    onClose={handleCloseDetail}
                />
            )}

            {/* 分享彈窗 */}
            {shareModalData && (
                <ShareTrip
                    trip={shareModalData.trip}
                    details={shareModalData.details}
                    onClose={closeShareModal}
                />
            )}
        </div>
    );
};

export default TripList;