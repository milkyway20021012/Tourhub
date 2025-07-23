import React from 'react';

const SearchBar = ({
    searchKeyword,
    onInput,
    onSubmit,
    isTyping,
    isSearchMode,
    onClear,
    searchHistory = [],
    onQuickSearch,
    onClearHistory
}) => (
    <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e2e8f0'
    }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <div style={{ fontSize: '20px', fontWeight: '600', color: '#374151' }}>🔍 搜尋行程</div>
            {isSearchMode && (
                <button
                    onClick={onClear}
                    style={{ background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '500' }}
                >✖ 清除搜尋</button>
            )}
        </div>
        <form onSubmit={onSubmit} style={{ marginBottom: '16px' }}>
            <div style={{ position: 'relative' }}>
                <input
                    type="text"
                    value={searchKeyword}
                    onChange={onInput}
                    placeholder="輸入關鍵字搜尋行程... (如：東京、台北、溫泉、美食)"
                    style={{ width: '94%', padding: '12px 16px', paddingRight: isTyping ? '50px' : '16px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px', outline: 'none', transition: 'border-color 0.2s ease' }}
                    onFocus={e => { e.target.style.borderColor = '#3b82f6'; }}
                    onBlur={e => { e.target.style.borderColor = '#e2e8f0'; }}
                />
                {isTyping && (
                    <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px' }}>⏳</div>
                )}
            </div>
        </form>
        {/* 搜尋歷史 */}
        {searchHistory.length > 0 && !isSearchMode && (
            <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>最近搜尋：</div>
                    <button
                        onClick={onClearHistory}
                        style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '500' }}
                    >✖ 清除</button>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {searchHistory.slice(0, 8).map((keyword, index) => (
                        <button
                            key={index}
                            onClick={() => onQuickSearch(keyword)}
                            style={{ background: '#f8fafc', color: '#374151', border: '1px solid #e2e8f0', padding: '6px 12px', borderRadius: '16px', cursor: 'pointer', fontSize: '12px', fontWeight: '500', transition: 'all 0.2s ease' }}
                        >{keyword}</button>
                    ))}
                </div>
            </div>
        )}
    </div>
);

export default React.memo(SearchBar); 