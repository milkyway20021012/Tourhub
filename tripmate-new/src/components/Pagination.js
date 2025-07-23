import React from 'react';

const Pagination = ({ pagination, onPageChange, loading }) => {
    const { currentPage, totalPages, total, hasNextPage, hasPrevPage } = pagination;
    if (totalPages <= 1) return null;
    const getVisiblePages = () => {
        const delta = 2;
        const range = [];
        const rangeWithDots = [];
        for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
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
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', margin: '32px 0', flexWrap: 'wrap' }}>
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={!hasPrevPage || loading}
                style={{ padding: '8px 16px', border: '1px solid #d1d5db', borderRadius: '6px', background: hasPrevPage && !loading ? 'white' : '#f9fafb', color: hasPrevPage && !loading ? '#374151' : '#9ca3af', cursor: hasPrevPage && !loading ? 'pointer' : 'not-allowed', fontSize: '14px', fontWeight: '500', opacity: loading ? 0.6 : 1 }}
            >
                ← 上一頁
            </button>
            {visiblePages.map((page, index) => (
                <React.Fragment key={index}>
                    {page === '...' ? (
                        <span style={{ padding: '8px 4px', color: '#9ca3af', fontSize: '14px' }}>...</span>
                    ) : (
                        <button
                            onClick={() => onPageChange(page)}
                            disabled={loading}
                            style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', background: page === currentPage ? '#3b82f6' : 'white', color: page === currentPage ? 'white' : '#374151', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: page === currentPage ? '600' : '500', minWidth: '40px', opacity: loading ? 0.6 : 1 }}
                        >
                            {page}
                        </button>
                    )}
                </React.Fragment>
            ))}
            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={!hasNextPage || loading}
                style={{ padding: '8px 16px', border: '1px solid #d1d5db', borderRadius: '6px', background: hasNextPage && !loading ? 'white' : '#f9fafb', color: hasNextPage && !loading ? '#374151' : '#9ca3af', cursor: hasNextPage && !loading ? 'pointer' : 'not-allowed', fontSize: '14px', fontWeight: '500', opacity: loading ? 0.6 : 1 }}
            >
                下一頁 →
            </button>
            <div style={{ marginLeft: '16px', fontSize: '14px', color: '#64748b', fontWeight: '500' }}>
                第 {currentPage} 頁，共 {totalPages} 頁 (總計 {total} 筆)
            </div>
        </div>
    );
};

export default React.memo(Pagination); 