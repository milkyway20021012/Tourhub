/** @type {import('next').NextConfig} */
const nextConfig = {
  // 在開發環境中暫時關閉嚴格模式以減少 hydration 警告
  reactStrictMode: process.env.NODE_ENV === 'production',

  // 使用 SWC 編譯器進行更好的性能
  swcMinify: true,

  // 編譯器選項
  compiler: {
    // 在生產環境中移除 console.log，但保留 error 和 warn
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  },

  // 環境變數配置
  env: {
    MYSQL_HOST: process.env.MYSQL_HOST,
    MYSQL_USER: process.env.MYSQL_USER,
    MYSQL_PASSWORD: process.env.MYSQL_PASSWORD,
    MYSQL_DB: process.env.MYSQL_DB,
    // 添加 Node 環境變數
    NEXT_PUBLIC_NODE_ENV: process.env.NODE_ENV,
  },

  // 圖片優化配置
  images: {
    formats: ['image/webp', 'image/avif'],
    domains: [
      // 添加您允許的圖片域名
      'line.me', // 如果使用 LINE 頭像
    ],
  },

  // 簡化的 Webpack 配置（移除可能衝突的 CSS 規則）
  webpack: (config, { isServer, dev }) => {
    // 開發環境下的特殊處理
    if (dev && !isServer) {
      // 確保 React 模組正確解析
      config.resolve.alias = {
        ...config.resolve.alias,
        'react/jsx-dev-runtime': 'react/jsx-dev-runtime',
        'react/jsx-runtime': 'react/jsx-runtime',
      };
    }

    // 不要添加自定義的 CSS 處理規則，讓 Next.js 處理
    return config;
  },

  // 性能配置
  poweredByHeader: false,

  // 安全標頭
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;