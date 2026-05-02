/**
 * Shows whose turn it is with player avatar and round info.
 */
export default function PlayerTurnIndicator({ currentPlayer, currentRound, totalRounds, players, currentPlayerIndex }) {
  // Generate a consistent color for each player
  const playerColors = [
    'from-indigo-500 to-purple-500',
    'from-cyan-500 to-blue-500',
    'from-pink-500 to-rose-500',
    'from-emerald-500 to-teal-500',
    'from-amber-500 to-orange-500',
    'from-violet-500 to-fuchsia-500',
  ];

  return (
    <div className="glass rounded-2xl p-4 animate-slide-down">
      <div className="flex items-center justify-between">
        {/* Current player info */}
        <div className="flex items-center gap-3">
          <div className={`
            w-12 h-12 rounded-xl bg-gradient-to-br ${playerColors[currentPlayerIndex % playerColors.length]}
            flex items-center justify-center text-xl font-bold shadow-lg
          `}>
            {currentPlayer?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider">Now Playing</p>
            <p className="text-lg font-bold text-white font-display">{currentPlayer}</p>
          </div>
        </div>

        {/* Round indicator */}
        <div className="text-right">
          <p className="text-xs text-slate-400 uppercase tracking-wider">Round</p>
          <p className="text-lg font-bold font-mono">
            <span className="text-indigo-400">{currentRound}</span>
            <span className="text-slate-500"> / </span>
            <span className="text-slate-300">{totalRounds}</span>
          </p>
        </div>
      </div>

      {/* Player queue */}
      <div className="mt-3 flex gap-2">
        {players.map((player, idx) => (
          <div
            key={player}
            className={`
              flex-1 h-1.5 rounded-full transition-all duration-300
              ${idx === currentPlayerIndex
                ? 'bg-gradient-to-r ' + playerColors[idx % playerColors.length]
                : idx < currentPlayerIndex
                  ? 'bg-slate-600'
                  : 'bg-slate-800'
              }
            `}
          />
        ))}
      </div>
    </div>
  );
}
