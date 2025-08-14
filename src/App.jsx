import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import HomePage from './components/HomePage'
import Demo1a from './components/Demo1a'
import Demo2a from './components/Demo2a'
import Demo2b from './components/Demo2b'
import Demo25 from './components/Demo25'
import Demo26 from './components/Demo26'
import Demo3 from './components/Demo3'
import './App.css'

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/demo-1a" element={<Demo1a />} />
          <Route path="/demo-2a" element={<Demo2a />} />
          <Route path="/demo-2b" element={<Demo2b />} />
          <Route path="/demo-2-5" element={<Demo25 />} />
          <Route path="/demo-2-6" element={<Demo26 />} />
          <Route path="/demo-3" element={<Demo3 />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App