import { query } from '../../lib/db';

// 各國家的景點資料庫
const countryAttractions = {
    '日本': {
        '東京': [
            { name: '淺草寺・雷門', description: '東京最古老的寺廟，感受傳統日本文化' },
            { name: '東京晴空塔・墨田水族館', description: '東京地標，俯瞰整個城市美景' },
            { name: '澀谷十字路口・忠犬八公像', description: '世界最繁忙的十字路口，體驗東京的活力' },
            { name: '明治神宮・原宿竹下通', description: '莊嚴的神社，體驗日本傳統婚禮文化' },
            { name: '東京迪士尼樂園・迪士尼海洋', description: '夢幻的迪士尼世界，適合親子遊玩' },
            { name: '上野公園・動物園', description: '春季賞櫻勝地，還有動物園和博物館' },
            { name: '秋葉原・電器街', description: '電器街，動漫愛好者的天堂' },
            { name: '銀座・築地市場', description: '高級購物區，精品店林立' },
            { name: '台場・彩虹橋', description: '現代化海濱區域，購物娛樂中心' },
            { name: '新宿御苑・都廳', description: '都市綠洲，春季賞櫻勝地' },
            { name: '池袋・陽光城', description: '購物娛樂中心，水族館和展望台' },
            { name: '六本木・東京中城', description: '時尚藝術區，現代建築群' }
        ],
        'tokyo': [
            { name: '淺草寺・雷門', description: '東京最古老的寺廟，感受傳統日本文化' },
            { name: '東京晴空塔・墨田水族館', description: '東京地標，俯瞰整個城市美景' },
            { name: '澀谷十字路口・忠犬八公像', description: '世界最繁忙的十字路口，體驗東京的活力' },
            { name: '明治神宮・原宿竹下通', description: '莊嚴的神社，體驗日本傳統婚禮文化' },
            { name: '東京迪士尼樂園・迪士尼海洋', description: '夢幻的迪士尼世界，適合親子遊玩' },
            { name: '上野公園・動物園', description: '春季賞櫻勝地，還有動物園和博物館' },
            { name: '秋葉原・電器街', description: '電器街，動漫愛好者的天堂' },
            { name: '銀座・築地市場', description: '高級購物區，精品店林立' },
            { name: '台場・彩虹橋', description: '現代化海濱區域，購物娛樂中心' },
            { name: '新宿御苑・都廳', description: '都市綠洲，春季賞櫻勝地' },
            { name: '池袋・陽光城', description: '購物娛樂中心，水族館和展望台' },
            { name: '六本木・東京中城', description: '時尚藝術區，現代建築群' }
        ],
        '大阪': [
            { name: '大阪城・天守閣', description: '日本三大名城之一，歷史文化遺產' },
            { name: '道頓堀・固力果跑男', description: '美食天堂，品嚐大阪特色小吃' },
            { name: '環球影城・哈利波特世界', description: '刺激的遊樂設施和哈利波特世界' },
            { name: '天保山摩天輪・海遊館', description: '欣賞大阪港美景' },
            { name: '心齋橋・美國村', description: '購物天堂，時尚品牌聚集地' },
            { name: '通天閣・新世界', description: '大阪地標，新世界區域的象徵' },
            { name: '大阪水族館・海遊館', description: '世界最大的水族館之一' },
            { name: '四天王寺・天王寺公園', description: '日本最古老的寺廟之一' }
        ],
        '京都': [
            { name: '金閣寺・龍安寺', description: '世界文化遺產，金碧輝煌的寺廟' },
            { name: '清水寺・地主神社', description: '京都最著名的寺廟，櫻花季節絕美' },
            { name: '伏見稻荷大社・千本鳥居', description: '千本鳥居，神秘的狐狸神社' },
            { name: '嵐山竹林・渡月橋', description: '寧靜的竹林小徑，竹林禪意' },
            { name: '二条城・御苑', description: '德川幕府的權力象徵' },
            { name: '祇園・花見小路', description: '藝伎文化，傳統日本風情' },
            { name: '銀閣寺・哲學之道', description: '簡樸優雅的禪宗寺廟' },
            { name: '天龍寺・竹林小徑', description: '世界文化遺產，禪宗名寺' }
        ],
        '北海道': [
            { name: '札幌市區・大通公園', description: '北海道開拓時代的象徵' },
            { name: '小樽運河・堺町通り', description: '浪漫的運河夜景，玻璃工藝品' },
            { name: '富良野薰衣草田', description: '夏季紫色花海，浪漫滿分' },
            { name: '美瑛青池・白鬚瀑布', description: '神秘的藍色池塘，如夢似幻' },
            { name: '函館山夜景・朝市', description: '世界三大夜景之一' },
            { name: '登別地獄谷・熊牧場', description: '日本著名溫泉鄉，地獄谷奇景' },
            { name: '新千歲機場商圈', description: '機場周邊購物美食' },
            { name: '洞爺湖・昭和新山', description: '火山湖美景，溫泉度假勝地' },
            { name: '旭川動物園', description: '北極熊和企鵝的樂園' },
            { name: '層雲峽・流星瀑布', description: '壯觀的峽谷和瀑布景觀' },
            { name: '知床半島・五湖', description: '世界自然遺產，原始自然風光' },
            { name: '網走・流冰', description: '冬季流冰觀賞，獨特自然現象' }
        ]
    },
    '韓國': {
        '首爾': [
            { name: '景福宮', description: '朝鮮王朝正宮，傳統韓式建築' },
            { name: '明洞', description: '購物天堂，美妝和時尚品牌' },
            { name: '南山首爾塔', description: '首爾地標，浪漫夜景' },
            { name: '弘大', description: '年輕人聚集地，藝術和美食' },
            { name: '東大門', description: '24小時購物區，批發市場' },
            { name: '北村韓屋村', description: '傳統韓式建築群，體驗古朝鮮生活' },
            { name: '梨花洞壁畫村', description: '藝術壁畫，文青打卡地' },
            { name: '樂天世界', description: '室內外遊樂園，適合親子' }
        ],
        '釜山': [
            { name: '海雲台海水浴場', description: '韓國最美海灘之一' },
            { name: '甘川洞文化村', description: '彩色房屋，藝術壁畫' },
            { name: '釜山塔', description: '釜山地標，俯瞰港口美景' },
            { name: '札嘎其市場', description: '韓國最大海鮮市場' },
            { name: '廣安里海水浴場', description: '現代化海灘，夜景迷人' },
            { name: '太宗台', description: '懸崖美景，海天一色' },
            { name: '梵魚寺', description: '千年古寺，佛教文化' },
            { name: '龍頭山公園', description: '櫻花季節絕美，城市綠洲' }
        ]
    },
    '泰國': {
        '曼谷': [
            { name: '大皇宮', description: '泰國王室宮殿，金碧輝煌' },
            { name: '臥佛寺', description: '巨大臥佛，傳統泰式按摩發源地' },
            { name: '鄭王廟', description: '黎明寺，湄南河畔美景' },
            { name: '考山路', description: '背包客天堂，夜市美食' },
            { name: '暹羅廣場', description: '現代購物中心，時尚聚集地' },
            { name: '水上市場', description: '傳統水上交易，體驗泰式生活' },
            { name: '四面佛', description: '曼谷最靈驗的佛像' },
            { name: '曼谷藝術文化中心', description: '現代藝術展覽，文青必訪' }
        ],
        '清邁': [
            { name: '雙龍寺', description: '清邁地標，金塔閃耀' },
            { name: '清邁古城', description: '歷史文化遺產，古寺林立' },
            { name: '素貼山', description: '清邁最高峰，雲霧繚繞' },
            { name: '週日夜市', description: '手工藝品，當地美食' },
            { name: '清邁大學', description: '泰北最高學府，校園美景' },
            { name: '茵他儂國家公園', description: '泰國最高峰，自然風光' },
            { name: '清邁夜間動物園', description: '夜間觀賞動物，獨特體驗' },
            { name: '清邁女子監獄按摩', description: '特色按摩服務，社會企業' }
        ]
    },
    '新加坡': {
        '新加坡': [
            { name: '濱海灣金沙', description: '三棟大樓相連，無邊際泳池' },
            { name: '魚尾獅公園', description: '新加坡象徵，必拍地標' },
            { name: '聖淘沙島', description: '度假勝地，環球影城' },
            { name: '牛車水', description: '華人聚集地，傳統美食' },
            { name: '小印度', description: '印度文化區，香料和紗麗' },
            { name: '烏節路', description: '購物天堂，精品店林立' },
            { name: '新加坡植物園', description: '世界文化遺產，蘭花園' },
            { name: '克拉碼頭', description: '河畔酒吧區，夜生活' }
        ]
    },
    '馬來西亞': {
        '吉隆坡': [
            { name: '雙子塔', description: '馬來西亞地標，世界最高雙塔' },
            { name: '獨立廣場', description: '歷史地標，英國殖民建築' },
            { name: '茨廠街', description: '唐人街，傳統華人文化' },
            { name: '國家清真寺', description: '伊斯蘭建築，莊嚴肅穆' },
            { name: '黑風洞', description: '印度教聖地，彩色階梯' },
            { name: '雲頂高原', description: '避暑勝地，賭場和遊樂園' },
            { name: '馬來西亞國家博物館', description: '歷史文化展覽' },
            { name: '吉隆坡塔', description: '電視塔，城市全景' }
        ],
        '檳城': [
            { name: '喬治市', description: '世界文化遺產，殖民建築' },
            { name: '升旗山', description: '纜車上山，涼爽氣候' },
            { name: '檳城壁畫', description: '街頭藝術，文青打卡' },
            { name: '姓氏橋', description: '華人水上村落' },
            { name: '檳城國家公園', description: '自然保護區，海灘美景' },
            { name: '檳城植物園', description: '熱帶植物，猴子樂園' },
            { name: '檳城美食街', description: '馬來西亞美食之都' },
            { name: '檳城大橋', description: '連接檳城和馬來半島' }
        ]
    },
    '越南': {
        '河內': [
            { name: '還劍湖', description: '河內市中心，傳說中的神劍' },
            { name: '胡志明陵寢', description: '越南國父紀念館' },
            { name: '文廟', description: '越南第一所大學，儒家文化' },
            { name: '三十六古街', description: '傳統手工藝，老城區風情' },
            { name: '河內大教堂', description: '哥德式建築，法國殖民遺跡' },
            { name: '西湖', description: '河內最大湖泊，休閒勝地' },
            { name: '越南民族學博物館', description: '少數民族文化展覽' },
            { name: '河內歌劇院', description: '法國殖民建築，藝術表演' }
        ],
        '胡志明市': [
            { name: '統一宮', description: '越南戰爭結束地，歷史見證' },
            { name: '西貢聖母大教堂', description: '紅磚教堂，法國殖民建築' },
            { name: '中央郵局', description: '哥德式建築，法式風情' },
            { name: '范五老街', description: '背包客聚集地，夜市美食' },
            { name: '湄公河三角洲', description: '水上市場，稻田風光' },
            { name: '古芝地道', description: '越戰遺跡，地下隧道' },
            { name: '胡志明市美術館', description: '越南藝術，殖民建築' },
            { name: '濱城市場', description: '最大市場，當地生活' }
        ]
    },
    '台灣': {
        '台北': [
            { name: '台北101', description: '台北地標，世界最高綠建築' },
            { name: '故宮博物院', description: '中華文化瑰寶，文物展覽' },
            { name: '士林夜市', description: '台灣最大夜市，美食天堂' },
            { name: '陽明山國家公園', description: '火山地形，溫泉和花季' },
            { name: '九份老街', description: '山城風情，宮崎駿靈感來源' },
            { name: '淡水老街', description: '河岸風光，夕陽美景' },
            { name: '西門町', description: '年輕人聚集地，時尚購物' },
            { name: '貓空纜車', description: '茶園風光，夜景迷人' }
        ],
        '台中': [
            { name: '逢甲夜市', description: '台灣最大夜市，美食聚集' },
            { name: '彩虹眷村', description: '彩色壁畫，藝術創作' },
            { name: '高美濕地', description: '夕陽美景，生態保護區' },
            { name: '台中公園', description: '百年公園，湖心亭' },
            { name: '東海大學', description: '路思義教堂，建築之美' },
            { name: '新社花海', description: '季節性花海，浪漫滿分' },
            { name: '大坑步道', description: '登山健行，自然風光' },
            { name: '台中歌劇院', description: '現代建築，藝術表演' }
        ]
    }
};

// 生成隨機時間
function generateRandomTime() {
    const hours = Math.floor(Math.random() * 12) + 8; // 8:00 - 19:00
    const minutes = Math.floor(Math.random() * 4) * 15; // 0, 15, 30, 45
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

// 生成行程詳細內容
function generateTripDetails(trip, days) {
    const details = [];
    const area = trip.area || '日本'; // 預設為日本

    // 根據地區選擇對應的景點
    let attractions = [];

    // 檢查是否有直接對應的地區
    if (countryAttractions['日本'][area]) {
        attractions = countryAttractions['日本'][area];
    } else {
        // 如果沒有直接對應的地區，隨機選擇一個城市
        const cities = countryAttractions['日本'];
        const cityNames = Object.keys(cities);
        const selectedCity = cityNames[Math.floor(Math.random() * cityNames.length)];
        attractions = cities[selectedCity];
    }

    for (let day = 1; day <= days; day++) {
        // 每天只安排1個主要景點
        const shuffledAttractions = [...attractions].sort(() => Math.random() - 0.5);
        const attraction = shuffledAttractions[0]; // 只取第一個景點

        // 生成更合理的時間範圍
        const startHour = Math.floor(Math.random() * 4) + 8; // 8:00 - 11:00
        const startMinute = Math.floor(Math.random() * 4) * 15; // 0, 15, 30, 45
        const startTime = `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`;

        // 結束時間在開始時間後6-10小時
        const duration = Math.floor(Math.random() * 5) + 6;
        const endHour = (startHour + duration) % 24;
        const endTime = `${endHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`;

        const date = new Date(trip.start_date);
        date.setDate(date.getDate() + day - 1);

        // 格式化日期為中文格式
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const dayOfMonth = date.getDate();
        const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
        const weekday = weekdays[date.getDay()];

        const formattedDate = `${year}年${month}月${dayOfMonth}日 ${weekday}`;

        details.push({
            trip_id: trip.trip_id,
            location: `${attraction.name}`,
            date: date.toISOString().split('T')[0],
            start_time: startTime,
            end_time: endTime,
            description: `${formattedDate}\n${startTime} - ${endTime}\n${attraction.name}`
        });
    }

    return details;
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: '不允許的請求方法' });
    }

    try {
        const { trip_id } = req.body;

        if (!trip_id) {
            return res.status(400).json({ message: '缺少行程 ID' });
        }

        // 檢查行程是否存在
        const tripSql = `
      SELECT 
        trip_id,
        title,
        description,
        start_date,
        end_date,
        area
      FROM line_trips 
      WHERE trip_id = ?
    `;

        const tripResult = await query(tripSql, [parseInt(trip_id)]);

        if (tripResult.length === 0) {
            return res.status(404).json({ message: '找不到該行程' });
        }

        const trip = tripResult[0];

        // 檢查是否已有詳細行程
        const existingDetailsSql = `
      SELECT COUNT(*) as count
      FROM line_trip_details 
      WHERE trip_id = ?
    `;

        const existingDetails = await query(existingDetailsSql, [parseInt(trip_id)]);

        if (existingDetails[0].count > 0) {
            return res.status(400).json({ message: '該行程已有詳細內容' });
        }

        // 計算行程天數
        const startDate = new Date(trip.start_date);
        const endDate = new Date(trip.end_date);
        const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

        // 生成詳細行程
        const details = generateTripDetails(trip, days);

        // 插入詳細行程到資料庫
        const insertSql = `
      INSERT INTO line_trip_details 
      (trip_id, location, date, start_time, end_time, description) 
      VALUES (?, ?, ?, ?, ?, ?)
    `;

        for (const detail of details) {
            await query(insertSql, [
                detail.trip_id,
                detail.location,
                detail.date,
                detail.start_time,
                detail.end_time,
                detail.description
            ]);
        }

        res.status(200).json({
            success: true,
            message: `已為行程「${trip.title}」添加 ${details.length} 個詳細景點`,
            trip_id: trip.trip_id,
            details_count: details.length,
            days: days
        });

    } catch (error) {
        console.error('add-trip-details API 錯誤:', error);
        res.status(500).json({
            success: false,
            message: '伺服器錯誤',
            error: error.message
        });
    }
} 