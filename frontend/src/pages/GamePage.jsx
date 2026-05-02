import { useEffect, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCamera } from '../hooks/useCamera';
import { useGameLogic } from '../hooks/useGameLogic';
import CameraFeed from '../components/CameraFeed';
import Timer from '../components/Timer';
import PromptDisplay from '../components/PromptDisplay';
import PlayerTurnIndicator from '../components/PlayerTurnIndicator';
import ScoreBoard from '../components/ScoreBoard';

/**
 * Main Game Page — camera feed, timer, prompt, detection, scoring.
 */
export default function GamePage({ players, scores: parentScores, setScores: setParentScores, difficulty, rounds }) {
  const navigate = useNavigate();
  const { videoRef, canvasRef, isReady, error, dimensions, startCamera, stopCamera, captureFrame } = useCamera();
  const {
    currentPlayerIndex,
    currentPlayer,
    currentRound,
    totalRounds,
    currentPrompt,
    detections,
    turnActive,
    turnResult,
    scores,
    gameOver,
    getTimerDuration,
    startTurn,
    processFrame,
    onTimerEnd,
    nextTurn,
  } = useGameLogic(players, difficulty, rounds);

  const [showTurnIntro, setShowTurnIntro] = useState(true);
  const [countdown, setCountdown] = useState(3);

  // Redirect if no players
  useEffect(() => {
    if (!players || players.length === 0) {
      navigate('/');
    }
  }, [players, navigate]);

  // Start camera on mount
  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  // Sync scores to parent
  useEffect(() => {
    setParentScores(scores);
  }, [scores, setParentScores]);

  // Navigate to leaderboard when game is over
  useEffect(() => {
    if (gameOver) {
      setTimeout(() => navigate('/leaderboard'), 1500);
    }
  }, [gameOver, navigate]);

  // Show turn intro countdown
  useEffect(() => {
    if (showTurnIntro) {
      setCountdown(3);
      const interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            setShowTurnIntro(false);
            startTurn();
            return 0;
          }
          return prev - 1;
        });
      }, 800);
      return () => clearInterval(interval);
    }
  }, [showTurnIntro, currentPlayerIndex, currentRound]);

  // Handle frame capture
  const handleCaptureFrame = useCallback(() => {
    if (!turnActive) return;
    const frame = captureFrame();
    if (frame) {
      processFrame(frame);
    }
  }, [captureFrame, processFrame, turnActive]);

  // Handle next turn
  const handleNextTurn = () => {
    nextTurn();
    if (!gameOver) {
      setShowTurnIntro(true);
    }
  };

  if (!players || players.length === 0) return null;

  return (
    <div className="min-h-screen p-4 page-enter">
      <div className="max-w-6xl mx-auto">
        {/* Top Bar */}
        <PlayerTurnIndicator
          currentPlayer={currentPlayer}
          currentRound={currentRound}
          totalRounds={totalRounds}
          players={players}
          currentPlayerIndex={currentPlayerIndex}
        />

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Column — Camera */}
          <div className="lg:col-span-2 space-y-4">
            {/* Prompt */}
            <PromptDisplay
              prompt={currentPrompt}
              matched={turnResult === 'success'}
            />

            {/* Camera Feed */}
            <div className="relative">
              <CameraFeed
                videoRef={videoRef}
                canvasRef={canvasRef}
                isReady={isReady}
                error={error}
                dimensions={dimensions}
                detections={detections}
                isCapturing={turnActive}
                onCaptureFrame={handleCaptureFrame}
              />

              {/* Turn intro overlay */}
              {showTurnIntro && (
                <div className="absolute inset-0 bg-surface-950/90 backdrop-blur-md rounded-xl flex items-center justify-center z-20">
                  <div className="text-center animate-scale-in">
                    <p className="text-indigo-400 text-lg mb-2">Get Ready!</p>
                    <p className="text-3xl font-bold text-white mb-4">{currentPlayer}'s Turn</p>
                    <div className="text-7xl font-black text-indigo-400 animate-countdown font-mono">
                      {countdown}
                    </div>
                  </div>
                </div>
              )}

              {/* Turn result overlay */}
              {turnResult && (
                <div className={`
                  absolute inset-0 backdrop-blur-md rounded-xl flex items-center justify-center z-20
                  ${turnResult === 'success' ? 'bg-emerald-950/80' : 'bg-red-950/80'}
                `}>
                  <div className="text-center animate-scale-in">
                    {turnResult === 'success' ? (
                      <>
                        <div className="text-7xl mb-4">🎉</div>
                        <h3 className="text-3xl font-bold text-emerald-300 mb-2">Found it!</h3>
                        <p className="text-emerald-400/70 mb-1">{currentPlayer} earned +1 point</p>
                      </>
                    ) : (
                      <>
                        <div className="text-7xl mb-4">⏰</div>
                        <h3 className="text-3xl font-bold text-red-300 mb-2">Time's Up!</h3>
                        <p className="text-red-400/70 mb-1">{currentPlayer} scored 0 this round</p>
                      </>
                    )}
                    <button
                      onClick={handleNextTurn}
                      className="mt-6 btn-primary"
                      id="next-turn-btn"
                    >
                      {gameOver ? '🏆 See Results' : '➡️ Next Turn'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column — Timer + Scoreboard */}
          <div className="space-y-4">
            {/* Timer */}
            <div className="glass rounded-2xl p-6 flex flex-col items-center">
              <p className="text-xs text-slate-400 uppercase tracking-widest mb-3">⏱️ Time Left</p>
              <Timer
                duration={getTimerDuration()}
                isActive={turnActive}
                onEnd={onTimerEnd}
              />
            </div>

            {/* Scoreboard */}
            <ScoreBoard
              players={players}
              scores={scores}
              currentPlayerIndex={currentPlayerIndex}
            />

            {/* Quit Button */}
            <button
              onClick={() => navigate('/')}
              className="w-full btn-danger text-sm"
              id="quit-game-btn"
            >
              ✕ Quit Game
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
