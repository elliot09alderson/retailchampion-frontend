import { useEffect } from 'react';
import confetti from 'canvas-confetti';

interface ConfettiProps {
  trigger: boolean;
  onComplete?: () => void;
}

export default function Confetti({ trigger, onComplete }: ConfettiProps) {
  useEffect(() => {
    if (trigger) {
      // Create a nice burst effect using canvas-confetti
      const duration = 5000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min;
      };

      // Initial Burst
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        zIndex: 9999,
        colors: ['#FFE400', '#FFBD00', '#E89400', '#FFCA6C', '#FDFFB8'] // Gold/Yellow theme
      });

      // Continuous fireworks for a few seconds
      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        
        // Random locations confetti
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }, zIndex: 9999 });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }, zIndex: 9999 });
      }, 250);

      const to = setTimeout(() => {
          onComplete?.();
      }, duration);

      return () => {
          clearInterval(interval);
          clearTimeout(to);
      };
    }
  }, [trigger, onComplete]);

  return null;
}
