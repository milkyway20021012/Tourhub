// utils/liff.js - LIFF 工具函數
class LiffManager {
    constructor() {
        this.isInitialized = false;
        this.userProfile = null;
        this.accessToken = null;
        this.liff = null;
    }

    // 動態載入 LIFF
    async loadLiff() {
        if (typeof window === 'undefined') {
            return null;
        }

        if (!this.liff) {
            try {
                const liffModule = await import('@line/liff');
                this.liff = liffModule.default;
            } catch (error) {
                console.error('💥 載入 LIFF 模組失敗:', error);
                return null;
            }
        }

        return this.liff;
    }

    // 初始化 LIFF
    async init(liffId) {
        try {
            console.log('🚀 初始化 LIFF...');

            if (typeof window === 'undefined') {
                console.log('⚠️ 服務器端，跳過 LIFF 初始化');
                return false;
            }

            const liff = await this.loadLiff();
            if (!liff) {
                console.error('💥 無法載入 LIFF 模組');
                return false;
            }

            await liff.init({ liffId });
            this.isInitialized = true;
            console.log('✅ LIFF 初始化成功');

            // 檢查是否已登入
            if (liff.isLoggedIn()) {
                console.log('✅ 用戶已登入');
                await this.getUserProfile();
                return true;
            } else {
                console.log('⚠️ 用戶未登入');
                return false;
            }

        } catch (error) {
            console.error('💥 LIFF 初始化失敗:', error);
            return false;
        }
    }

    // 登入
    async login() {
        try {
            if (!this.isInitialized || typeof window === 'undefined') {
                throw new Error('LIFF 尚未初始化或不在瀏覽器環境中');
            }

            const liff = await this.loadLiff();
            if (!liff) {
                throw new Error('無法載入 LIFF 模組');
            }

            console.log('🔐 開始登入...');
            liff.login();
        } catch (error) {
            console.error('💥 登入失敗:', error);
            throw error;
        }
    }

    // 登出
    async logout() {
        try {
            if (typeof window === 'undefined') {
                return;
            }

            const liff = await this.loadLiff();
            if (!liff) {
                return;
            }

            if (liff.isLoggedIn()) {
                liff.logout();
                this.userProfile = null;
                this.accessToken = null;
                console.log('👋 登出成功');
            }
        } catch (error) {
            console.error('💥 登出失敗:', error);
        }
    }

    // 獲取用戶資料
    async getUserProfile() {
        try {
            if (typeof window === 'undefined') {
                return null;
            }

            const liff = await this.loadLiff();
            if (!liff || !liff.isLoggedIn()) {
                throw new Error('用戶未登入');
            }

            console.log('👤 獲取用戶資料...');

            // 獲取用戶檔案
            this.userProfile = await liff.getProfile();

            // 獲取 Access Token
            this.accessToken = liff.getAccessToken();

            console.log('✅ 用戶資料獲取成功:', {
                userId: this.userProfile.userId,
                displayName: this.userProfile.displayName
            });

            return this.userProfile;
        } catch (error) {
            console.error('💥 獲取用戶資料失敗:', error);
            throw error;
        }
    }

    // 獲取用戶 ID
    getUserId() {
        return this.userProfile?.userId || null;
    }

    // 獲取用戶顯示名稱
    getDisplayName() {
        return this.userProfile?.displayName || '訪客';
    }

    // 獲取用戶頭像
    getPictureUrl() {
        return this.userProfile?.pictureUrl || null;
    }

    // 檢查是否在 LINE 環境中
    async isInClient() {
        if (typeof window === 'undefined') {
            return false;
        }

        const liff = await this.loadLiff();
        return liff ? liff.isInClient() : false;
    }

    // 檢查是否已登入
    async isLoggedIn() {
        if (typeof window === 'undefined' || !this.isInitialized) {
            return false;
        }

        const liff = await this.loadLiff();
        return liff ? liff.isLoggedIn() : false;
    }

    // 關閉 LIFF 應用
    async closeWindow() {
        if (typeof window === 'undefined') {
            return;
        }

        const liff = await this.loadLiff();
        if (liff && await this.isInClient()) {
            liff.closeWindow();
        }
    }

    // 發送訊息到聊天室（如果在 LINE 內）
    async sendMessage(message) {
        try {
            if (typeof window === 'undefined') {
                console.log('⚠️ 服務器端環境，無法發送訊息');
                return false;
            }

            const liff = await this.loadLiff();
            if (!liff) {
                console.log('⚠️ LIFF 模組未載入，無法發送訊息');
                return false;
            }

            if (!(await this.isInClient())) {
                console.log('⚠️ 不在 LINE 客戶端內，無法發送訊息');
                return false;
            }

            await liff.sendMessages([{
                type: 'text',
                text: message
            }]);

            console.log('✅ 訊息發送成功');
            return true;
        } catch (error) {
            console.error('💥 發送訊息失敗:', error);
            return false;
        }
    }
}

// 創建全局實例
const liffManager = new LiffManager();

export default liffManager;