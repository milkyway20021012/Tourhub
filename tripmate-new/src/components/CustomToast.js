import React from 'react';

const CustomToast = ({ message, type = 'info', onClose }) => {
    const typeMap = {
        success: { bg: '#22c55e', icon: '✅' },
        error: { bg: '#ef4444', icon: '❌' },
        warning: { bg: '#f59e42', icon: '⚠️' },
        info: { bg: '#323232', icon: '🔔' }
    };
    const { bg, icon } = typeMap[type] || typeMap.info;
    React.useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 5000);
        return () => clearTimeout(timer);
    }, [onClose]);
    return (
        <div className="Toast" style={{
            position: 'fixed',
            bottom: '40px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: bg,
            color: 'white',
            padding: '14px 32px',
            borderRadius: '24px',
            fontSize: '16px',
            fontWeight: '500',
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            zIndex: 9999,
            opacity: 0.95,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            animation: 'fadeInUp 0.3s',
            minWidth: '220px',
            maxWidth: '90vw',
            wordBreak: 'break-all',
        }}>
            <span>{icon}</span>
            <span>{message}</span>
            <button onClick={onClose} style={{
                background: 'none',
                border: 'none',
                color: 'white',
                fontSize: '18px',
                marginLeft: '12px',
                cursor: 'pointer',
                opacity: 0.7
            }}>×</button>
            <style jsx>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px) translateX(-50%); }
          to { opacity: 0.95; transform: translateY(0) translateX(-50%); }
        }
      `}</style>
        </div>
    );
};

export default React.memo(CustomToast); 