import React from 'react';
import { useRouter } from 'next/router';

const NavigationMenu = () => {
    const router = useRouter();

    const menuItems = [
        { path: '/', label: '首頁', icon: '🏠' }
    ];

    const handleNavigation = (path) => {
        router.push(path);
    };

    return (
        <nav style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'white',
            borderTop: '1px solid #e4e4e7',
            boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.1), 0 -2px 4px -1px rgba(0, 0, 0, 0.06)',
            zIndex: 1000
        }}>
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                maxWidth: '500px',
                margin: '0 auto',
                padding: '12px 24px'
            }}>
                {menuItems.map((item) => (
                    <button
                        key={item.path}
                        onClick={() => handleNavigation(item.path)}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: router.pathname === item.path ? '#0ea5e9' : 'transparent',
                            color: router.pathname === item.path ? 'white' : '#71717a',
                            border: 'none',
                            padding: '12px 24px',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            fontWeight: '500',
                            minWidth: '80px'
                        }}
                    >
                        <span style={{ fontSize: '20px', marginBottom: '4px' }}>{item.icon}</span>
                        <span style={{ fontSize: '12px' }}>{item.label}</span>
                    </button>
                ))}
            </div>
        </nav>
    );
};

export default NavigationMenu;