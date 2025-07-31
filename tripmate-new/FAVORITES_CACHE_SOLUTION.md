# 收藏功能緩存解決方案

## 問題描述
用戶反映：將行程加入收藏後，當重新開啟頁面時，該行程的愛心會回到灰色狀態（未收藏狀態）。

## 問題根本原因
1. **收藏狀態沒有持久化存儲**：收藏狀態只存在於 React state 中，頁面刷新後會丟失
2. **LIFF 初始化和收藏狀態載入的時機問題**：收藏狀態的載入依賴於 LIFF 登入狀態，但可能存在時序問題
3. **沒有本地緩存機制**：與搜尋歷史和統計資料不同，收藏狀態沒有使用 localStorage 作為備份

## 解決方案

### 1. 添加 localStorage 緩存機制

#### 在首頁 (`src/pages/index.js`) 的改進：

**新增功能：**
- `loadFavoritesFromCache(userId)`: 從 localStorage 載入收藏緩存
- 在 `fetchUserFavorites()` 中添加緩存保存邏輯
- 在 `toggleFavorite()` 中添加即時緩存更新
- 在 LIFF 初始化時立即嘗試載入緩存

**緩存策略：**
```javascript
// 緩存數據結構
{
  favorites: [1, 2, 3, 5, 8], // 收藏的行程 ID 陣列
  timestamp: 1640995200000,   // 緩存時間戳
  userId: "user123"           // 用戶 ID
}

// 緩存鍵名格式
userFavorites_${userId}
```

**緩存有效性檢查：**
- 緩存時間不超過 24 小時
- 用戶 ID 必須匹配
- 數據格式必須正確

#### 在排行榜組件 (`src/components/TripRankingEnhanced.js`) 的改進：

**新增功能：**
- 同樣的緩存載入和保存機制
- 在組件初始化時優先載入緩存
- 在收藏操作後即時更新緩存

### 2. 改進的載入流程

**原始流程：**
1. 頁面載入
2. LIFF 初始化
3. 用戶登入檢查
4. 從 API 載入收藏狀態
5. 顯示收藏狀態

**改進後的流程：**
1. 頁面載入
2. LIFF 初始化
3. 用戶登入檢查
4. **立即從緩存載入收藏狀態** ⭐
5. 從 API 載入最新收藏狀態（更新緩存）
6. 顯示收藏狀態

### 3. 容錯機制

**API 失敗時的備援：**
- 如果 API 請求失敗，自動嘗試從緩存載入
- 緩存載入失敗時，優雅降級到空收藏狀態

**緩存過期處理：**
- 自動檢查緩存時效性
- 過期緩存會被忽略
- 用戶 ID 不匹配的緩存會被忽略

## 技術實現細節

### 關鍵函數

#### 1. `loadFavoritesFromCache(userId)`
```javascript
const loadFavoritesFromCache = (userId) => {
  if (typeof window === 'undefined' || !userId) return false;
  
  try {
    const cacheKey = `userFavorites_${userId}`;
    const cached = localStorage.getItem(cacheKey);
    
    if (cached) {
      const { favorites, timestamp, userId: cachedUserId } = JSON.parse(cached);
      
      // 檢查緩存是否有效（24小時內且用戶ID匹配）
      const isValid = cachedUserId === userId && 
                     (Date.now() - timestamp) < 24 * 60 * 60 * 1000;
      
      if (isValid && Array.isArray(favorites)) {
        const favIds = new Set(favorites);
        dispatch({ type: 'SET_FAVORITES', favorites: favIds });
        console.log('從緩存載入收藏狀態:', favorites.length, '個收藏');
        return true;
      }
    }
  } catch (e) {
    console.error('載入收藏緩存失敗:', e);
  }
  return false;
};
```

#### 2. 緩存保存邏輯
```javascript
// 在 API 操作成功後保存緩存
try {
  const favoritesArray = Array.from(currentFavorites);
  localStorage.setItem(`userFavorites_${userId}`, JSON.stringify({
    favorites: favoritesArray,
    timestamp: Date.now(),
    userId: userId
  }));
} catch (e) {
  console.error('更新收藏緩存失敗:', e);
}
```

### 時序優化

**LIFF 初始化改進：**
```javascript
const isLoggedIn = window.liff.isLoggedIn();
if (isLoggedIn) {
  dispatch({ type: 'SET_LIFF_LOGGED_IN', value: true });
  const profile = await window.liff.getProfile();
  dispatch({ type: 'SET_USER_PROFILE', value: profile });
  
  // 立即嘗試載入緩存的收藏狀態，然後再從 API 更新
  const cacheLoaded = loadFavoritesFromCache(profile.userId);
  if (cacheLoaded) {
    console.log('已從緩存載入收藏狀態，稍後將從 API 更新');
  }
  
  setTimeout(() => {
    fetchUserFavorites();
  }, 100);
}
```

## 測試方案

### 測試文件
創建了 `test-favorites-cache.html` 用於測試緩存機制：

**測試項目：**
1. 添加收藏到緩存
2. 從緩存載入收藏
3. 清除緩存
4. 測試過期緩存
5. 顯示當前緩存狀態
6. 完整流程測試

### 手動測試步驟
1. 登入並收藏幾個行程
2. 刷新頁面，檢查愛心是否立即顯示為紅色
3. 清除瀏覽器緩存，再次測試
4. 測試網路斷線情況下的緩存載入

## 預期效果

**用戶體驗改善：**
- ✅ 頁面刷新後收藏狀態立即顯示
- ✅ 減少載入時間和閃爍
- ✅ 網路不穩定時仍能顯示收藏狀態
- ✅ 更流暢的用戶體驗

**技術優勢：**
- ✅ 降低 API 依賴
- ✅ 提高應用響應速度
- ✅ 增強離線體驗
- ✅ 減少伺服器負載

## 注意事項

1. **隱私考量**：緩存數據存儲在用戶本地，不會洩露給其他用戶
2. **存儲限制**：localStorage 有大小限制，但收藏數據通常很小
3. **瀏覽器兼容性**：現代瀏覽器都支持 localStorage
4. **緩存清理**：用戶可以手動清除瀏覽器緩存來重置狀態

## 後續優化建議

1. **Service Worker**：考慮使用 Service Worker 進行更高級的緩存管理
2. **IndexedDB**：對於大量數據可考慮使用 IndexedDB
3. **緩存同步**：實現多標籤頁間的緩存同步
4. **性能監控**：添加緩存命中率統計
