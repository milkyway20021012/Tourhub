import React, { useState } from 'react';
import axios from 'axios';

const DebugFavorites = () => {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [testUserId, setTestUserId] = useState('debug_user_123');
    const [testTripId, setTestTripId] = useState('1');

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
                params: { line_user_id: testUserId },
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
                line_user_id: testUserId,
                trip_id: parseInt(testTripId)
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
                    line_user_id: testUserId,
                    trip_id: parseInt(testTripId)
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

    const testDuplicateAdd = async () => {
        addLog('🔄 測試重複添加收藏...', 'info');
        try {
            // 第一次添加
            await axios.post('/api/user-favorites', {
                line_user_id: testUserId,
                trip_id: parseInt(testTripId)
            });
            addLog('✅ 第一次添加成功', 'success');

            // 第二次添加（應該失敗）
            const response = await axios.post('/api/user-favorites', {
                line_user_id: testUserId,
                trip_id: parseInt(testTripId)
            });
            addLog('❌ 重複添加應該失敗但成功了', 'error', response.data);
        } catch (error) {
            if (error.response?.status === 409) {
                addLog('✅ 重複添加正確被拒絕', 'success', error.response.data);
            } else {
                addLog('❌ 重複添加測試失敗', 'error', {
                    message: error.message,
                    response: error.response?.data,
                    status: error.response?.status
                });
            }
        }
    };

    const testInvalidTripId = async () => {
        addLog('🚫 測試無效行程 ID...', 'info');
        try {
            const response = await axios.post('/api/user-favorites', {
                line_user_id: testUserId,
                trip_id: 99999 // 不存在的行程 ID
            });
            addLog('❌ 無效行程 ID 應該失敗但成功了', 'error', response.data);
        } catch (error) {
            if (error.response?.status === 404) {
                addLog('✅ 無效行程 ID 正確被拒絕', 'success', error.response.data);
            } else {
                addLog('❌ 無效行程 ID 測試失敗', 'error', {
                    message: error.message,
                    response: error.response?.data,
                    status: error.response?.status
                });
            }
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

        await testDuplicateAdd();
        await new Promise(resolve => setTimeout(resolve, 500));

        await testInvalidTripId();
        await new Promise(resolve => setTimeout(resolve, 500));

        await testRemoveFavorite();
        await new Promise(resolve => setTimeout(resolve, 500));

        await testFavoritesAPI();
        await new Promise(resolve => setTimeout(resolve, 500));

        addLog('🏁 診斷完成', 'info');
        setLoading(false);
    };

    return (
        <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '20px',
            fontFamily: 'Arial, sans-serif'
        }}>
            <h1 style={{ color: '#1f2937', marginBottom: '24px' }}>🔧 收藏功能診斷工具</h1>

            <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '24px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e2e8f0'
            }}>
                <h2 style={{ color: '#374151', marginBottom: '16px' }}>測試參數</h2>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '16px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#6b7280' }}>
                            測試用戶 ID:
                        </label>
                        <input
                            type="text"
                            value={testUserId}
                            onChange={(e) => setTestUserId(e.target.value)}
                            style={{
                                padding: '8px 12px',
                                border: '1px solid #d1d5db',
                                borderRadius: '6px',
                                fontSize: '14px',
                                width: '200px'
                            }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#6b7280' }}>
                            測試行程 ID:
                        </label>
                        <input
                            type="number"
                            value={testTripId}
                            onChange={(e) => setTestTripId(e.target.value)}
                            style={{
                                padding: '8px 12px',
                                border: '1px solid #d1d5db',
                                borderRadius: '6px',
                                fontSize: '14px',
                                width: '100px'
                            }}
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <button
                        onClick={runAllTests}
                        disabled={loading}
                        style={{
                            background: loading ? '#9ca3af' : '#3b82f6',
                            color: 'white',
                            border: 'none',
                            padding: '12px 24px',
                            borderRadius: '8px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontSize: '14px',
                            fontWeight: '600'
                        }}
                    >
                        {loading ? '⏳ 執行中...' : '🚀 執行完整測試'}
                    </button>
                    <button
                        onClick={clearLogs}
                        style={{
                            background: '#f3f4f6',
                            color: '#374151',
                            border: '1px solid #d1d5db',
                            padding: '12px 24px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '14px'
                        }}
                    >
                        🗑️ 清除日誌
                    </button>
                </div>
            </div>

            <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e2e8f0'
            }}>
                <h2 style={{ color: '#374151', marginBottom: '16px' }}>測試結果</h2>
                <div style={{
                    maxHeight: '600px',
                    overflowY: 'auto',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '16px',
                    background: '#f9fafb'
                }}>
                    {results.length === 0 ? (
                        <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>
                            點擊「執行完整測試」開始診斷
                        </div>
                    ) : (
                        results.map((result) => (
                            <div
                                key={result.id}
                                style={{
                                    marginBottom: '12px',
                                    padding: '12px',
                                    borderRadius: '6px',
                                    background: result.type === 'error' ? '#fef2f2' :
                                        result.type === 'success' ? '#f0fdf4' : '#eff6ff',
                                    border: `1px solid ${result.type === 'error' ? '#fecaca' :
                                        result.type === 'success' ? '#bbf7d0' : '#bfdbfe'}`,
                                    fontSize: '14px'
                                }}
                            >
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    marginBottom: '4px'
                                }}>
                                    <span style={{
                                        color: result.type === 'error' ? '#dc2626' :
                                            result.type === 'success' ? '#16a34a' : '#3b82f6',
                                        fontWeight: '600'
                                    }}>
                                        {result.message}
                                    </span>
                                    <span style={{ color: '#9ca3af', fontSize: '12px' }}>
                                        {result.timestamp}
                                    </span>
                                </div>
                                {result.data && (
                                    <pre style={{
                                        margin: '8px 0 0 0',
                                        fontSize: '12px',
                                        color: '#6b7280',
                                        background: 'rgba(0,0,0,0.05)',
                                        padding: '8px',
                                        borderRadius: '4px',
                                        overflow: 'auto',
                                        maxHeight: '200px'
                                    }}>
                                        {JSON.stringify(result.data, null, 2)}
                                    </pre>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default DebugFavorites;