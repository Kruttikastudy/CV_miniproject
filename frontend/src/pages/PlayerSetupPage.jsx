import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkHealth } from '../utils/api';

/**
 * Player Setup Page — add players, choose difficulty, configure rounds.
 */
export default function PlayerSetupPage({
  players,
  setPlayers,
  difficulty,
  setDifficulty,
  rounds,
  setRounds,
  onStart,
}) {
  const [newName, setNewName] = useState('');
  const [backendStatus, setBackendStatus] = useState(null); // null | true | false
  const [checking, setChecking] = useState(false);
  const navigate = useNavigate();

  const addPlayer = () => {
    const name = newName.trim();
    if (name && !players.includes(name) && players.length < 6) {
      setPlayers([...players, name]);
      setNewName('');
    }
  };

  const removePlayer = (name) => {
    setPlayers(players.filter(p => p !== name));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') addPlayer();
  };

  const handleStart = async () => {
    if (players.length < 1) return;

    setChecking(true);
    const isHealthy = await checkHealth();
    setBackendStatus(isHealthy);
    setChecking(false);

    if (isHealthy) {
      onStart();
      navigate('/game');
    }
  };

  const playerColors = [
    'from-indigo-500 to-purple-500',
    'from-cyan-500 to-blue-500',
    'from-pink-500 to-rose-500',
    'from-emerald-500 to-teal-500',
    'from-amber-500 to-orange-500',
    'from-violet-500 to-fuchsia-500',
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 page-enter">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl md:text-6xl font-black font-display mb-3 bg-gradient-to-r from-indigo-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
            🎯 Object Hunt
          </h1>
          <p className="text-slate-400 text-lg">
            Find real-world objects using your camera!
          </p>
        </div>

        {/* Main Card */}
        <div className="glass rounded-3xl p-6 md:p-8 neon-border">
          {/* Add Player */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-2 uppercase tracking-wider">
              👤 Add Players
            </label>
            <div className="flex gap-2">
              <input
                id="player-name-input"
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Enter player name..."
                className="input-glass flex-1"
                maxLength={20}
              />
              <button
                onClick={addPlayer}
                disabled={!newName.trim() || players.length >= 6}
                className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
                id="add-player-btn"
              >
                Add
              </button>
            </div>
            {players.length >= 6 && (
              <p className="text-amber-400 text-xs mt-1">Maximum 6 players</p>
            )}
          </div>

          {/* Player List */}
          {players.length > 0 && (
            <div className="mb-6">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">
                Players ({players.length})
              </p>
              <div className="space-y-2">
                {players.map((player, idx) => (
                  <div
                    key={player}
                    className="flex items-center justify-between glass-light rounded-xl px-4 py-3 animate-slide-up"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`
                        w-9 h-9 rounded-lg bg-gradient-to-br ${playerColors[idx % playerColors.length]}
                        flex items-center justify-center text-sm font-bold shadow-md
                      `}>
                        {player.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-white">{player}</span>
                    </div>
                    <button
                      onClick={() => removePlayer(player)}
                      className="text-slate-500 hover:text-red-400 transition-colors p-1"
                      title="Remove player"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Difficulty Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-2 uppercase tracking-wider">
              ⚡ Difficulty
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['easy', 'mixed', 'hard'].map((level) => (
                <button
                  key={level}
                  onClick={() => setDifficulty(level)}
                  className={`
                    py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 capitalize
                    ${difficulty === level
                      ? 'bg-indigo-500/30 border-2 border-indigo-400 text-indigo-300 shadow-lg shadow-indigo-500/20'
                      : 'bg-slate-800/40 border-2 border-slate-700/50 text-slate-400 hover:border-slate-600'
                    }
                  `}
                  id={`difficulty-${level}`}
                >
                  {level === 'easy' ? '🟢' : level === 'mixed' ? '🟡' : '🔴'} {level}
                </button>
              ))}
            </div>
          </div>

          {/* Rounds Selection */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-slate-300 mb-2 uppercase tracking-wider">
              🔄 Rounds
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 5].map((r) => (
                <button
                  key={r}
                  onClick={() => setRounds(r)}
                  className={`
                    flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-300
                    ${rounds === r
                      ? 'bg-indigo-500/30 border-2 border-indigo-400 text-indigo-300'
                      : 'bg-slate-800/40 border-2 border-slate-700/50 text-slate-400 hover:border-slate-600'
                    }
                  `}
                  id={`rounds-${r}`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Backend Status */}
          {backendStatus === false && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm animate-shake">
              ⚠️ Backend server is not running. Start it with: <code className="font-mono bg-red-900/30 px-1 rounded">python main.py</code>
            </div>
          )}

          {/* Start Button */}
          <button
            onClick={handleStart}
            disabled={players.length < 1 || checking}
            className={`
              w-full py-4 rounded-2xl font-bold text-lg transition-all duration-300
              ${players.length >= 1
                ? 'btn-primary text-xl'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }
            `}
            id="start-game-btn"
          >
            {checking ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Connecting...
              </span>
            ) : (
              '🚀 Start Game'
            )}
          </button>

          {players.length < 1 && (
            <p className="text-center text-slate-500 text-sm mt-3">
              Add at least 1 player to start
            </p>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-slate-600 text-xs mt-6">
          Powered by YOLOv8 • Built with React & FastAPI
        </p>
      </div>
    </div>
  );
}
