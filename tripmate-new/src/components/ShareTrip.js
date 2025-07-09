// components/ShareTrip.js - 清理後的版本
import React, { useState } from 'react';
import styles from './ShareTrip.module.css';

const ShareTrip = ({ trip, details, onClose }) => {
    const [shareFormat, setShareFormat] = useState('text');
    const [selectedDetails, setSelectedDetails] = useState(new Set());
    const [includeBasicInfo, setIncludeBasicInfo] = useState(true);
    const [isSharing, setIsSharing] = useState(false);

    if (!trip) return null;

    // 格式化日期
    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
        return new Date(dateString).toLocaleDateString('zh-TW', options);
    };

    // 格式化時間
    const formatTime = (timeString) => {
        if (!timeString) return '';
        return timeString.substring(0, 5);
    };

    // 全選/取消全選
    const handleSelectAll = () => {
        if (selectedDetails.size === details.length) {
            setSelectedDetails(new Set());
        } else {
            setSelectedDetails(new Set(details.map(detail => detail.detail_id)));
        }
    };

    // 切換選擇特定項目
    const toggleDetailSelection = (detailId) => {
        const newSelected = new Set(selectedDetails);
        if (newSelected.has(detailId)) {
            newSelected.delete(detailId);
        } else {
            newSelected.add(detailId);
        }
        setSelectedDetails(newSelected);
    };

    // 生成文字版分享內容
    const generateShareText = () => {
        let shareText = '';

        // 基本資訊
        if (includeBasicInfo) {
            shareText += `🎯 ${trip.title}\n`;
            shareText += `📍 地區：${trip.area}\n`;
            shareText += `📅 日期：${formatDate(trip.start_date)} - ${formatDate(trip.end_date)}\n`;

            const durationDays = Math.ceil((new Date(trip.end_date) - new Date(trip.start_date)) / (1000 * 60 * 60 * 24)) + 1;
            shareText += `⏰ 天數：${durationDays}天\n\n`;

            if (trip.description) {
                shareText += `📝 說明：${trip.description}\n\n`;
            }
        }

        // 行程安排
        if (selectedDetails.size > 0) {
            shareText += `📋 行程安排：\n`;
            shareText += `${'='.repeat(20)}\n`;

            const selectedDetailsList = details.filter(detail => selectedDetails.has(detail.detail_id));

            // 按日期和時間排序
            selectedDetailsList.sort((a, b) => {
                const dateCompare = new Date(a.date) - new Date(b.date);
                if (dateCompare !== 0) return dateCompare;
                return a.start_time.localeCompare(b.start_time);
            });

            let currentDate = '';
            selectedDetailsList.forEach((detail, index) => {
                const detailDate = formatDate(detail.date);

                // 如果是新的日期，添加日期標題
                if (currentDate !== detailDate) {
                    if (currentDate !== '') shareText += '\n';
                    shareText += `📅 ${detailDate}\n`;
                    shareText += `${'-'.repeat(15)}\n`;
                    currentDate = detailDate;
                }

                shareText += `${formatTime(detail.start_time)} - ${formatTime(detail.end_time)}  📍 ${detail.location}\n`;
            });
        }

        shareText += `\n✨ 透過 Tourhub 分享 - 一起規劃美好旅程！`;

        return shareText;
    };

    // 生成簡短連結格式
    const generateShareLink = () => {
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        const tripUrl = `${baseUrl}/trip/${trip.trip_id}`;

        let shareText = `🎯 推薦行程：${trip.title}\n`;
        shareText += `📍 ${trip.area} | ⏰ ${Math.ceil((new Date(trip.end_date) - new Date(trip.start_date)) / (1000 * 60 * 60 * 24)) + 1}天\n`;
        shareText += `\n🔗 查看完整行程：${tripUrl}\n`;
        shareText += `\n✨ 透過 Tourhub 分享`;

        return shareText;
    };

    // 執行分享
    const handleShare = async () => {
        setIsSharing(true);

        try {
            let shareContent = '';

            switch (shareFormat) {
                case 'text':
                    shareContent = generateShareText();
                    break;
                case 'link':
                    shareContent = generateShareLink();
                    break;
                default:
                    shareContent = generateShareText();
            }

            // 記錄分享行為到後端
            try {
                const userId = getCurrentUserId();
                if (userId) {
                    await recordShareActivity(userId, trip.trip_id, shareFormat, selectedDetails.size);
                }
            } catch (error) {
                console.error('記錄分享活動失敗:', error);
            }

            // 執行分享
            await performShare(shareContent);

        } catch (error) {
            console.error('分享失敗:', error);
            alert('分享失敗，請稍後再試');
        } finally {
            setIsSharing(false);
        }
    };

    // 獲取當前用戶 ID
    const getCurrentUserId = () => {
        if (typeof window !== 'undefined' && window.liff) {
            try {
                return window.liff.getProfile().then(profile => profile.userId);
            } catch (error) {
                console.error('獲取用戶 ID 失敗:', error);
            }
        }
        return 'demo_user_123';
    };

    // 記錄分享活動
    const recordShareActivity = async (userId, tripId, format, itemCount) => {
        try {
            const response = await fetch('/api/user-shares', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    line_user_id: userId,
                    trip_id: tripId,
                    share_type: format,
                    share_content: {
                        format: format,
                        items_count: itemCount,
                        include_basic_info: includeBasicInfo
                    }
                })
            });

            if (!response.ok) {
                throw new Error('記錄分享失敗');
            }
        } catch (error) {
            console.error('記錄分享活動失敗:', error);
        }
    };

    // 執行分享動作
    const performShare = async (shareContent) => {
        // 優先使用 LINE 分享
        if (typeof window !== 'undefined' && window.liff) {
            try {
                await window.liff.shareTargetPicker([{
                    type: 'text',
                    text: shareContent
                }]);
                onClose(); // 分享成功後關閉彈窗
                return;
            } catch (error) {
                console.error('LINE 分享失敗:', error);
            }
        }

        // 備用：使用瀏覽器原生分享
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `${trip.title} - 行程分享`,
                    text: shareContent
                });
                onClose(); // 分享成功後關閉彈窗
                return;
            } catch (error) {
                if (error.name !== 'AbortError') {
                    console.error('瀏覽器分享失敗:', error);
                }
            }
        }

        // 最後備用：複製到剪貼簿
        await copyToClipboard(shareContent);
    };

    // 複製到剪貼簿
    const copyToClipboard = async (text) => {
        if (navigator.clipboard) {
            try {
                await navigator.clipboard.writeText(text);
                alert('✅ 行程內容已複製到剪貼簿！');
                onClose(); // 複製成功後關閉彈窗
            } catch (error) {
                console.error('複製失敗:', error);
                fallbackCopy(text);
            }
        } else {
            fallbackCopy(text);
        }
    };

    // 備用複製方法
    const fallbackCopy = (text) => {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();

        try {
            document.execCommand('copy');
            alert('✅ 行程內容已複製到剪貼簿！');
            onClose(); // 複製成功後關閉彈窗
        } catch (error) {
            console.error('複製失敗:', error);
            alert('❌ 複製失敗，請手動複製');
        }

        document.body.removeChild(textArea);
    };

    return (
        <div className={styles.shareOverlay} onClick={onClose}>
            <div className={styles.shareContainer} onClick={e => e.stopPropagation()}>
                <div className={styles.shareHeader}>
                    <h2>📤 分享行程</h2>
                    <button className={styles.closeButton} onClick={onClose}>&times;</button>
                </div>

                <div className={styles.shareContent}>
                    {/* 行程基本資訊 */}
                    <div className={styles.tripInfo}>
                        <h3>{trip.title}</h3>
                        <p>{trip.area} • {formatDate(trip.start_date)} - {formatDate(trip.end_date)}</p>
                    </div>

                    {/* 分享格式選擇 */}
                    <div className={styles.formatSelection}>
                        <h4>📋 分享格式</h4>
                        <div className={styles.formatOptions}>
                            <label className={styles.formatOption}>
                                <input
                                    type="radio"
                                    value="text"
                                    checked={shareFormat === 'text'}
                                    onChange={(e) => setShareFormat(e.target.value)}
                                />
                                <span>📝 詳細文字</span>
                                <small>包含完整行程安排</small>
                            </label>
                            <label className={styles.formatOption}>
                                <input
                                    type="radio"
                                    value="link"
                                    checked={shareFormat === 'link'}
                                    onChange={(e) => setShareFormat(e.target.value)}
                                />
                                <span>🔗 簡短連結</span>
                                <small>包含行程連結</small>
                            </label>
                        </div>
                    </div>

                    {/* 內容選擇 */}
                    {shareFormat === 'text' && (
                        <>
                            <div className={styles.contentSelection}>
                                <label className={styles.checkboxOption}>
                                    <input
                                        type="checkbox"
                                        checked={includeBasicInfo}
                                        onChange={(e) => setIncludeBasicInfo(e.target.checked)}
                                    />
                                    <span>包含基本資訊（標題、地區、日期等）</span>
                                </label>
                            </div>

                            {/* 行程細節選擇 */}
                            {details.length > 0 && (
                                <div className={styles.detailsSelection}>
                                    <div className={styles.selectionHeader}>
                                        <h4>🗓️ 選擇要分享的行程安排</h4>
                                        <button
                                            className={styles.selectAllButton}
                                            onClick={handleSelectAll}
                                        >
                                            {selectedDetails.size === details.length ? '取消全選' : '全選'}
                                        </button>
                                    </div>

                                    <div className={styles.detailsList}>
                                        {details.map((detail) => (
                                            <label key={detail.detail_id} className={styles.detailItem}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedDetails.has(detail.detail_id)}
                                                    onChange={() => toggleDetailSelection(detail.detail_id)}
                                                />
                                                <div className={styles.detailInfo}>
                                                    <div className={styles.detailDate}>
                                                        {formatDate(detail.date)}
                                                    </div>
                                                    <div className={styles.detailTime}>
                                                        {formatTime(detail.start_time)} - {formatTime(detail.end_time)}
                                                    </div>
                                                    <div className={styles.detailLocation}>
                                                        {detail.location}
                                                    </div>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* 預覽區域 */}
                    <div className={styles.previewSection}>
                        <h4>👀 分享預覽</h4>
                        <div className={styles.previewContent}>
                            <pre>{shareFormat === 'text' ? generateShareText() : generateShareLink()}</pre>
                        </div>
                    </div>

                    {/* 操作按鈕 */}
                    <div className={styles.shareActions}>
                        <button
                            className={styles.cancelButton}
                            onClick={onClose}
                        >
                            取消
                        </button>
                        <button
                            className={styles.shareButton}
                            onClick={handleShare}
                            disabled={isSharing || (shareFormat === 'text' && selectedDetails.size === 0 && !includeBasicInfo)}
                        >
                            {isSharing ? '🔄 分享中...' : '📤 立即分享'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShareTrip;