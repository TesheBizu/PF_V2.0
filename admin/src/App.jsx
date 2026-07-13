import { Routes, Route } from 'react-router-dom'

function App() {
  return (
    <Routes>
      <Route path="/" element={<div className="p-8 font-mono text-matrix-green">PF_V2.0 — Admin Panel</div>} />
    </Routes>
  )
}

export default App
