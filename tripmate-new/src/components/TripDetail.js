// components/TripDetail.js - 清理後的版本
import React, { useState } from 'react';
import ShareTrip from './ShareTrip';
import styles from './TripDetail.module.css';

const TripDetail = ({ trip, details, participants, onClose }) => {
  const [showShareModal, setShowShareModal] = useState(false);

  if (!trip) return null;

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    return new Date(dateString).toLocaleDateString('zh-TW', options);
  };

  const formatTime = (timeString) => {
    return timeString.substring(0, 5);
  };

  const handleShareClick = (e) => {
    e.stopPropagation();
    setShowShareModal(true);
  };

  const handleCloseShare = () => {
    setShowShareModal(false);
  };

  return (
    <>
      <div className={styles.tripDetailOverlay} onClick={onClose}>
        <div className={styles.tripDetailContainer} onClick={e => e.stopPropagation()}>
          {/* 標題列 */}
          <div className={styles.tripDetailHeader}>
            <h2>{trip.title}</h2>
            <div className={styles.headerActions}>
              <button
                className={styles.shareButton}
                onClick={handleShareClick}
                title="分享行程"
              >
                📤 分享
              </button>
              <button className={styles.closeButton} onClick={onClose}>&times;</button>
            </div>
          </div>

          <div className={styles.tripDetailContent}>
            {/* 行程資訊面板 */}
            <div className={styles.tripInfoPanel}>
              <div className={styles.tripInfoSection}>
                <h3>行程資訊</h3>
                <div className={styles.tripInfoGrid}>
                  <div className={styles.infoItem}>
                    <label>地區</label>
                    <span>{trip.area}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <label>開始日期</label>
                    <span>{formatDate(trip.start_date)}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <label>結束日期</label>
                    <span>{formatDate(trip.end_date)}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <label>行程天數</label>
                    <span>
                      {Math.ceil((new Date(trip.end_date) - new Date(trip.start_date)) / (1000 * 60 * 60 * 24)) + 1} 天
                    </span>
                  </div>
                  {trip.updated_at !== trip.created_at && (
                    <div className={styles.infoItem}>
                      <label>更新時間</label>
                      <span>{formatDate(trip.updated_at)}</span>
                    </div>
                  )}
                </div>
              </div>

              {trip.description && (
                <div className={styles.tripInfoSection}>
                  <h3>行程介紹</h3>
                  <p className={styles.tripDescription}>{trip.description}</p>
                </div>
              )}
            </div>

            {/* 行程安排 */}
            <div className={styles.tripSchedule}>
              <div className={styles.scheduleHeader}>
                <h3>行程安排</h3>
                {details.length > 0 && (
                  <button
                    className={styles.shareScheduleButton}
                    onClick={handleShareClick}
                  >
                    📤 分享行程安排
                  </button>
                )}
              </div>

              {details.length > 0 ? (
                <div className={styles.scheduleTimeline}>
                  {details.map((detail) => (
                    <div key={detail.detail_id} className={styles.scheduleItem}>
                      <div className={styles.scheduleTime}>
                        <div className={styles.scheduleDate}>{formatDate(detail.date)}</div>
                        <div className={styles.scheduleHours}>
                          {formatTime(detail.start_time)} - {formatTime(detail.end_time)}
                        </div>
                      </div>
                      <div className={styles.scheduleDot}></div>
                      <div className={styles.scheduleContent}>
                        <h4>{detail.location}</h4>
                        {detail.description && (
                          <p className={styles.scheduleDescription}>{detail.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.noDetails}>
                  <div className={styles.noDetailsIcon}>📅</div>
                  <p>尚未安排行程細節</p>
                  <small>這個行程還沒有詳細的時間安排</small>
                </div>
              )}
            </div>

            {/* 統計資訊 */}
            <div className={styles.tripStats}>
              <h3>統計資訊</h3>
              <div className={styles.tripInfoGrid}>
                <div className={styles.infoItem}>
                  <label>行程天數</label>
                  <span>
                    {Math.ceil((new Date(trip.end_date) - new Date(trip.start_date)) / (1000 * 60 * 60 * 24)) + 1} 天
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <label>詳細安排</label>
                  <span>{details.length} 項活動</span>
                </div>
                <div className={styles.infoItem}>
                  <label>參與人數</label>
                  <span>{participants.length} 人</span>
                </div>
                {trip.share_count && (
                  <div className={styles.infoItem}>
                    <label>分享次數</label>
                    <span>{trip.share_count} 次</span>
                  </div>
                )}
              </div>
            </div>

            {/* 快速動作區域 */}
            <div className={styles.quickActions}>
              <button
                className={styles.actionButton}
                onClick={handleShareClick}
              >
                <span className={styles.actionIcon}>📤</span>
                <span>分享此行程</span>
              </button>

              {details.length > 0 && (
                <button
                  className={styles.actionButton}
                  onClick={() => {
                    alert('匯出功能開發中...');
                  }}
                >
                  <span className={styles.actionIcon}>📄</span>
                  <span>匯出行程表</span>
                </button>
              )}

              <button
                className={styles.actionButton}
                onClick={() => {
                  const url = `${window.location.origin}/trip/${trip.trip_id}`;
                  navigator.clipboard.writeText(url).then(() => {
                    alert('行程連結已複製到剪貼簿！');
                  }).catch(() => {
                    alert('複製失敗，請手動複製連結');
                  });
                }}
              >
                <span className={styles.actionIcon}>🔗</span>
                <span>複製連結</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 分享彈窗 */}
      {showShareModal && (
        <ShareTrip
          trip={trip}
          details={details}
          onClose={handleCloseShare}
        />
      )}
    </>
  );
};

export default TripDetail;