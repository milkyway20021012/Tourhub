import React from 'react';
import { useRouter } from 'next/router';

const NavigationMenu = () => {
    const router = useRouter();

    const menuItems = [
        { path: '/', label: '🏠 首頁', description: '精選行程排行榜' },
        { path: '/favorites', label: '💖 我的收藏', description: '收藏的行程' }
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
            borderTop: '1px solid #e2e8f0',
            boxShadow: '0 -2px 8px rgba(0,0,0,0.1)',
            zIndex: 1000
        }}>
            <div style={{
                display: 'flex',
                maxWidth: '500px',
                margin: '0 auto',
                padding: '12px'
            }}>
                {menuItems.map((item) => (
                    <button
                        key={item.path}
                        onClick={() => handleNavigation(item.path)}
                        style={{
                            flex: 1,
                            background: router.pathname === item.path ? '#3182ce' : 'transparent',
                            color: router.pathname === item.path ? 'white' : '#718096',
                            border: 'none',
                            padding: '12px 8px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            textAlign: 'center',
                            margin: '0 4px',
                            transition: 'all 0.2s ease',
                            fontWeight: router.pathname === item.path ? '600' : '500'
                        }}
                        title={item.description}
                    >
                        <div style={{ lineHeight: 1.2 }}>
                            {item.label}
                        </div>
                    </button>
                ))}
            </div>
        </nav>
    );
};

export default NavigationMenu;