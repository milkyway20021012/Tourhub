import React, { useState, useEffect } from 'react';

const TestFavorites = () => {
    const [favorites, setFavorites] = useState(new Set());
    const [cacheInfo, setCacheInfo] = useState(null);
    const [apiResponse, setApiResponse] = useState(null);
    const [logs, setLogs] = useState([]);

    const addLog = (message) => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
        console.log(message);
    };

    const userId = 'dev_user_123';

    // 檢查緩存
    const checkCache = () => {
        try {
            const cacheKey = `userFavorites_${userId}`;
            const cached = localStorage.getItem(cacheKey);
            
            if (cached) {
                const data = JSON.parse(cached);
                setCacheInfo(data);
                addLog(`緩存存在: ${data.favorites.length} 個收藏`);
                return data;
            } else {
                setCacheInfo(null);
                addLog('緩存不存在');
                return null;
            }
        } catch (e) {
            addLog(`檢查緩存失敗: ${e.message}`);
            return null;
        }
    };

    // 測試 API
    const testAPI = async () => {
        try {
            addLog('測試 API...');
            const response = await fetch(`/api/user-favorites?line_user_id=${userId}`);
            const data = await response.json();
            setApiResponse(data);
            addLog(`API 回應: ${data.success ? '成功' : '失敗'}, ${data.favorites?.length || 0} 個收藏`);
            return data;
        } catch (e) {
            addLog(`API 測試失敗: ${e.message}`);
            return null;
        }
    };

    // 添加測試收藏
    const addTestFavorite = async (tripId) => {
        try {
            addLog(`添加收藏: ${tripId}`);
            const response = await fetch('/api/user-favorites', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ line_user_id: userId, trip_id: tripId })
            });
            const data = await response.json();
            addLog(`添加收藏結果: ${data.success ? '成功' : '失敗'} - ${data.message}`);
            
            if (data.success) {
                setFavorites(prev => new Set([...prev, tripId]));
                // 更新緩存
                const newFavorites = Array.from(new Set([...favorites, tripId]));
                localStorage.setItem(`userFavorites_${userId}`, JSON.stringify({
                    favorites: newFavorites,
                    timestamp: Date.now(),
                    userId: userId
                }));
                addLog(`緩存已更新: ${newFavorites.length} 個收藏`);
            }
        } catch (e) {
            addLog(`添加收藏失敗: ${e.message}`);
        }
    };

    // 移除測試收藏
    const removeTestFavorite = async (tripId) => {
        try {
            addLog(`移除收藏: ${tripId}`);
            const response = await fetch('/api/user-favorites', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ line_user_id: userId, trip_id: tripId })
            });
            const data = await response.json();
            addLog(`移除收藏結果: ${data.success ? '成功' : '失敗'} - ${data.message}`);
            
            if (data.success) {
                setFavorites(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(tripId);
                    return newSet;
                });
                // 更新緩存
                const newFavorites = Array.from(favorites).filter(id => id !== tripId);
                localStorage.setItem(`userFavorites_${userId}`, JSON.stringify({
                    favorites: newFavorites,
                    timestamp: Date.now(),
                    userId: userId
                }));
                addLog(`緩存已更新: ${newFavorites.length} 個收藏`);
            }
        } catch (e) {
            addLog(`移除收藏失敗: ${e.message}`);
        }
    };

    // 清除緩存
    const clearCache = () => {
        localStorage.removeItem(`userFavorites_${userId}`);
        setCacheInfo(null);
        addLog('緩存已清除');
    };

    // 載入緩存到狀態
    const loadFromCache = () => {
        const cache = checkCache();
        if (cache && cache.favorites) {
            setFavorites(new Set(cache.favorites));
            addLog(`從緩存載入 ${cache.favorites.length} 個收藏到狀態`);
        }
    };

    useEffect(() => {
        addLog('頁面載入');
        checkCache();
        testAPI();
    }, []);

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <h1>收藏功能測試頁面</h1>
            
            <div style={{ marginBottom: '20px' }}>
                <h2>當前狀態</h2>
                <p><strong>用戶ID:</strong> {userId}</p>
                <p><strong>收藏數量:</strong> {favorites.size}</p>
                <p><strong>收藏列表:</strong> {Array.from(favorites).join(', ') || '無'}</p>
            </div>

            <div style={{ marginBottom: '20px' }}>
                <h2>緩存信息</h2>
                {cacheInfo ? (
                    <div>
                        <p><strong>緩存用戶ID:</strong> {cacheInfo.userId}</p>
                        <p><strong>緩存時間:</strong> {new Date(cacheInfo.timestamp).toLocaleString()}</p>
                        <p><strong>緩存收藏:</strong> {cacheInfo.favorites.join(', ')}</p>
                    </div>
                ) : (
                    <p>無緩存</p>
                )}
            </div>

            <div style={{ marginBottom: '20px' }}>
                <h2>API 回應</h2>
                {apiResponse ? (
                    <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
                        {JSON.stringify(apiResponse, null, 2)}
                    </pre>
                ) : (
                    <p>無 API 回應</p>
                )}
            </div>

            <div style={{ marginBottom: '20px' }}>
                <h2>操作</h2>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button onClick={() => addTestFavorite(1)}>添加收藏 1</button>
                    <button onClick={() => addTestFavorite(2)}>添加收藏 2</button>
                    <button onClick={() => addTestFavorite(3)}>添加收藏 3</button>
                    <button onClick={() => removeTestFavorite(1)}>移除收藏 1</button>
                    <button onClick={() => removeTestFavorite(2)}>移除收藏 2</button>
                    <button onClick={checkCache}>檢查緩存</button>
                    <button onClick={testAPI}>測試 API</button>
                    <button onClick={loadFromCache}>從緩存載入</button>
                    <button onClick={clearCache}>清除緩存</button>
                    <button onClick={() => setLogs([])}>清除日誌</button>
                </div>
            </div>

            <div>
                <h2>操作日誌</h2>
                <div style={{ 
                    background: '#f5f5f5', 
                    padding: '10px', 
                    borderRadius: '4px', 
                    height: '300px', 
                    overflowY: 'scroll',
                    fontFamily: 'monospace',
                    fontSize: '12px'
                }}>
                    {logs.map((log, index) => (
                        <div key={index}>{log}</div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TestFavorites;
