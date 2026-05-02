import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import PlayerSetupPage from './pages/PlayerSetupPage'
import GamePage from './pages/GamePage'
import LeaderboardPage from './pages/LeaderboardPage'

function App() {
  const [players, setPlayers] = useState([])
  const [scores, setScores] = useState({})
  const [difficulty, setDifficulty] = useState('easy')
  const [rounds, setRounds] = useState(3)

  const resetGame = () => {
    setScores({})
  }

  return (
    <Router>
      <div className="min-h-screen bg-gradient-game relative">
        <div className="particles-bg" />
        <div className="relative z-10">
          <Routes>
            <Route
              path="/"
              element={
                <PlayerSetupPage
                  players={players}
                  setPlayers={setPlayers}
                  difficulty={difficulty}
                  setDifficulty={setDifficulty}
                  rounds={rounds}
                  setRounds={setRounds}
                  onStart={resetGame}
                />
              }
            />
            <Route
              path="/game"
              element={
                <GamePage
                  players={players}
                  scores={scores}
                  setScores={setScores}
                  difficulty={difficulty}
                  rounds={rounds}
                />
              }
            />
            <Route
              path="/leaderboard"
              element={
                <LeaderboardPage
                  players={players}
                  scores={scores}
                  resetGame={resetGame}
                />
              }
            />
          </Routes>
        </div>
      </div>
    </Router>
  )
}

export default App
