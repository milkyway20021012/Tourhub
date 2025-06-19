export const initializeLIFF = async (liffId) => {
    try {
        if (typeof window === 'undefined' || !window.liff) {
            console.warn('LIFF SDK 尚未載入');
            return null;
        }

        await window.liff.init({ liffId });

        const isLoggedIn = window.liff.isLoggedIn();

        if (!isLoggedIn) {
            console.log('用戶尚未登入，導向登入頁面');
            window.liff.login();
            return null;
        }

        const profile = await window.liff.getProfile();
        const context = window.liff.getContext();

        return {
            isLoggedIn: true,
            userId: context?.userId,
            profile: profile,
            context: context
        };
    } catch (error) {
        console.error('LIFF 初始化失敗:', error);
        return null;
    }
};

/**
 * 檢查是否在 LINE 環境中
 * @returns {boolean} 是否在 LINE 環境
 */
export const isInLineApp = () => {
    if (typeof window === 'undefined') return false;
    return window.liff && window.liff.isInClient();
};

/**
 * 獲取 LINE 用戶資訊
 * @returns {Promise<Object|null>} 用戶資訊
 */
export const getLineProfile = async () => {
    try {
        if (!window.liff || !window.liff.isLoggedIn()) {
            return null;
        }

        return await window.liff.getProfile();
    } catch (error) {
        console.error('獲取用戶資訊失敗:', error);
        return null;
    }
};

/**
 * LINE 分享功能
 * @param {Object} shareData - 分享資料
 * @returns {Promise<boolean>} 分享是否成功
 */
export const shareToLine = async (shareData) => {
    try {
        if (!window.liff) {
            throw new Error('LIFF SDK 未載入');
        }

        await window.liff.shareTargetPicker([{
            type: 'text',
            text: shareData.text || shareData
        }]);

        return true;
    } catch (error) {
        console.error('LINE 分享失敗:', error);
        return false;
    }
};

/**
 * 關閉 LIFF 視窗
 */
export const closeLIFF = () => {
    if (window.liff && window.liff.isInClient()) {
        window.liff.closeWindow();
    }
};

/**
 * 開啟外部瀏覽器
 * @param {string} url - 要開啟的 URL
 */
export const openExternalBrowser = (url) => {
    if (window.liff && window.liff.isInClient()) {
        window.liff.openWindow({
            url: url,
            external: true
        });
    } else {
        window.open(url, '_blank');
    }
};

// ===================================================
// 6. pages/statistics.js - 統計頁面
// ===================================================
import React from 'react';
import TripStatistics from '../components/TripStatistics';

const StatisticsPage = () => {
    return (
        <div>
            <TripStatistics />
        </div>
    );
};

export default StatisticsPage;