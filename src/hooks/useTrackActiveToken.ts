import { useEffect } from 'react';

/**
 * Hook to track active token viewing
 * This notifies the backend that a token is being viewed,
 * which prioritizes it for background cache refresh
 * 
 * Usage:
 * useTrackActiveToken(tokenAddress, chain);
 */
export function useTrackActiveToken(tokenAddress?: string, chain?: string) {
  useEffect(() => {
    if (!tokenAddress || !chain) return;

    // Track token as active
    const trackToken = async () => {
      try {
        await fetch('/api/workers/track-active', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tokenAddress,
            chain,
          }),
        });
      } catch (error) {
        // Silent fail - tracking is not critical
        console.debug('Failed to track active token:', error);
      }
    };

    // Track immediately
    trackToken();

    // Track every 30 seconds while component is mounted
    const interval = setInterval(trackToken, 30000);

    return () => clearInterval(interval);
  }, [tokenAddress, chain]);
}
