/**
 * Live scoreboard showing all players and their scores.
 */
export default function ScoreBoard({ players, scores, currentPlayerIndex }) {
  const playerColors = [
    'border-indigo-500',
    'border-cyan-500',
    'border-pink-500',
    'border-emerald-500',
    'border-amber-500',
    'border-violet-500',
  ];

  const bgColors = [
    'bg-indigo-500/10',
    'bg-cyan-500/10',
    'bg-pink-500/10',
    'bg-emerald-500/10',
    'bg-amber-500/10',
    'bg-violet-500/10',
  ];

  // Sort players by score for display
  const sortedPlayers = [...players].sort((a, b) => (scores[b] || 0) - (scores[a] || 0));

  return (
    <div className="glass rounded-2xl p-4">
      <h3 className="text-sm font-medium text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
        <span>🏆</span> Scoreboard
      </h3>

      <div className="space-y-2">
        {sortedPlayers.map((player, idx) => {
          const originalIdx = players.indexOf(player);
          const isActive = originalIdx === currentPlayerIndex;
          const score = scores[player] || 0;

          // Calculate rank with ties
          let rank = idx + 1;
          if (idx > 0 && (scores[player] || 0) === (scores[sortedPlayers[idx - 1]] || 0)) {
            for (let i = idx - 1; i >= 0; i--) {
              if ((scores[sortedPlayers[i]] || 0) === score) {
                rank = i + 1;
              } else {
                break;
              }
            }
          }

          return (
            <div
              key={player}
              className={`
                flex items-center justify-between rounded-xl px-3 py-2 transition-all duration-300
                ${isActive
                  ? `${bgColors[originalIdx % bgColors.length]} border-l-4 ${playerColors[originalIdx % playerColors.length]}`
                  : 'bg-slate-800/30 border-l-4 border-transparent'
                }
              `}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono text-slate-500 w-5">
                  {rank === 1 ? '👑' : `#${rank}`}
                </span>
                <span className={`text-sm font-medium ${isActive ? 'text-white' : 'text-slate-300'}`}>
                  {player}
                </span>
              </div>
              <span className={`
                text-lg font-bold font-mono
                ${score > 0 ? 'text-emerald-400' : 'text-slate-500'}
              `}>
                {score}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
