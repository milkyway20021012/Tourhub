/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // 移除無效的配置選項

  // 環境變數配置
  env: {
    MYSQL_HOST: process.env.MYSQL_HOST,
    MYSQL_USER: process.env.MYSQL_USER,
    MYSQL_PASSWORD: process.env.MYSQL_PASSWORD,
    MYSQL_DB: process.env.MYSQL_DB,
  },

  // 如果需要自定義 webpack 配置
  webpack: (config, { isServer }) => {
    // 自定義 webpack 配置（如果需要）
    return config
  },
}

export default nextConfig