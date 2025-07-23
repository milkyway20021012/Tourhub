import axios from 'axios';

const api = axios.create({
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// 請求攔截器（可加 token、全域 loading 等）
api.interceptors.request.use(
    config => {
        // 這裡可加全域 loading 或 token
        return config;
    },
    error => Promise.reject(error)
);

// 回應攔截器（統一錯誤處理）
api.interceptors.response.use(
    response => response,
    error => {
        // 可在這裡統一處理 401/500 等錯誤
        // 例如自動跳轉登入、全域提示等
        return Promise.reject(error);
    }
);

export default api; 