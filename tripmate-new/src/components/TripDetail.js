// components/TripDetail.js
import React from 'react';
import styles from './TripDetail.module.css';

const TripDetail = ({ trip, details, participants, onClose }) => {
  if (!trip) return null;

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatTime = (timeString) => {
    return timeString.substring(0, 5);
  };

  const tags = trip.tags ? trip.tags.split(',').map(tag => tag.trim()) : [];

  return (
    <div className={styles.tripDetailOverlay} onClick={onClose}>
      <div className={styles.tripDetailContainer} onClick={e => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>&times;</button>

        <div className={styles.tripDetailHeader}>
          <h2>{trip.title}</h2>
          <div className={styles.tripMeta}>
            <span className={styles.tripCreator}>由 {trip.creator_name} 創建</span>
            <span className={styles.tripViews}>👁️ {trip.view_count || 0} 次瀏覽</span>
          </div>
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
                  <label>結束日期</label>
                  <span>{formatDate(trip.end_date)}</span>
                </div>
                <div className={styles.infoItem}>
                  <label>預算</label>
                  <span>{trip.budget ? `${trip.budget}` : '未設定'}</span>
                </div>
              </div>
            </div>

            {trip.description && (
              <div className={styles.tripInfoSection}>
                <h3>行程介紹</h3>
                <p className={styles.tripDescription}>{trip.description}</p>
              </div>
            )}

            {tags.length > 0 && (
              <div className={styles.tripInfoSection}>
                <h3>標籤</h3>
                <div className={styles.tripTags}>
                  {tags.map((tag, index) => (
                    <span key={index} className={styles.tripTag}>{tag}</span>
                  ))}
                </div>
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

          <div className={styles.tripParticipants}>
            <h3>參與者 ({participants.length})</h3>
            <div className={styles.participantsList}>
              {participants.map((participant) => (
                <div key={participant.participant_id} className={`${styles.participantItem} ${styles[participant.status]}`}>
                  <span className={styles.participantName}>{participant.username}</span>
                  <span className={styles.participantStatus}>
                    {participant.status === 'accepted' ? '已接受' :
                      participant.status === 'invited' ? '已邀請' : '已拒絕'}
                  </span>
                </div>
              ))}
              {participants.length === 0 && (
                <p className={styles.noParticipants}>尚無參與者</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TripDetail;