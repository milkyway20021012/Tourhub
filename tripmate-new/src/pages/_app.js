import { useRouter } from 'next/router';

function MyApp({ Component, pageProps }) {
  const router = useRouter();

  return (
    <>
      <Component {...pageProps} />
      {/* 移除了 NavigationMenu 組件 */}
      {/* 移除了底部空間預留 */}
    </>
  );
}

export default MyApp;