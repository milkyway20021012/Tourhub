// 測試行程詳細內容功能的腳本
const api = require('./src/utils/api');

async function testTripDetails() {
  console.log('🧪 開始測試行程詳細內容功能...\n');

  try {
    // 1. 獲取沒有詳細行程的行程列表
    console.log('1️⃣ 獲取沒有詳細行程的行程列表...');
    const tripsResponse = await api.get('/api/trips-without-details');

    if (tripsResponse.data.success) {
      console.log(`✅ 找到 ${tripsResponse.data.count} 個沒有詳細行程內容的行程`);

      if (tripsResponse.data.data.length > 0) {
        const firstTrip = tripsResponse.data.data[0];
        console.log(`📋 第一個行程: ${firstTrip.title} (ID: ${firstTrip.trip_id})`);

        // 2. 為第一個行程添加詳細內容
        console.log('\n2️⃣ 為第一個行程添加詳細內容...');
        const addDetailsResponse = await api.post('/api/add-trip-details', {
          trip_id: firstTrip.trip_id
        });

        if (addDetailsResponse.data.success) {
          console.log(`✅ ${addDetailsResponse.data.message}`);
          console.log(`📊 添加了 ${addDetailsResponse.data.details_count} 個詳細景點`);

          // 3. 獲取行程詳情驗證
          console.log('\n3️⃣ 獲取行程詳情驗證...');
          const detailResponse = await api.get(`/api/trip-detail?id=${firstTrip.trip_id}`);

          if (detailResponse.data.success) {
            console.log(`✅ 行程詳情獲取成功`);
            console.log(`📋 行程標題: ${detailResponse.data.trip.title}`);
            console.log(`📍 地區: ${detailResponse.data.trip.area}`);
            console.log(`📅 日期: ${detailResponse.data.trip.start_date} 到 ${detailResponse.data.trip.end_date}`);
            console.log(`🎯 詳細景點數量: ${detailResponse.data.details.length}`);

            if (detailResponse.data.details.length > 0) {
              console.log('\n📝 前3個景點詳情:');
              detailResponse.data.details.slice(0, 3).forEach((detail, index) => {
                console.log(`   ${index + 1}. ${detail.location}`);
                console.log(`      時間: ${detail.date} ${detail.start_time}-${detail.end_time}`);
                console.log(`      詳細: ${detail.description}`);
              });
            }
          } else {
            console.log('❌ 獲取行程詳情失敗:', detailResponse.data.message);
          }
        } else {
          console.log('❌ 添加詳細內容失敗:', addDetailsResponse.data.message);
        }
      } else {
        console.log('ℹ️ 沒有找到需要添加詳細內容的行程');
      }
    } else {
      console.log('❌ 獲取行程列表失敗:', tripsResponse.data.message);
    }

    // 4. 測試批量添加功能
    console.log('\n4️⃣ 測試批量添加功能...');
    const batchResponse = await api.post('/api/batch-add-trip-details', { limit: 3 });

    if (batchResponse.data.success) {
      console.log(`✅ ${batchResponse.data.message}`);
      console.log(`📊 處理了 ${batchResponse.data.processed_count} 個行程`);
      console.log(`🎯 總共添加了 ${batchResponse.data.total_details_added} 個詳細景點`);

      if (batchResponse.data.results && batchResponse.data.results.length > 0) {
        console.log('\n📋 處理結果:');
        batchResponse.data.results.forEach((result, index) => {
          if (result.success) {
            console.log(`   ✅ ${index + 1}. ${result.title} - 添加了 ${result.details_count} 個景點`);
          } else {
            console.log(`   ❌ ${index + 1}. ${result.title} - 失敗: ${result.error}`);
          }
        });
      }
    } else {
      console.log('❌ 批量添加失敗:', batchResponse.data.message);
    }

  } catch (error) {
    console.error('❌ 測試過程中發生錯誤:', error.message);
    if (error.response) {
      console.error('伺服器回應:', error.response.data);
    }
  }

  console.log('\n🏁 測試完成！');
}

// 如果直接執行此腳本
if (require.main === module) {
  testTripDetails();
}

module.exports = { testTripDetails }; 