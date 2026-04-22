import { useEffect } from 'react';

export default function useLiveRefresh(refresh, delay = 30000) {
  useEffect(() => {
    const runRefresh = () => refresh();

    const onFocus = () => runRefresh();
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') runRefresh();
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibilityChange);
    const intervalId = window.setInterval(runRefresh, delay);

    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.clearInterval(intervalId);
    };
  }, [refresh, delay]);
}
