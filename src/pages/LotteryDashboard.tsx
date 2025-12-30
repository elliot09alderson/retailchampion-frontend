import { useState, useEffect } from 'react';
import { useLotteryPolling } from '../hooks/useLotteryPolling';
import SpinWheel from '../components/SpinWheel';
import EliminationDisplay from '../components/EliminationDisplay';
import WinnerAnnouncement from '../components/WinnerAnnouncement';
import { API_ENDPOINTS } from '../config/api';

export default function LotteryDashboard() {
  const [activeLotteryId, setActiveLotteryId] = useState<string | null>(null);
  const [previousRound, setPreviousRound] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [showWinner, setShowWinner] = useState(false);

  const { lotteryStatus, loading, error } = useLotteryPolling(activeLotteryId);

  // Fetch active lottery on mount
  useEffect(() => {
    const fetchActiveLottery = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.LOTTERY.ACTIVE);
        const data = await response.json();
        
        if (data.success) {
          setActiveLotteryId(data.data._id);
        }
      } catch (err) {
        console.error('Failed to fetch active lottery:', err);
      }
    };

    fetchActiveLottery();
  }, []);

  // Detect new round and trigger spin animation
  useEffect(() => {
    if (lotteryStatus && lotteryStatus.currentRound > previousRound) {
      setIsSpinning(true);
      setPreviousRound(lotteryStatus.currentRound);

      // Stop spinning after 4 seconds (matches CSS animation)
      setTimeout(() => {
        setIsSpinning(false);
        
        // Check if there's a winner (Round 4)
        if (lotteryStatus.currentRound === 4 && lotteryStatus.latestRound?.winnerId) {
          setTimeout(() => setShowWinner(true), 1000);
        }
      }, 4000);
    }
  }, [lotteryStatus, previousRound]);

  // Show winner screen if lottery is complete
  useEffect(() => {
    const fetchWinner = async () => {
      if (lotteryStatus?.status === 'completed' && activeLotteryId) {
        try {
          const response = await fetch(API_ENDPOINTS.LOTTERY.WINNER(activeLotteryId));
          const data = await response.json();
          
          if (data.success) {
            setShowWinner(true);
          }
        } catch (err) {
          console.error('Failed to fetch winner:', err);
        }
      }
    };

    fetchWinner();
  }, [lotteryStatus?.status, activeLotteryId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafbfc] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-[#334155] mx-auto mb-4" />
          <p className="text-[#64748b] text-xl">Loading contest...</p>
        </div>
      </div>
    );
  }

  if (error || !lotteryStatus) {
    return (
      <div className="min-h-screen bg-[#fafbfc] flex items-center justify-center p-6">
        <div className="bg-[#fef2f2] border border-[#ef4444] rounded-xl p-8 max-w-md">
          <h2 className="text-2xl font-semibold text-[#dc2626] mb-4">No Active Contest</h2>
          <p className="text-[#64748b]">{error || 'There is no active contest at the moment.'}</p>
        </div>
      </div>
    );
  }

  // Show winner screen if available
  if (showWinner && activeLotteryId) {
    const [winnerData, setWinnerData] = useState<any>(null);

    useEffect(() => {
      const fetchWinner = async () => {
        try {
          const response = await fetch(API_ENDPOINTS.LOTTERY.WINNER(activeLotteryId));
          const data = await response.json();
          
          if (data.success) {
            setWinnerData(data.data);
          }
        } catch (err) {
          console.error('Failed to fetch winner:', err);
        }
      };

      fetchWinner();
    }, [activeLotteryId]);

    if (winnerData) {
      return (
        <WinnerAnnouncement 
          winnerName={winnerData.userId.name}
          winnerImage={winnerData.userId.imageUrl}
        />
      );
    }
  }

  return (
    <div className="min-h-screen bg-[#fafbfc] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-5xl md:text-7xl font-semibold text-[#0f172a] mb-3 tracking-tight">
            Retail Champions
          </h1>
          <p className="text-xl md:text-2xl text-[#64748b] font-medium">
            Contest Draw {lotteryStatus.currentRound > 0 ? `- Round ${lotteryStatus.currentRound}` : ''}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white border border-[#e2e8f0] p-6 rounded-xl shadow-sm">
            <p className="text-[#64748b] text-sm uppercase tracking-wide mb-2">Status</p>
            <p className="text-2xl font-semibold text-[#0f172a] capitalize">{lotteryStatus.status}</p>
          </div>

          <div className="bg-white border border-[#e2e8f0] p-6 rounded-xl shadow-sm">
            <p className="text-[#64748b] text-sm uppercase tracking-wide mb-2">Total Registered</p>
            <p className="text-2xl font-semibold text-[#0f172a]">{lotteryStatus.totalParticipants}</p>
          </div>

          <div className="bg-white border border-[#e2e8f0] p-6 rounded-xl shadow-sm">
            <p className="text-[#64748b] text-sm uppercase tracking-wide mb-2">Remaining</p>
            <p className="text-2xl font-semibold text-[#0f172a]">{lotteryStatus.remainingCount}</p>
          </div>
        </div>

        {/* User Status */}
        {lotteryStatus.userStatus && (
          <div className="mb-8">
            {lotteryStatus.userStatus.status === 'eliminated' ? (
              <div className="bg-[#fef2f2] border border-[#ef4444] rounded-xl p-6 text-center">
                <p className="text-3xl text-[#ef4444] font-semibold mb-2">❌ Eliminated</p>
                <p className="text-[#64748b]">
                  You were eliminated in Round {lotteryStatus.userStatus.eliminatedInRound}. Better luck next time!
                </p>
              </div>
            ) : lotteryStatus.userStatus.status === 'active' ? (
              <div className="bg-[#f0fdf4] border border-[#10b981] rounded-xl p-6 text-center">
                <p className="text-3xl text-[#10b981] font-semibold mb-2">✅ Still In The Game!</p>
                <p className="text-[#64748b]">You're still competing for the prize. Good luck!</p>
              </div>
            ) : lotteryStatus.userStatus.status === 'winner' ? (
              <div className="bg-[#fefce8] border border-[#eab308] rounded-xl p-6 text-center">
                <p className="text-3xl text-[#eab308] font-semibold mb-2">🏆 YOU WON!</p>
                <p className="text-[#64748b]">Congratulations, Champion!</p>
              </div>
            ) : null}
          </div>
        )}

        {/* Spin Wheel */}
        {lotteryStatus.status === 'active' && (
          <div className="mb-8">
            <SpinWheel isSpinning={isSpinning} />
            
            {isSpinning && (
              <p className="text-center text-[#334155] text-2xl font-semibold animate-pulse mt-4">
                Spinning...
              </p>
            )}
          </div>
        )}

        {/* Elimination Display */}
        {lotteryStatus.latestRound && lotteryStatus.eliminatedUsers.length > 0 && !isSpinning && (
          <div className="mb-8">
            <EliminationDisplay
              users={lotteryStatus.eliminatedUsers}
roundNumber={lotteryStatus.latestRound.roundNumber}
              eliminatedCount={lotteryStatus.latestRound.eliminatedCount}
            />
          </div>
        )}

        {/* Waiting Message */}
        {lotteryStatus.status === 'pending' && (
          <div className="bg-[#eff6ff] border border-[#3b82f6] rounded-xl p-8 text-center">
            <p className="text-2xl text-[#1e40af] font-semibold mb-2">Waiting for Event to Start...</p>
            <p className="text-[#64748b]">The contest will begin soon. Stay tuned!</p>
          </div>
        )}
      </div>
    </div>
  );
}
