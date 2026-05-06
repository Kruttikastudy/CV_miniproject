import { useState, useCallback, useRef } from 'react';
import { getRandomPrompt, checkMatch, checkMatchV2, getColorFromPrompt } from '../utils/prompts';
import { detectObjects, resetTrackers } from '../utils/api';
import { playSuccess, playFailure } from '../utils/sounds';

/**
 * Custom hook for all game logic — turn management, scoring, detection loop.
 */
export function useGameLogic(players, difficulty, rounds) {
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [currentRound, setCurrentRound] = useState(1);
  const [currentPrompt, setCurrentPrompt] = useState(null);
  const [detections, setDetections] = useState([]);
  const [turnActive, setTurnActive] = useState(false);
  const [turnResult, setTurnResult] = useState(null); // 'success' | 'failure' | null
  const [scores, setScores] = useState(() => {
    const initial = {};
    players.forEach(p => { initial[p] = 0; });
    return initial;
  });
  const [gameOver, setGameOver] = useState(false);
  const [usedPrompts, setUsedPrompts] = useState([]);

  const matchFoundRef = useRef(false);
  const detectionIntervalRef = useRef(null);

  /**
   * Get the adaptive timer duration based on round number.
   */
  const getTimerDuration = useCallback(() => {
    const base = 30;
    const reduction = Math.min((currentRound - 1) * 2, 10); // reduce by 2s each round, max 10s
    return base - reduction;
  }, [currentRound]);

  /**
   * Start a new turn for the current player.
   */
  const startTurn = useCallback(async () => {
    // ===== V2: Reset trackers at start of each turn =====
    await resetTrackers();
    
    const prompt = getRandomPrompt(difficulty, usedPrompts);
    setCurrentPrompt(prompt);
    setUsedPrompts(prev => [...prev, prompt.text]);
    setDetections([]);
    setTurnResult(null);
    matchFoundRef.current = false;
    setTurnActive(true);
  }, [difficulty, usedPrompts]);

  /**
   * Process a captured frame — send to backend and check for match.
   * Returns the full detection result (V2: includes gesture, motion, multi-object data).
   */
  const processFrame = useCallback(async (base64Frame) => {
    if (!turnActive || matchFoundRef.current || !currentPrompt) return { detections: [] };

    const colorName = getColorFromPrompt(currentPrompt);
    
    // ===== V2: Pass prompt to enable appropriate features =====
    const result = await detectObjects(base64Frame, colorName, currentPrompt);
    
    // Extract detections for display
    const detectionsList = result.detections || [];
    
    // ===== DEBUG: Log what we received =====
    if (currentPrompt.type === 'motion' || currentPrompt.type === 'gesture') {
      console.log(`📦 Prompt: "${currentPrompt.text}" (type: ${currentPrompt.type})`);
      console.log(`📦 Received ${detectionsList.length} detections:`, detectionsList);
      console.log(`📦 Full result:`, result);
    }
    
    setDetections(detectionsList);

    // ===== V2: Use enhanced matching for V2 prompts =====
    let isMatch = false;
    if (currentPrompt.type === 'gesture' || currentPrompt.type === 'motion' || currentPrompt.type === 'multi_object') {
      isMatch = checkMatchV2(currentPrompt, result);
    } else {
      // Original matching for object/color prompts
      isMatch = checkMatch(currentPrompt, detectionsList);
    }

    if (isMatch && !matchFoundRef.current) {
      matchFoundRef.current = true;

      setTurnActive(false);
      setTurnResult('success');
      playSuccess();

      setScores(prev => ({
        ...prev,
        [players[currentPlayerIndex]]: (prev[players[currentPlayerIndex]] || 0) + 1,
      }));
    }

    return result;
  }, [turnActive, currentPrompt, currentPlayerIndex, players]);

  /**
   * Called when the timer expires (player failed to find the object).
   */
  const onTimerEnd = useCallback(() => {
    if (matchFoundRef.current) return; // already scored
    setTurnActive(false);
    setTurnResult('failure');
    playFailure();
  }, []);

  /**
   * Advance to the next turn (next player or next round).
   */
  const nextTurn = useCallback(() => {
    setTurnResult(null);
    setDetections([]);

    const nextPlayer = currentPlayerIndex + 1;

    if (nextPlayer >= players.length) {
      // All players have gone this round
      const nextRound = currentRound + 1;
      if (nextRound > rounds) {
        setGameOver(true);
        return;
      }
      setCurrentRound(nextRound);
      setCurrentPlayerIndex(0);
    } else {
      setCurrentPlayerIndex(nextPlayer);
    }
  }, [currentPlayerIndex, currentRound, players.length, rounds]);

  return {
    currentPlayerIndex,
    currentPlayer: players[currentPlayerIndex],
    currentRound,
    totalRounds: rounds,
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
  };
}
