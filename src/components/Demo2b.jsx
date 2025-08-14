import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { batchingManager } from '../metamask-batching'
import './Demo2b.css'

const Demo2b = () => {
  const [state, setState] = useState({
    isConnected: false,
    connectedAccount: null,
    hasSmartAccount: false,
    smartAccountAddress: null
  })
  const [loading, setLoading] = useState({
    connect: false,
    smartAccount: false,
    batchOperation: false
  })
  const [logs, setLogs] = useState([])
  const [result, setResult] = useState(null)

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, { message, type, timestamp }])
  }

  const updateState = () => {
    setState(batchingManager.getState())
  }

  const handleConnectMetaMask = async () => {
    setLoading(prev => ({ ...prev, connect: true }))
    try {
      addLog('🦊 Connecting to MetaMask...', 'info')
      await batchingManager.connectMetaMask()
      updateState()
      addLog('✅ MetaMask connected successfully!', 'success')
    } catch (error) {
      addLog(`❌ Failed to connect to MetaMask: ${error.message}`, 'error')
    } finally {
      setLoading(prev => ({ ...prev, connect: false }))
    }
  }

  const handleCreateSmartAccount = async () => {
    setLoading(prev => ({ ...prev, smartAccount: true }))
    try {
      addLog('🏭 Creating smart account...', 'info')
      await batchingManager.createSmartAccount()
      updateState()
      addLog('✅ Smart account created!', 'success')
    } catch (error) {
      addLog(`❌ Failed to create smart account: ${error.message}`, 'error')
    } finally {
      setLoading(prev => ({ ...prev, smartAccount: false }))
    }
  }

  const handleSendBatchedOperation = async () => {
    setLoading(prev => ({ ...prev, batchOperation: true }))
    try {
      addLog('📦 Starting batched user operation...', 'info')
      addLog('⚡ All transactions will be executed in a single user operation', 'info')
      const operationResult = await batchingManager.sendBatchedUserOperation()
      setResult(operationResult)
      addLog('🎉 Batched user operation completed successfully!', 'success')
      addLog(`📋 Transaction Hash: ${operationResult.transactionHash}`, 'success')
      addLog(`⛽ Gas Used: ${operationResult.gasUsed.toString()}`, 'success')
    } catch (error) {
      addLog(`❌ Failed to send batched user operation: ${error.message}`, 'error')
    } finally {
      setLoading(prev => ({ ...prev, batchOperation: false }))
    }
  }

  const handleReset = () => {
    batchingManager.reset()
    updateState()
    setLogs([])
    setResult(null)
    addLog('🔄 Demo state reset', 'info')
  }

  useEffect(() => {
    updateState()
  }, [])

  return (
    <div className="demo-2b">
      <div className="demo-container">
        <header className="demo-header">
          <Link to="/" className="back-button">
            ← Back to Demos
          </Link>
          <h1 className="demo-title">Demo 2b: MetaMask + Batched Transactions</h1>
          <p className="demo-description">
            Connect MetaMask, create a smart account, and send multiple transactions 
            in a single user operation on Sepolia
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
              <div className={`status-item ${state.hasSmartAccount ? 'success' : 'pending'}`}>
                <span className="status-icon">{state.hasSmartAccount ? '✅' : '⏳'}</span>
                <span>Smart Account Created</span>
              </div>
            </div>

            {state.isConnected && (
              <div className="address-info">
                <h4>Connected Account</h4>
                <div className="address-item">
                  <strong>MetaMask EOA:</strong>
                  <code>{state.connectedAccount}</code>
                </div>
              </div>
            )}

            {state.hasSmartAccount && (
              <div className="address-info">
                <h4>Smart Account</h4>
                <div className="address-item">
                  <strong>Smart Account Address:</strong>
                  <code>{state.smartAccountAddress}</code>
                </div>
              </div>
            )}
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
              <h4>2. Create Smart Account</h4>
              <button
                className="btn btn-secondary"
                onClick={handleCreateSmartAccount}
                disabled={loading.smartAccount || !state.isConnected || state.hasSmartAccount}
              >
                {loading.smartAccount ? '⏳ Creating...' : state.hasSmartAccount ? '✅ Smart Account Ready' : '🏭 Create Smart Account'}
              </button>
            </div>

            <div className="action-step">
              <h4>3. Send Batched Transactions</h4>
              <div className="batch-info">
                <h5>📦 Batch Details:</h5>
                <ul>
                  <li><strong>Transaction 1:</strong> Send 0.00001 ETH to 0x1234...7890</li>
                  <li><strong>Transaction 2:</strong> Send 0.00002 ETH to 0x5678...1234</li>
                  <li><strong>Transaction 3:</strong> Call to zero address (no-op)</li>
                </ul>
                <div className="batch-benefits">
                  <p><strong>✨ Benefits:</strong></p>
                  <ul>
                    <li>🔥 Single gas fee for all transactions</li>
                    <li>⚡ Atomic execution (all succeed or all fail)</li>
                    <li>🎯 One signature for multiple operations</li>
                  </ul>
                </div>
              </div>
              
              <button
                className="btn btn-primary btn-large"
                onClick={handleSendBatchedOperation}
                disabled={loading.batchOperation || !state.hasSmartAccount}
              >
                {loading.batchOperation ? '⏳ Batching Transactions...' : '📦 Send Batched User Operation'}
              </button>
            </div>

            <div className="action-step">
              <button className="btn btn-danger" onClick={handleReset}>
                🔄 Reset Demo
              </button>
            </div>
          </div>

          {/* Result Panel */}
          {result && (
            <div className="result-panel">
              <h3>Batch Operation Result</h3>
              <div className="result-card">
                <div className="result-header">
                  <h4>✅ Successful Batch Execution</h4>
                  <div className="batch-stats">
                    <span className="stat">📦 {result.batchSize} Transactions</span>
                    <span className="stat">⛽ {result.gasUsed.toString()} Gas Used</span>
                    <span className="stat">🏠 {result.chain}</span>
                  </div>
                </div>
                
                <div className="result-item">
                  <strong>User Operation Hash:</strong>
                  <code>{result.userOperationHash}</code>
                </div>
                
                <div className="result-item">
                  <strong>Transaction Hash:</strong>
                  <a 
                    href={`${result.explorer}/tx/${result.transactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {result.transactionHash}
                  </a>
                </div>
                
                <div className="result-item">
                  <strong>Block Number:</strong>
                  <span>{result.blockNumber.toString()}</span>
                </div>
                
                <div className="result-item">
                  <strong>Status:</strong>
                  <span className={result.success ? 'success' : 'error'}>
                    {result.success ? '✅ Success' : '❌ Failed'}
                  </span>
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

export default Demo2b
