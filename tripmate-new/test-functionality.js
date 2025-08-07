#!/usr/bin/env node

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// 測試結果記錄
const testResults = {
  passed: 0,
  failed: 0,
  errors: []
};

// 測試函數
async function test(name, testFn) {
  try {
    console.log(`🧪 測試: ${name}`);
    await testFn();
    console.log(`✅ ${name} - 通過`);
    testResults.passed++;
  } catch (error) {
    console.log(`❌ ${name} - 失敗: ${error.message}`);
    testResults.failed++;
    testResults.errors.push({ test: name, error: error.message });
  }
}

// 測試 API 端點
async function testAPI(endpoint, expectedStatus = 200) {
  const response = await axios.get(`${BASE_URL}${endpoint}`);
  if (response.status !== expectedStatus) {
    throw new Error(`期望狀態碼 ${expectedStatus}，實際 ${response.status}`);
  }
  return response.data;
}

// 主要測試函數
async function runTests() {
  console.log('🚀 開始功能測試...\n');

  // 測試首頁載入
  await test('首頁載入', async () => {
    const response = await axios.get(BASE_URL);
    if (response.status !== 200) {
      throw new Error('首頁載入失敗');
    }
  });

  // 測試統計 API
  await test('統計 API', async () => {
    const data = await testAPI('/api/trip-statistics');
    if (!data.overview || typeof data.overview.totalTrips !== 'number') {
      throw new Error('統計數據格式錯誤');
    }
  });

  // 測試行程排行榜 API
  await test('行程排行榜 API', async () => {
    const data = await testAPI('/api/trip-rankings-enhanced?type=all&page=1&limit=10&sort_by=popularity');
    if (!data.success || !Array.isArray(data.data)) {
      throw new Error('排行榜數據格式錯誤');
    }
  });

  // 測試篩選器 API
  await test('篩選器 API', async () => {
    const data = await testAPI('/api/get-filters');
    if (!Array.isArray(data.areas)) {
      throw new Error('篩選器數據格式錯誤');
    }
  });

  // 測試收藏 API
  await test('收藏 API', async () => {
    const data = await testAPI('/api/user-favorites?line_user_id=test_user');
    if (!data.success || !Array.isArray(data.favorites)) {
      throw new Error('收藏 API 數據格式錯誤');
    }
  });

  // 測試行程詳情 API
  await test('行程詳情 API', async () => {
    // 先獲取一個有效的行程 ID
    const rankingsData = await testAPI('/api/trip-rankings-enhanced?type=all&page=1&limit=1');
    if (rankingsData.data.length > 0) {
      const tripId = rankingsData.data[0].trip_id;
      const data = await testAPI(`/api/trip-detail?id=${tripId}`);
      if (!data.success || !data.trip) {
        throw new Error('行程詳情數據格式錯誤');
      }
    }
  });

  // 測試搜尋 API
  await test('搜尋 API', async () => {
    const data = await testAPI('/api/search-trips?keyword=台北&limit=5&offset=0');
    if (!data.success || !Array.isArray(data.trips)) {
      throw new Error('搜尋 API 數據格式錯誤');
    }
  });

  // 測試收藏頁面
  await test('收藏頁面載入', async () => {
    const response = await axios.get(`${BASE_URL}/favorites`);
    if (response.status !== 200) {
      throw new Error('收藏頁面載入失敗');
    }
  });

  // 測試不同排序方式
  await test('排序功能', async () => {
    const sortOptions = ['popularity', 'date', 'favorites'];
    for (const sort of sortOptions) {
      const data = await testAPI(`/api/trip-rankings-enhanced?type=all&page=1&limit=5&sort_by=${sort}`);
      if (!data.success) {
        throw new Error(`排序 ${sort} 失敗`);
      }
    }
  });

  // 測試分頁功能
  await test('分頁功能', async () => {
    const data = await testAPI('/api/trip-rankings-enhanced?type=all&page=2&limit=5');
    if (!data.success || !data.pagination) {
      throw new Error('分頁功能錯誤');
    }
  });

  // 輸出測試結果
  console.log('\n📊 測試結果:');
  console.log(`✅ 通過: ${testResults.passed}`);
  console.log(`❌ 失敗: ${testResults.failed}`);
  
  if (testResults.errors.length > 0) {
    console.log('\n❌ 失敗的測試:');
    testResults.errors.forEach(({ test, error }) => {
      console.log(`  - ${test}: ${error}`);
    });
  }

  if (testResults.failed === 0) {
    console.log('\n🎉 所有測試通過！');
  } else {
    console.log('\n⚠️  有測試失敗，請檢查上述錯誤');
    process.exit(1);
  }
}

// 執行測試
runTests().catch(error => {
  console.error('測試執行失敗:', error);
  process.exit(1);
});
