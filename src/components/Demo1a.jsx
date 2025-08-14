import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { sendCallsManager } from '../sendcalls-multichain'
import './Demo1a.css'

const Demo1a = () => {
  const [state, setState] = useState({
    isConnected: false,
    connectedAccount: null,
    currentChain: null,
    hasResults: false
  })
  const [loading, setLoading] = useState({
    connect: false,
    sepoliaCalls: false,
    baseSepoliaCalls: false,
    multiChainCalls: false
  })
  const [logs, setLogs] = useState([])
  const [results, setResults] = useState(null)

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, { message, type, timestamp }])
  }

  const updateState = () => {
    setState(sendCallsManager.getState())
  }

  const handleConnectMetaMask = async () => {
    setLoading(prev => ({ ...prev, connect: true }))
    try {
      addLog('🦊 Connecting to MetaMask...', 'info')
      addLog('📋 This demo uses EIP-5792 sendCalls for multi-chain batching', 'info')
      await sendCallsManager.connectMetaMask()
      updateState()
      addLog('✅ MetaMask connected successfully!', 'success')
      addLog(`📍 Current chain: ${sendCallsManager.currentChain?.name}`, 'info')
    } catch (error) {
      addLog(`❌ Failed to connect to MetaMask: ${error.message}`, 'error')
    } finally {
      setLoading(prev => ({ ...prev, connect: false }))
    }
  }

  const handleSendSepoliaCalls = async () => {
    setLoading(prev => ({ ...prev, sepoliaCalls: true }))
    try {
      addLog('📤 Sending batched calls on Sepolia...', 'info')
      const result = await sendCallsManager.sendSepoliaCalls()
      updateState()
      addLog(`✅ Sepolia calls sent successfully! ID: ${result.id}`, 'success')
      addLog(`📊 Status: ${result.status.status}`, 'success')
    } catch (error) {
      addLog(`❌ Failed to send Sepolia calls: ${error.message}`, 'error')
    } finally {
      setLoading(prev => ({ ...prev, sepoliaCalls: false }))
    }
  }

  const handleSendBaseSepoliaCalls = async () => {
    setLoading(prev => ({ ...prev, baseSepoliaCalls: true }))
    try {
      addLog('📤 Sending batched calls on Base Sepolia...', 'info')
      const result = await sendCallsManager.sendBaseSepoliaCalls()
      updateState()
      addLog(`✅ Base Sepolia calls sent successfully! ID: ${result.id}`, 'success')
      addLog(`📊 Status: ${result.status.status}`, 'success')
    } catch (error) {
      addLog(`❌ Failed to send Base Sepolia calls: ${error.message}`, 'error')
    } finally {
      setLoading(prev => ({ ...prev, baseSepoliaCalls: false }))
    }
  }

  const handleSendMultiChainCalls = async () => {
    setLoading(prev => ({ ...prev, multiChainCalls: true }))
    try {
      addLog('🚀 Starting multi-chain sendCalls demo...', 'info')
      addLog('⚡ Will send batched calls on both Sepolia and Base Sepolia', 'info')
      const operationResults = await sendCallsManager.sendMultiChainCalls()
      setResults(operationResults)
      updateState()
      addLog('🎉 Multi-chain sendCalls completed successfully!', 'success')
      addLog(`📊 Sepolia: ${operationResults.sepolia.callCount} calls`, 'success')
      addLog(`📊 Base Sepolia: ${operationResults.baseSepolia.callCount} calls`, 'success')
    } catch (error) {
      addLog(`❌ Failed to send multi-chain calls: ${error.message}`, 'error')
    } finally {
      setLoading(prev => ({ ...prev, multiChainCalls: false }))
    }
  }

  const handleReset = () => {
    sendCallsManager.reset()
    updateState()
    setLogs([])
    setResults(null)
    addLog('🔄 Demo state reset', 'info')
  }

  useEffect(() => {
    updateState()
  }, [])

  return (
    <div className="demo-1a">
      <div className="demo-container">
        <header className="demo-header">
          <Link to="/" className="back-button">
            ← Back to Demos
          </Link>
          <h1 className="demo-title">Demo 1a: EIP-5792 Multi-Chain sendCalls</h1>
          <p className="demo-description">
            Connect MetaMask and use EIP-5792 sendCalls to send batched transactions 
            across Sepolia and Base Sepolia testnets.
          </p>
        </header>

        <div className="demo-content">
          {/* Status Panel */}
          <div className="status-panel">
            <h3>Status</h3>
            <div className="status-grid">
              <div className={`status-item ${state.isConnected ? 'success' : 'pending'}`}>
                <span className="status-icon">{state.isConnected ? '✅' : '⏳'}</span>
                <span>MetaMask Connected</span>
              </div>
              <div className={`status-item ${state.hasResults ? 'success' : 'pending'}`}>
                <span className="status-icon">{state.hasResults ? '✅' : '⏳'}</span>
                <span>Multi-Chain Calls Sent</span>
              </div>
            </div>

            {state.isConnected && (
              <div className="address-info">
                <h4>Connection Info</h4>
                <div className="address-item">
                  <strong>Account:</strong>
                  <code>{state.connectedAccount}</code>
                </div>
                <div className="address-item">
                  <strong>Current Chain:</strong>
                  <span>{state.currentChain?.name || 'Unknown'}</span>
                </div>
              </div>
            )}

            <div className="eip5792-info">
              <h4>🔗 EIP-5792 Features</h4>
              <ul>
                <li>🎯 Native wallet call batching</li>
                <li>🌐 Multi-chain support</li>
                <li>📊 Status tracking</li>
                <li>⚡ Automatic chain switching</li>
              </ul>
            </div>
          </div>

          {/* Step by Step Actions */}
          <div className="actions-panel">
            <h3>Step-by-Step Demo</h3>
            
            <div className="action-step">
              <h4>1. Connect MetaMask</h4>
              <button
                className="btn btn-primary"
                onClick={handleConnectMetaMask}
                disabled={loading.connect || state.isConnected}
              >
                {loading.connect ? '⏳ Connecting...' : state.isConnected ? '✅ MetaMask Connected' : '🦊 Connect MetaMask'}
              </button>
            </div>

            <div className="action-step">
              <h4>2. Send Multi-Chain Calls</h4>
              <div className="multichain-info">
                <h5>📦 What will happen:</h5>
                <ul>
                  <li><strong>Sepolia:</strong> 3 batched calls to 0xa5cc...78AC</li>
                  <li><strong>Base Sepolia:</strong> 2 batched calls to 0xa5cc...78AC</li>
                  <li><strong>Data:</strong> 0xdeadbeef for all calls</li>
                </ul>
                <div className="sendcalls-benefits">
                  <p><strong>✨ EIP-5792 Benefits:</strong></p>
                  <ul>
                    <li>🎯 Native wallet batching (no smart accounts needed)</li>
                    <li>🔄 Automatic chain switching</li>
                    <li>📊 Built-in status tracking</li>
                    <li>⚡ Optimized for multi-chain UX</li>
                  </ul>
                </div>
              </div>
              
              <button
                className="btn btn-primary btn-large"
                onClick={handleSendMultiChainCalls}
                disabled={loading.multiChainCalls || !state.isConnected}
              >
                {loading.multiChainCalls ? '⏳ Sending Multi-Chain Calls...' : '🚀 Send Multi-Chain Calls'}
              </button>
              
              <div className="individual-buttons">
                <button
                  className="btn btn-secondary"
                  onClick={handleSendSepoliaCalls}
                  disabled={loading.sepoliaCalls || !state.isConnected}
                >
                  {loading.sepoliaCalls ? '⏳ Sending...' : '📤 Sepolia Only'}
                </button>
                
                <button
                  className="btn btn-secondary"
                  onClick={handleSendBaseSepoliaCalls}
                  disabled={loading.baseSepoliaCalls || !state.isConnected}
                >
                  {loading.baseSepoliaCalls ? '⏳ Sending...' : '📤 Base Sepolia Only'}
                </button>
              </div>
            </div>

            <div className="action-step">
              <button className="btn btn-danger" onClick={handleReset}>
                🔄 Reset Results
              </button>
            </div>
          </div>

          {/* Results Panel */}
          {results && (
            <div className="results-panel">
              <h3>Multi-Chain Results</h3>
              <div className="results-summary">
                <div className="summary-stats">
                  <span className="stat">🌐 {results.totalChains} Chains</span>
                  <span className="stat">📞 {results.totalCalls} Total Calls</span>
                  <span className="stat">✅ EIP-5792</span>
                </div>
              </div>
              
              <div className="results-grid">
                <div className="result-card">
                  <h4>🔵 Sepolia Results</h4>
                  <div className="result-item">
                    <strong>Call Batch ID:</strong>
                    <code>{results.sepolia.id}</code>
                  </div>
                  <div className="result-item">
                    <strong>Calls Count:</strong>
                    <span>{results.sepolia.callCount}</span>
                  </div>
                  <div className="result-item">
                    <strong>Status:</strong>
                    <span className={results.sepolia.status.status === 'confirmed' ? 'success' : 'pending'}>
                      {results.sepolia.status.status || 'Unknown'}
                    </span>
                  </div>
                  <div className="result-item">
                    <strong>Explorer:</strong>
                    <a href={results.sepolia.explorer} target="_blank" rel="noopener noreferrer">
                      View on Etherscan
                    </a>
                  </div>
                </div>

                <div className="result-card">
                  <h4>🔵 Base Sepolia Results</h4>
                  <div className="result-item">
                    <strong>Call Batch ID:</strong>
                    <code>{results.baseSepolia.id}</code>
                  </div>
                  <div className="result-item">
                    <strong>Calls Count:</strong>
                    <span>{results.baseSepolia.callCount}</span>
                  </div>
                  <div className="result-item">
                    <strong>Status:</strong>
                    <span className={results.baseSepolia.status.status === 'confirmed' ? 'success' : 'pending'}>
                      {results.baseSepolia.status.status || 'Unknown'}
                    </span>
                  </div>
                  <div className="result-item">
                    <strong>Explorer:</strong>
                    <a href={results.baseSepolia.explorer} target="_blank" rel="noopener noreferrer">
                      View on Base Explorer
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Logs Panel */}
          <div className="logs-panel">
            <h3>Activity Logs</h3>
            <div className="logs-container">
              {logs.length === 0 ? (
                <p className="no-logs">No activity yet. Start by connecting MetaMask!</p>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className={`log-entry ${log.type}`}>
                    <span className="log-timestamp">{log.timestamp}</span>
                    <span className="log-message">{log.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Demo1a
