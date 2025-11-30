import { useState, useEffect, useCallback } from 'react';

interface ReactionCounts {
  [key: number]: number;
}

interface UseEmojiReactionsReturn {
  counts: ReactionCounts;
  loading: boolean;
  error: string | null;
  handleEmojiClick: (emojiId: number) => Promise<void>;
  resetCounts: () => Promise<void>;
  syncFromServer: () => Promise<void>;
}

/**
 * Custom hook to manage emoji reactions for a token
 * @param contractAddress - The contract address of the token
 * @returns Object with counts, loading, error, and handlers
 */
export function useEmojiReactions(contractAddress: string | null): UseEmojiReactionsReturn {
  const [counts, setCounts] = useState<ReactionCounts>({
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch reactions from server on mount or when contractAddress changes
  const syncFromServer = useCallback(async () => {
    if (!contractAddress) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/reactions/${contractAddress}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch reactions');
      }

      const data = await response.json();
      setCounts(data.reactions);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      console.error('Error syncing reactions:', err);
    } finally {
      setLoading(false);
    }
  }, [contractAddress]);

  // Initial sync when component mounts or contractAddress changes
  useEffect(() => {
    syncFromServer();
  }, [contractAddress, syncFromServer]);

  // Handle emoji click - increment count and sync to server
  const handleEmojiClick = useCallback(
    async (emojiId: number) => {
      if (!contractAddress) return;

      // Optimistic update
      setCounts(prev => ({
        ...prev,
        [emojiId]: prev[emojiId] + 1,
      }));

      try {
        const updatedCounts = {
          ...counts,
          [emojiId]: counts[emojiId] + 1,
        };

        const response = await fetch(`/api/reactions/${contractAddress}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ reactions: updatedCounts }),
        });

        if (!response.ok) {
          throw new Error('Failed to update reactions');
        }

        const data = await response.json();
        setCounts(data.reactions);
      } catch (err) {
        // Revert on error
        setCounts(prev => ({
          ...prev,
          [emojiId]: prev[emojiId] - 1,
        }));
        const errorMessage = err instanceof Error ? err.message : 'An error occurred';
        setError(errorMessage);
        console.error('Error updating reaction:', err);
      }
    },
    [contractAddress, counts]
  );

  // Reset all counts to 0
  const resetCounts = useCallback(async () => {
    if (!contractAddress) return;

    // Optimistic update
    setCounts({
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    });

    try {
      const response = await fetch(`/api/reactions/${contractAddress}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reactions: {
            1: 0,
            2: 0,
            3: 0,
            4: 0,
            5: 0,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to reset reactions');
      }

      const data = await response.json();
      setCounts(data.reactions);
    } catch (err) {
      // Revert on error
      setCounts(counts);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      console.error('Error resetting reactions:', err);
    }
  }, [contractAddress, counts]);

  return {
    counts,
    loading,
    error,
    handleEmojiClick,
    resetCounts,
    syncFromServer,
  };
}
