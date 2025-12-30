import { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config/api';

interface LotteryStatus {
  status: string;
  currentRound: number;
  totalParticipants: number;
  remainingCount: number;
  latestRound?: {
    roundNumber: number;
    totalParticipants: number;
    eliminatedCount: number;
    winnerId?: string;
  };
  eliminatedUsers: Array<{ name: string; _id: string }>;
  userStatus?: {
    status: string;
    eliminatedInRound?: number;
  };
}

export const useLotteryPolling = (lotteryId: string | null, interval = 3000) => {
  const [lotteryStatus, setLotteryStatus] = useState<LotteryStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!lotteryId) {
      setLoading(false);
      return;
    }

    const fetchStatus = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.LOTTERY.STATUS(lotteryId));
        const data = await response.json();
        
        if (data.success) {
          setLotteryStatus(data.data);
          setError(null);
        } else {
          setError(data.message);
        }
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch lottery status');
        setLoading(false);
      }
    };

    // Initial fetch
    fetchStatus();

    // Poll every interval
    const pollInterval = setInterval(fetchStatus, interval);

    return () => clearInterval(pollInterval);
  }, [lotteryId, interval]);

  return { lotteryStatus, loading, error };
};
