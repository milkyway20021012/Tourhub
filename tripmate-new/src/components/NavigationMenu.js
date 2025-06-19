// ===================================================
// components/NavigationMenu.js - 簡化版導航選單
// ===================================================
import React from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/Navigation.module.css';

const NavigationMenu = () => {
    const router = useRouter();

    const menuItems = [
        { path: '/', label: '首頁', icon: '🏠' }
    ];

    const handleNavigation = (path) => {
        router.push(path);
    };

    return (
        <nav className={styles.nav}>
            <div className={styles.navContainer}>
                {menuItems.map((item) => (
                    <button
                        key={item.path}
                        onClick={() => handleNavigation(item.path)}
                        className={`${styles.navButton} ${router.pathname === item.path ? styles.navButtonActive : ''
                            }`}
                    >
                        <span className={styles.navIcon}>{item.icon}</span>
                        <span className={styles.navLabel}>{item.label}</span>
                    </button>
                ))}
            </div>
        </nav>
    );
};

export default NavigationMenu;