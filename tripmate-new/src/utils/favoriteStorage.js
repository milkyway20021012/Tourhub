// 收藏資料持久化工具
class FavoriteStorage {
    constructor() {
        this.dbName = 'TripmateFavorites';
        this.dbVersion = 1;
        this.storeName = 'favorites';
        this.db = null;
    }

    // 初始化 IndexedDB
    async initDB() {
        if (typeof window === 'undefined') return null;
        
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => {
                console.error('IndexedDB 開啟失敗:', request.error);
                reject(request.error);
            };
            
            request.onsuccess = () => {
                this.db = request.result;
                console.log('IndexedDB 初始化成功');
                resolve(this.db);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const store = db.createObjectStore(this.storeName, { keyPath: 'userId' });
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                    console.log('IndexedDB 結構創建完成');
                }
            };
        });
    }

    // 保存收藏到 IndexedDB
    async saveFavorites(userId, favorites) {
        try {
            if (!this.db) {
                await this.initDB();
            }
            
            if (!this.db) {
                throw new Error('IndexedDB 不可用');
            }

            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            
            const data = {
                userId: userId,
                favorites: Array.from(favorites),
                timestamp: Date.now()
            };
            
            await new Promise((resolve, reject) => {
                const request = store.put(data);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
            
            console.log('收藏已保存到 IndexedDB:', data);
            
            // 同時保存到 localStorage 作為備用
            this.saveToLocalStorage(userId, favorites);
            
            return true;
        } catch (error) {
            console.error('保存收藏到 IndexedDB 失敗:', error);
            // 如果 IndexedDB 失敗，至少保存到 localStorage
            return this.saveToLocalStorage(userId, favorites);
        }
    }

    // 從 IndexedDB 載入收藏
    async loadFavorites(userId) {
        try {
            if (!this.db) {
                await this.initDB();
            }
            
            if (!this.db) {
                throw new Error('IndexedDB 不可用');
            }

            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            
            const data = await new Promise((resolve, reject) => {
                const request = store.get(userId);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
            
            if (data && Array.isArray(data.favorites)) {
                // 檢查資料是否過期（7天）
                const isValid = (Date.now() - data.timestamp) < 7 * 24 * 60 * 60 * 1000;
                
                if (isValid) {
                    console.log('從 IndexedDB 載入收藏:', data.favorites.length, '個');
                    return new Set(data.favorites);
                } else {
                    console.log('IndexedDB 收藏資料過期，清除');
                    this.clearFavorites(userId);
                }
            }
            
            // 如果 IndexedDB 沒有資料，嘗試從 localStorage 載入
            return this.loadFromLocalStorage(userId);
            
        } catch (error) {
            console.error('從 IndexedDB 載入收藏失敗:', error);
            // 如果 IndexedDB 失敗，從 localStorage 載入
            return this.loadFromLocalStorage(userId);
        }
    }

    // 清除收藏資料
    async clearFavorites(userId) {
        try {
            if (this.db) {
                const transaction = this.db.transaction([this.storeName], 'readwrite');
                const store = transaction.objectStore(this.storeName);
                store.delete(userId);
            }
        } catch (error) {
            console.error('清除 IndexedDB 收藏失敗:', error);
        }
        
        // 同時清除 localStorage
        try {
            localStorage.removeItem(`userFavorites_${userId}`);
        } catch (error) {
            console.error('清除 localStorage 收藏失敗:', error);
        }
    }

    // localStorage 備用方法
    saveToLocalStorage(userId, favorites) {
        try {
            const data = {
                favorites: Array.from(favorites),
                timestamp: Date.now(),
                userId: userId
            };
            localStorage.setItem(`userFavorites_${userId}`, JSON.stringify(data));
            console.log('收藏已保存到 localStorage:', data);
            return true;
        } catch (error) {
            console.error('保存到 localStorage 失敗:', error);
            return false;
        }
    }

    loadFromLocalStorage(userId) {
        try {
            const cached = localStorage.getItem(`userFavorites_${userId}`);
            if (cached) {
                const { favorites, timestamp, userId: cachedUserId } = JSON.parse(cached);
                
                // 檢查緩存是否有效（7天內且用戶ID匹配）
                const isValid = cachedUserId === userId &&
                    (Date.now() - timestamp) < 7 * 24 * 60 * 60 * 1000;
                
                if (isValid && Array.isArray(favorites)) {
                    console.log('從 localStorage 載入收藏:', favorites.length, '個');
                    return new Set(favorites);
                } else {
                    localStorage.removeItem(`userFavorites_${userId}`);
                }
            }
        } catch (error) {
            console.error('從 localStorage 載入收藏失敗:', error);
        }
        return new Set();
    }

    // 獲取存儲統計信息
    async getStorageInfo(userId) {
        const info = {
            indexedDB: null,
            localStorage: null,
            userId: userId
        };

        // 檢查 IndexedDB
        try {
            if (!this.db) await this.initDB();
            if (this.db) {
                const transaction = this.db.transaction([this.storeName], 'readonly');
                const store = transaction.objectStore(this.storeName);
                const data = await new Promise((resolve) => {
                    const request = store.get(userId);
                    request.onsuccess = () => resolve(request.result);
                    request.onerror = () => resolve(null);
                });
                info.indexedDB = data;
            }
        } catch (error) {
            console.error('檢查 IndexedDB 失敗:', error);
        }

        // 檢查 localStorage
        try {
            const cached = localStorage.getItem(`userFavorites_${userId}`);
            info.localStorage = cached ? JSON.parse(cached) : null;
        } catch (error) {
            console.error('檢查 localStorage 失敗:', error);
        }

        return info;
    }
}

// 創建全局實例
const favoriteStorage = new FavoriteStorage();

export default favoriteStorage;
