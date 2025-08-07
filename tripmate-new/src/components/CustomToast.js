import React from 'react';

const CustomToast = ({ message, type = 'info', onClose }) => {
    const typeMap = {
        success: {
            bg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            icon: '❤️',
            shadow: '0 8px 32px rgba(16, 185, 129, 0.3)'
        },
        error: {
            bg: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            icon: '💔',
            shadow: '0 8px 32px rgba(239, 68, 68, 0.3)'
        },
        warning: {
            bg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            icon: '⚠️',
            shadow: '0 8px 32px rgba(245, 158, 11, 0.3)'
        },
        info: {
            bg: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            icon: '🔔',
            shadow: '0 8px 32px rgba(59, 130, 246, 0.3)'
        }
    };
    const { bg, icon, shadow } = typeMap[type] || typeMap.info;

    React.useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 3000); // 改為 3 秒
        return () => clearTimeout(timer);
    }, [onClose]);
    return (
        <div className="Toast" style={{
            position: 'fixed',
            bottom: '30px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: bg,
            color: 'white',
            padding: '16px 24px',
            borderRadius: '16px',
            fontSize: '15px',
            fontWeight: '600',
            boxShadow: shadow,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            animation: 'toastSlideIn 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
            minWidth: '200px',
            maxWidth: '85vw',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            userSelect: 'none',
            // 手機優化
            '@media (max-width: 768px)': {
                bottom: '20px',
                fontSize: '14px',
                padding: '14px 20px',
                minWidth: '180px',
                maxWidth: '90vw'
            }
        }}>
            <div style={{
                fontSize: '18px',
                animation: 'iconPulse 0.6s ease-out'
            }}>
                {icon}
            </div>
            <span style={{
                flex: 1,
                textAlign: 'center',
                letterSpacing: '0.3px'
            }}>
                {message}
            </span>
            <style jsx>{`
                @keyframes toastSlideIn {
                    0% {
                        opacity: 0;
                        transform: translateX(-50%) translateY(100px) scale(0.8);
                    }
                    50% {
                        opacity: 1;
                        transform: translateX(-50%) translateY(-10px) scale(1.05);
                    }
                    100% {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0) scale(1);
                    }
                }

                @keyframes iconPulse {
                    0% { transform: scale(0.8); }
                    50% { transform: scale(1.2); }
                    100% { transform: scale(1); }
                }

                /* 手機端優化 */
                @media (max-width: 768px) {
                    .Toast {
                        bottom: 20px !important;
                        fontSize: 14px !important;
                        padding: 14px 20px !important;
                        minWidth: 180px !important;
                        maxWidth: 90vw !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default React.memo(CustomToast); 