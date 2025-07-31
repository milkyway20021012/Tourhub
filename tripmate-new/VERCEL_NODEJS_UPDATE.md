# Vercel Node.js 版本更新指南

## 問題說明 ⚠️
Node.js 18.x 將於 2025年4月結束生命週期支援，Vercel 也將在 2025年9月1日停止支援 Node.js 18.x 的新建構。

## 解決方案 ✅

### 1. 已完成的自動更新
我已經為您的專案進行了以下更新：

#### A. 創建 `vercel.json` 設定檔
```json
{
  "functions": {
    "src/pages/api/**/*.js": {
      "runtime": "nodejs20.x"
    }
  },
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next",
      "config": {
        "runtime": "nodejs20.x"
      }
    }
  ],
  "env": {
    "NODE_VERSION": "20"
  }
}
```

#### B. 更新 `package.json`
添加了 engines 欄位：
```json
{
  "engines": {
    "node": ">=20.0.0",
    "npm": ">=9.0.0"
  }
}
```

### 2. Vercel 部署設定更新

#### 方法一：通過 Vercel Dashboard（推薦）
1. 登入 [Vercel Dashboard](https://vercel.com/dashboard)
2. 選擇您的 `tripmate-new` 專案
3. 進入 **Settings** 頁面
4. 點擊 **General** 標籤
5. 找到 **Node.js Version** 設定
6. 將版本從 `18.x` 更改為 `20.x`
7. 點擊 **Save** 儲存設定

#### 方法二：通過 Vercel CLI
```bash
# 安裝 Vercel CLI（如果尚未安裝）
npm i -g vercel

# 登入 Vercel
vercel login

# 在專案目錄中執行
cd tripmate-new
vercel --prod
```

### 3. 環境變數檢查
確保以下環境變數在 Vercel 中正確設定：
- `DATABASE_URL` 或相關資料庫連線設定
- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`
- 其他必要的環境變數

### 4. 部署驗證

#### 本地測試
```bash
# 確保本地建構正常
cd tripmate-new
npm run build
npm run start
```

#### Vercel 部署測試
```bash
# 部署到 Vercel
vercel --prod
```

### 5. Node.js 版本對照表

| 版本 | 狀態 | 支援期限 | 建議 |
|------|------|----------|------|
| Node.js 16.x | ❌ EOL | 已結束 | 立即升級 |
| Node.js 18.x | ⚠️ 即將EOL | 2025年4月 | 需要升級 |
| Node.js 20.x | ✅ LTS | 2026年4月 | **推薦使用** |
| Node.js 22.x | ✅ LTS | 2027年4月 | 可選擇 |
| Node.js 23.x | ✅ Current | - | 最新版本 |

### 6. 相容性檢查

#### Next.js 相容性
- **Next.js 14.x**：完全支援 Node.js 20.x ✅
- **React 18.x**：完全支援 Node.js 20.x ✅
- **MySQL2**：完全支援 Node.js 20.x ✅

#### 依賴套件檢查
所有當前使用的套件都與 Node.js 20.x 相容：
- `@line/liff`: ✅
- `axios`: ✅
- `mysql2`: ✅
- `eslint`: ✅

### 7. 效能提升 🚀

升級到 Node.js 20.x 將帶來：
- **更好的效能**：V8 引擎優化
- **更低的記憶體使用**：垃圾回收改進
- **更快的啟動時間**：模組載入優化
- **更好的安全性**：最新的安全補丁

### 8. 故障排除

#### 常見問題
1. **建構失敗**
   ```bash
   # 清除快取並重新安裝
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

2. **API 路由問題**
   - 檢查 `vercel.json` 中的 functions 設定
   - 確保所有 API 路由都指定了正確的 runtime

3. **環境變數問題**
   - 在 Vercel Dashboard 中重新檢查所有環境變數
   - 確保沒有遺漏任何必要的設定

#### 回滾方案
如果升級後出現問題，可以暫時回滾：
1. 在 Vercel Dashboard 中將 Node.js 版本改回 `18.x`
2. 移除或註解 `vercel.json` 中的 runtime 設定
3. 重新部署

### 9. 檢查清單 ✅

部署前請確認：
- [ ] `vercel.json` 檔案已創建並設定正確
- [ ] `package.json` 中的 engines 欄位已更新
- [ ] 本地測試通過（`npm run build` 成功）
- [ ] Vercel Dashboard 中的 Node.js 版本已更新為 20.x
- [ ] 所有環境變數都已正確設定
- [ ] 部署測試成功

### 10. 後續維護

#### 定期檢查
- 每季度檢查 Node.js 版本更新
- 關注 Vercel 平台公告
- 監控應用程式效能指標

#### 升級策略
- 優先使用 LTS 版本
- 在測試環境先驗證
- 保持依賴套件更新

## 總結

通過以上設定，您的 Vercel 部署將使用 Node.js 20.x，確保：
1. ✅ 避免 Node.js 18.x EOL 問題
2. ✅ 獲得更好的效能和安全性
3. ✅ 保持長期支援和穩定性
4. ✅ 符合現代開發最佳實踐

如果在部署過程中遇到任何問題，請檢查 Vercel 的建構日誌並參考故障排除章節。
