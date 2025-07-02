import React, { useState } from 'react';
import axios from 'axios';

const DebugFavorites = () => {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    const addLog = (message, type = 'info', data = null) => {
        const timestamp = new Date().toLocaleTimeString();
        setResults(prev => [...prev, {
            timestamp,
            message,
            type,
            data,
            id: Date.now() + Math.random()
        }]);
    };

    const clearLogs = () => {
        setResults([]);
    };

    const testDatabaseConnection = async () => {
        addLog('🔌 測試數據庫連接...', 'info');
        try {
            const response = await axios.get('/api/check-database');
            addLog('✅ 數據庫檢查成功', 'success', response.data);
        } catch (error) {
            addLog('❌ 數據庫檢查失敗', 'error', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
        }
    };

    const testFavoritesAPI = async () => {
        addLog('🔍 測試收藏 API...', 'info');
        try {
            const response = await axios.get('/api/user-favorites', {
                params: { line_user_id: 'demo_user_123' },
                timeout: 10000
            });
            addLog('✅ 收藏 API 成功', 'success', response.data);
        } catch (error) {
            addLog('❌ 收藏 API 失敗', 'error', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
                code: error.code
            });
        }
    };

    const testAddFavorite = async () => {
        addLog('💖 測試添加收藏...', 'info');
        try {
            const response = await axios.post('/api/user-favorites', {
                line_user_id: 'debug_user',
                trip_id: 1
            });
            addLog('✅ 添加收藏成功', 'success', response.data);
        } catch (error) {
            addLog('❌ 添加收藏失敗', 'error', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
        }
    };

    const testRemoveFavorite = async () => {
        addLog('💔 測試移除收藏...', 'info');
        try {
            const response = await axios.delete('/api/user-favorites', {
                data: {
                    line_user_id: 'debug_user',
                    trip_id: 1
                }
            });
            addLog('✅ 移除收藏成功', 'success', response.data);
        } catch (error) {
            addLog('❌ 移除收藏失敗', 'error', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
        }
    };

    const runAllTests = async () => {
        setLoading(true);
        clearLogs();

        addLog('🚀 開始完整診斷...', 'info');

        await testDatabaseConnection();
        await new Promise(resolve => setTimeout(resolve, 500));

        await testFavoritesAPI();
        await new Promise(resolve => setTimeout(resolve, 500));

        await testAddFavorite();
        await new Promise(resolve => setTimeout(resolve, 500));

        await testFavoritesAPI();
        await new Promise(resolve => setTimeout(resolve, 500));

        await testRemoveFavorite();
        await new Promise(resolve => setTimeout(resolve, 500));

        addLog('🏁 診斷完成', 'info');
        setLoading(false);
    };

    const getLogColor = (type) => {
        switch (type) {
            case 'success': return '#10b981';
            case 'error': return '#ef4444';
            case 'warning': return '#f59e0b';
            default: return '#6b7280';
        }
    };

    return (
        <div style={{
            maxWidth: '1200px',
            margin: '20px auto',
            padding: '20px',
            fontFamily: 'monospace'
        }}>
            <h1>🔧 收藏功能診斷工具</h1>

            <div style={{ marginBottom: '20px' }}>
                <button
                    onClick={runAllTests}
                    disabled={loading}
                    style={{
                        background: loading ? '#ccc' : '#3b82f6',
                        color: 'white',
                        border: 'none',
                        padding: '12px 24px',
                        borderRadius: '6px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        marginRight: '10px'
                    }}
                >
                    {loading ? '⏳ 診斷中...' : '🚀 開始完整診斷'}
                </button>

                <button
                    onClick={testDatabaseConnection}
                    style={{
                        background: '#10b981',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        marginRight: '10px'
                    }}
                >
                    🔌 測試數據庫
                </button>

                <button
                    onClick={testFavoritesAPI}
                    style={{
                        background: '#f59e0b',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        marginRight: '10px'
                    }}
                >
                    🔍 測試查詢
                </button>

                <button
                    onClick={clearLogs}
                    style={{
                        background: '#6b7280',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        cursor: 'pointer'
                    }}
                >
                    🗑️ 清除日誌
                </button>
            </div>

            <div style={{
                background: '#1f2937',
                color: '#f9fafb',
                padding: '20px',
                borderRadius: '8px',
                maxHeight: '600px',
                overflowY: 'auto',
                fontSize: '14px'
            }}>
                {results.length === 0 ? (
                    <div style={{ color: '#9ca3af' }}>點擊上方按鈕開始診斷...</div>
                ) : (
                    results.map(log => (
                        <div key={log.id} style={{
                            marginBottom: '10px',
                            padding: '8px',
                            borderLeft: `3px solid ${getLogColor(log.type)}`,
                            background: 'rgba(75, 85, 99, 0.3)'
                        }}>
                            <div style={{
                                color: getLogColor(log.type),
                                fontWeight: 'bold',
                                marginBottom: '4px'
                            }}>
                                [{log.timestamp}] {log.message}
                            </div>
                            {log.data && (
                                <pre style={{
                                    margin: 0,
                                    fontSize: '12px',
                                    color: '#d1d5db',
                                    background: '#111827',
                                    padding: '8px',
                                    borderRadius: '4px',
                                    overflow: 'auto'
                                }}>
                                    {JSON.stringify(log.data, null, 2)}
                                </pre>
                            )}
                        </div>
                    ))
                )}
            </div>

            <div style={{
                marginTop: '20px',
                padding: '15px',
                background: '#fef3c7',
                borderRadius: '6px',
                fontSize: '14px'
            }}>
                <strong>💡 使用說明：</strong>
                <ul style={{ marginTop: '8px' }}>
                    <li><strong>完整診斷</strong> - 運行所有測試，找出問題所在</li>
                    <li><strong>測試數據庫</strong> - 檢查數據庫連接和表結構</li>
                    <li><strong>測試查詢</strong> - 單獨測試收藏查詢功能</li>
                    <li>查看詳細的錯誤信息和數據流</li>
                </ul>
            </div>
        </div>
    );
};

export default DebugFavorites;