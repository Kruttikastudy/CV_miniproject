import { useEffect, useRef, useState } from 'react';
import { playCountdown } from '../utils/sounds';

/**
 * Circular countdown timer with SVG ring animation.
 */
export default function Timer({ duration, isActive, onEnd }) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const timerRef = useRef(null);
  const hasEndedRef = useRef(false);

  // Reset when duration or active state changes
  useEffect(() => {
    setTimeLeft(duration);
    hasEndedRef.current = false;
  }, [duration, isActive]);

  useEffect(() => {
    if (!isActive) {
      clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          if (!hasEndedRef.current) {
            hasEndedRef.current = true;
            setTimeout(() => onEnd(), 0);
          }
          return 0;
        }
        if (prev <= 6) {
          playCountdown();
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [isActive, onEnd]);

  const progress = timeLeft / duration;
  const circumference = 2 * Math.PI * 54;
  const offset = circumference * (1 - progress);
  const isCritical = timeLeft <= 5;

  // Color transitions: green -> yellow -> red
  let strokeColor = '#10b981';
  if (timeLeft <= 10) strokeColor = '#f59e0b';
  if (timeLeft <= 5) strokeColor = '#ef4444';

  return (
    <div className={`relative flex items-center justify-center ${isCritical ? 'timer-critical' : ''}`}>
      <svg width="140" height="140" viewBox="0 0 120 120">
        {/* Background ring */}
        <circle
          cx="60" cy="60" r="54"
          fill="none"
          stroke="rgba(99, 102, 241, 0.1)"
          strokeWidth="8"
        />
        {/* Progress ring */}
        <circle
          cx="60" cy="60" r="54"
          fill="none"
          stroke={strokeColor}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="timer-ring transition-all duration-1000 ease-linear"
          style={{
            filter: isCritical ? `drop-shadow(0 0 8px ${strokeColor})` : 'none',
          }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span
          className="text-4xl font-bold font-mono transition-colors duration-300"
          style={{ color: strokeColor }}
        >
          {timeLeft}
        </span>
        <span className="text-xs text-slate-400 mt-1">seconds</span>
      </div>
    </div>
  );
}
