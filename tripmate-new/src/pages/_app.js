import NavigationMenu from '../components/NavigationMenu';
import { useRouter } from 'next/router';

function MyApp({ Component, pageProps }) {
  const router = useRouter();

  // 不顯示導航選單的頁面
  const hideNavigation = ['/login', '/admin'].includes(router.pathname);

  return (
    <>
      <Component {...pageProps} />
      {!hideNavigation && <NavigationMenu />}

      {/* 為底部導航留出空間 */}
      <div style={{ height: '70px' }}></div>
    </>
  );
}

export default MyApp;