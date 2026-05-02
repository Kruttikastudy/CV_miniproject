import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Leaderboard Page — final results with confetti and winner highlight.
 */
export default function LeaderboardPage({ players, scores, resetGame }) {
  const navigate = useNavigate();
  const [confettiPieces, setConfettiPieces] = useState([]);
  const [showContent, setShowContent] = useState(false);

  // Sort players by score (descending)
  const rankedPlayers = [...players]
    .map(p => ({ name: p, score: scores[p] || 0 }))
    .sort((a, b) => b.score - a.score);

  const winner = rankedPlayers[0];
  const maxScore = winner?.score || 0;

  // Redirect if no data
  useEffect(() => {
    if (!players || players.length === 0) {
      navigate('/');
    }
  }, [players, navigate]);

  // Confetti animation on mount
  useEffect(() => {
    const colors = ['#6366f1', '#00f5ff', '#ff006e', '#39ff14', '#fff01f', '#bf00ff'];
    const pieces = [];
    for (let i = 0; i < 50; i++) {
      pieces.push({
        id: i,
        left: Math.random() * 100,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 2,
        size: Math.random() * 8 + 6,
      });
    }
    setConfettiPieces(pieces);

    // Stagger content appearance
    setTimeout(() => setShowContent(true), 300);
  }, []);

  const handleRestart = () => {
    resetGame();
    navigate('/');
  };

  const playerColors = [
    'from-indigo-500 to-purple-500',
    'from-cyan-500 to-blue-500',
    'from-pink-500 to-rose-500',
    'from-emerald-500 to-teal-500',
    'from-amber-500 to-orange-500',
    'from-violet-500 to-fuchsia-500',
  ];

  const medals = ['🥇', '🥈', '🥉'];

  if (!players || players.length === 0) return null;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 page-enter relative overflow-hidden">
      {/* Confetti */}
      {confettiPieces.map(piece => (
        <div
          key={piece.id}
          className="confetti-piece"
          style={{
            left: `${piece.left}%`,
            backgroundColor: piece.color,
            width: `${piece.size}px`,
            height: `${piece.size}px`,
            animationDelay: `${piece.delay}s`,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          }}
        />
      ))}

      <div className={`w-full max-w-lg transition-all duration-700 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        {/* Winner Announcement */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4 animate-float">🏆</div>
          <h1 className="text-4xl md:text-5xl font-black font-display mb-2 bg-gradient-to-r from-amber-300 via-yellow-300 to-amber-400 bg-clip-text text-transparent">
            {maxScore > 0 ? 'Winner!' : 'Game Over!'}
          </h1>
          {maxScore > 0 && (
            <div className="text-2xl font-bold text-white mt-2">
              {rankedPlayers.filter(p => p.score === maxScore).map(p => p.name).join(' & ')} 
              <span className="text-amber-400 ml-2">— {maxScore} pts</span>
            </div>
          )}
          {maxScore === 0 && (
            <p className="text-lg text-slate-400 mt-2">
              No one found any objects! Better luck next time 😅
            </p>
          )}
        </div>

        {/* Rankings */}
        <div className="glass rounded-3xl p-6 neon-border">
          <h2 className="text-sm font-medium text-slate-400 uppercase tracking-widest mb-4 text-center">
            Final Standings
          </h2>

          <div className="space-y-3">
            {rankedPlayers.map((player, idx) => {
              const originalIdx = players.indexOf(player.name);
              const isWinner = player.score === maxScore && player.score > 0;
              
              // Calculate rank with ties
              let rank = idx + 1;
              if (idx > 0 && player.score === rankedPlayers[idx - 1].score) {
                // Find first occurrence of this score to get its rank
                for (let i = idx - 1; i >= 0; i--) {
                  if (rankedPlayers[i].score === player.score) {
                    rank = i + 1;
                  } else {
                    break;
                  }
                }
              }

              return (
                <div
                  key={player.name}
                  className={`
                    flex items-center justify-between rounded-2xl px-4 py-4 transition-all duration-500
                    ${isWinner
                      ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border-2 border-amber-500/40 neon-glow-success'
                      : 'glass-light'
                    }
                  `}
                  style={{ animationDelay: `${idx * 150}ms` }}
                >
                  <div className="flex items-center gap-3">
                    {/* Rank */}
                    <span className="text-2xl w-8 text-center">
                      {rank <= 3 ? medals[rank - 1] : `#${rank}`}
                    </span>

                    {/* Avatar */}
                    <div className={`
                      w-11 h-11 rounded-xl bg-gradient-to-br ${playerColors[originalIdx % playerColors.length]}
                      flex items-center justify-center text-lg font-bold shadow-lg
                    `}>
                      {player.name.charAt(0).toUpperCase()}
                    </div>

                    {/* Name */}
                    <div>
                      <p className={`font-bold ${isWinner ? 'text-amber-200' : 'text-white'}`}>
                        {player.name}
                      </p>
                      {isWinner && (
                        <p className="text-xs text-amber-400">Champion! 👑</p>
                      )}
                    </div>
                  </div>

                  {/* Score */}
                  <div className="text-right">
                    <span className={`
                      text-2xl font-black font-mono
                      ${player.score > 0 ? 'text-emerald-400' : 'text-slate-500'}
                    `}>
                      {player.score}
                    </span>
                    <p className="text-xs text-slate-500">pts</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex gap-3">
            <button
              onClick={handleRestart}
              className="flex-1 btn-primary text-lg"
              id="play-again-btn"
            >
              🔄 Play Again
            </button>
            <button
              onClick={() => navigate('/')}
              className="btn-secondary"
              id="home-btn"
            >
              🏠 Home
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          <div className="glass rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-indigo-400 font-mono">
              {rankedPlayers.reduce((sum, p) => sum + p.score, 0)}
            </p>
            <p className="text-xs text-slate-500 mt-1">Total Finds</p>
          </div>
          <div className="glass rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-cyan-400 font-mono">
              {players.length}
            </p>
            <p className="text-xs text-slate-500 mt-1">Players</p>
          </div>
          <div className="glass rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-pink-400 font-mono">
              {maxScore}
            </p>
            <p className="text-xs text-slate-500 mt-1">High Score</p>
          </div>
        </div>
      </div>
    </div>
  );
}
