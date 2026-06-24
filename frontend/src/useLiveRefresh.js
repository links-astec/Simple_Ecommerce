import { useEffect, useRef } from 'react';

export default function useLiveRefresh(refresh, delay = 300000) {
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  useEffect(() => {
    let lastRun = Date.now();
    const run = () => {
      if (Date.now() - lastRun < 10000) return;
      lastRun = Date.now();
      refreshRef.current();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') run();
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    const intervalId = window.setInterval(run, delay);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.clearInterval(intervalId);
    };
  }, [delay]);
}
