// hooks/useLiff.js - LIFF React Hook
import { useState, useEffect } from 'react';
import liffManager from '../utils/liff';

export const useLiff = (liffId) => {
    const [isReady, setIsReady] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userProfile, setUserProfile] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        initializeLiff();
    }, [liffId]);

    const initializeLiff = async () => {
        try {
            setLoading(true);
            setError(null);

            console.log('🔄 開始初始化 LIFF...');

            const success = await liffManager.init(liffId);
            setIsReady(true);

            if (success) {
                setIsLoggedIn(true);
                setUserProfile(liffManager.userProfile);
                console.log('✅ LIFF 初始化完成，用戶已登入');
            } else {
                setIsLoggedIn(false);
                console.log('⚠️ LIFF 初始化完成，用戶未登入');
            }

        } catch (err) {
            console.error('💥 LIFF 初始化錯誤:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const login = async () => {
        try {
            setError(null);
            await liffManager.login();
        } catch (err) {
            setError(err.message);
        }
    };

    const logout = () => {
        try {
            liffManager.logout();
            setIsLoggedIn(false);
            setUserProfile(null);
        } catch (err) {
            setError(err.message);
        }
    };

    const getUserId = () => {
        return liffManager.getUserId();
    };

    const getDisplayName = () => {
        return liffManager.getDisplayName();
    };

    const sendMessage = async (message) => {
        return await liffManager.sendMessage(message);
    };

    return {
        // 狀態
        isReady,
        isLoggedIn,
        userProfile,
        error,
        loading,

        // 方法
        login,
        logout,
        getUserId,
        getDisplayName,
        sendMessage,

        // LIFF 資訊
        isInClient: liffManager.isInClient(),

        // 重新初始化
        reinitialize: initializeLiff
    };
};