import React from 'react';

const LoadingIndicator = ({ message = '載入中...' }) => (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px', background: 'white', borderRadius: '12px', margin: '16px 0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#3b82f6', fontSize: '16px', fontWeight: '500' }}>
            <div style={{ width: '20px', height: '20px', border: '2px solid #e5e7eb', borderTop: '2px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            {message}
            <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    </div>
);

export default React.memo(LoadingIndicator); 