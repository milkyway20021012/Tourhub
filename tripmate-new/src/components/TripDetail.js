// components/TripDetail.js - 繁體中文版本
import React from 'react';
import styles from './TripDetail.module.css';

const TripDetail = ({ trip, details, participants, onClose }) => {
  if (!trip) return null;

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    return new Date(dateString).toLocaleDateString('zh-TW', options);
  };

  const formatTime = (timeString) => {
    return timeString.substring(0, 5);
  };

  return (
    <div className={styles.tripDetailOverlay} onClick={onClose}>
      <div className={styles.tripDetailContainer} onClick={e => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>&times;</button>

        <div className={styles.tripDetailHeader}>
          <h2>{trip.title}</h2>
        </div>

        <div className={styles.tripDetailContent}>
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
                  <label>預算</label>
                  <span>{trip.budget ? `${trip.budget}` : '未設定'}</span>
                </div>
                <div className={styles.infoItem}>
                  <label>建立時間</label>
                  <span>{formatDate(trip.created_at)}</span>
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

          <div className={styles.tripSchedule}>
            <h3>行程安排</h3>
            {details.length > 0 ? (
              <div className={styles.scheduleTimeline}>
                {details.map((detail) => (
                  <div key={detail.detail_id} className={styles.scheduleItem}>
                    <div className={styles.scheduleTime}>
                      <div className={styles.scheduleDate}>{formatDate(detail.date)}</div>
                      <div className={styles.scheduleHours}>{formatTime(detail.start_time)} - {formatTime(detail.end_time)}</div>
                    </div>
                    <div className={styles.scheduleDot}></div>
                    <div className={styles.scheduleContent}>
                      <h4>{detail.location}</h4>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.noDetails}>尚未安排行程細節</p>
            )}
          </div>

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
              <div className={styles.infoItem}>
                <label>行程狀態</label>
                <span>
                  {new Date(trip.start_date) > new Date()
                    ? '尚未開始'
                    : new Date(trip.end_date) < new Date()
                      ? '已結束'
                      : '進行中'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TripDetail;