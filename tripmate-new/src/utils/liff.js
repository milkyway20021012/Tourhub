// utils/liff.js - LIFF 工具函數
import liff from '@line/liff';

class LiffManager {
    constructor() {
        this.isInitialized = false;
        this.userProfile = null;
        this.accessToken = null;
    }

    // 初始化 LIFF
    async init(liffId) {
        try {
            console.log('🚀 初始化 LIFF...');

            if (typeof window === 'undefined') {
                console.log('⚠️ 服務器端，跳過 LIFF 初始化');
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
            if (!this.isInitialized) {
                throw new Error('LIFF 尚未初始化');
            }

            console.log('🔐 開始登入...');
            liff.login();
        } catch (error) {
            console.error('💥 登入失敗:', error);
            throw error;
        }
    }

    // 登出
    logout() {
        try {
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
            if (!liff.isLoggedIn()) {
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
    isInClient() {
        return liff.isInClient();
    }

    // 檢查是否已登入
    isLoggedIn() {
        return this.isInitialized && liff.isLoggedIn();
    }

    // 關閉 LIFF 應用
    closeWindow() {
        if (liff.isInClient()) {
            liff.closeWindow();
        }
    }

    // 發送訊息到聊天室（如果在 LINE 內）
    async sendMessage(message) {
        try {
            if (!liff.isInClient()) {
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