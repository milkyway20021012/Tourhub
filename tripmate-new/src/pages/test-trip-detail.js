import React, { useState, useEffect } from 'react';
import axios from 'axios';

const TestTripDetail = () => {
    const [testResults, setTestResults] = useState([]);
    const [loading, setLoading] = useState(false);

    const runTests = async () => {
        setLoading(true);
        setTestResults([]);

        const tests = [
            {
                name: '測試資料庫連接',
                test: async () => {
                    const response = await axios.get('/api/check-database');
                    return response.data.success;
                }
            },
            {
                name: '測試行程詳情API (ID: 7)',
                test: async () => {
                    const response = await axios.get('/api/trip-detail?id=7');
                    return response.data.success && response.data.trip;
                }
            },
            {
                name: '測試行程詳情API (ID: 8)',
                test: async () => {
                    const response = await axios.get('/api/trip-detail?id=8');
                    return response.data.success && response.data.trip;
                }
            },
            {
                name: '測試行程列表API',
                test: async () => {
                    const response = await axios.get('/api/trips-paged?page=1&limit=5');
                    return response.data.success && response.data.data.length > 0;
                }
            },
            {
                name: '測試不存在的行程ID',
                test: async () => {
                    try {
                        await axios.get('/api/trip-detail?id=999999');
                        return false; // 應該失敗
                    } catch (error) {
                        return error.response?.status === 404;
                    }
                }
            }
        ];

        for (const test of tests) {
            try {
                const result = await test.test();
                setTestResults(prev => [...prev, {
                    name: test.name,
                    success: result,
                    error: null
                }]);
            } catch (error) {
                setTestResults(prev => [...prev, {
                    name: test.name,
                    success: false,
                    error: error.message
                }]);
            }
        }

        setLoading(false);
    };

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <h1>行程詳情功能測試</h1>
            
            <button 
                onClick={runTests}
                disabled={loading}
                style={{
                    padding: '12px 24px',
                    fontSize: '16px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    marginBottom: '20px'
                }}
            >
                {loading ? '測試中...' : '開始測試'}
            </button>

            {testResults.length > 0 && (
                <div>
                    <h2>測試結果</h2>
                    {testResults.map((result, index) => (
                        <div 
                            key={index}
                            style={{
                                padding: '12px',
                                margin: '8px 0',
                                borderRadius: '8px',
                                backgroundColor: result.success ? '#d4edda' : '#f8d7da',
                                border: `1px solid ${result.success ? '#c3e6cb' : '#f5c6cb'}`,
                                color: result.success ? '#155724' : '#721c24'
                            }}
                        >
                            <strong>{result.name}:</strong> {result.success ? '✅ 成功' : '❌ 失敗'}
                            {result.error && (
                                <div style={{ marginTop: '8px', fontSize: '14px' }}>
                                    錯誤: {result.error}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <div style={{ marginTop: '40px' }}>
                <h2>手動測試連結</h2>
                <ul>
                    <li><a href="/trip/7" target="_blank">測試行程詳情頁面 (ID: 7)</a></li>
                    <li><a href="/trip/8" target="_blank">測試行程詳情頁面 (ID: 8)</a></li>
                    <li><a href="/" target="_blank">測試主頁</a></li>
                </ul>
            </div>
        </div>
    );
};

export default TestTripDetail; 