/**
 * Displays the current game prompt with animated styling.
 */
export default function PromptDisplay({ prompt, matched }) {
  if (!prompt) return null;

  return (
    <div className={`
      relative overflow-hidden rounded-2xl p-6 text-center transition-all duration-500
      ${matched
        ? 'bg-emerald-500/20 border-2 border-emerald-400 neon-glow-success'
        : 'glass border-2 border-indigo-500/30 animate-border-glow'
      }
    `}>
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-cyan-500/5 pointer-events-none" />

      <div className="relative z-10">
        <p className="text-sm font-medium text-indigo-300 mb-2 uppercase tracking-widest">
          🎯 Your Mission
        </p>
        <h2 className={`
          text-3xl md:text-4xl font-bold font-display transition-all duration-300
          ${matched ? 'text-emerald-300 neon-text' : 'text-white'}
        `}>
          {prompt.text}
        </h2>
        {prompt.type === 'color' && (
          <div className="mt-3 flex items-center justify-center gap-2">
            <div
              className="w-6 h-6 rounded-full border-2 border-white/30"
              style={{ backgroundColor: prompt.target }}
            />
            <span className="text-sm text-slate-400">Color Detection Active</span>
          </div>
        )}
        {matched && (
          <div className="mt-4 animate-scale-in">
            <span className="text-xl">✅ Object Found!</span>
          </div>
        )}
      </div>
    </div>
  );
}
