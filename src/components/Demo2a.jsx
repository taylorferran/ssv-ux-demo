import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { metaMaskManager } from '../metamask-multichain'
import './Demo2a.css'

const Demo2a = () => {
  const [state, setState] = useState({
    isConnected: false,
    connectedAccount: null,
    hasSepoliaSmartAccount: false,
    hasBaseSepoliaSmartAccount: false,
    sepoliaSmartAccountAddress: null,
    baseSepoliaSmartAccountAddress: null,
    addressesMatch: null
  })
  const [loading, setLoading] = useState({
    connect: false,
    sepoliaAccount: false,
    baseSepoliaAccount: false,
    userOperations: false
  })
  const [logs, setLogs] = useState([])
  const [results, setResults] = useState(null)

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, { message, type, timestamp }])
  }

  const updateState = () => {
    setState(metaMaskManager.getState())
  }

  const handleConnectMetaMask = async () => {
    setLoading(prev => ({ ...prev, connect: true }))
    try {
      addLog('🦊 Connecting to MetaMask...', 'info')
      await metaMaskManager.connectMetaMask()
      updateState()
      addLog('✅ MetaMask connected successfully!', 'success')
    } catch (error) {
      addLog(`❌ Failed to connect to MetaMask: ${error.message}`, 'error')
    } finally {
      setLoading(prev => ({ ...prev, connect: false }))
    }
  }

  const handleCreateSepoliaAccount = async () => {
    setLoading(prev => ({ ...prev, sepoliaAccount: true }))
    try {
      addLog('🏭 Creating Sepolia smart account...', 'info')
      await metaMaskManager.getSepoliaSmartAccount()
      updateState()
      addLog('✅ Sepolia smart account created!', 'success')
    } catch (error) {
      addLog(`❌ Failed to create Sepolia smart account: ${error.message}`, 'error')
    } finally {
      setLoading(prev => ({ ...prev, sepoliaAccount: false }))
    }
  }

  const handleCreateBaseSepoliaAccount = async () => {
    setLoading(prev => ({ ...prev, baseSepoliaAccount: true }))
    try {
      addLog('🏭 Creating Base Sepolia smart account...', 'info')
      await metaMaskManager.getBaseSepoliaSmartAccount()
      updateState()
      addLog('✅ Base Sepolia smart account created!', 'success')
    } catch (error) {
      addLog(`❌ Failed to create Base Sepolia smart account: ${error.message}`, 'error')
    } finally {
      setLoading(prev => ({ ...prev, baseSepoliaAccount: false }))
    }
  }

  const handleSendCrossChainOperations = async () => {
    setLoading(prev => ({ ...prev, userOperations: true }))
    try {
      addLog('🚀 Starting cross-chain user operations...', 'info')
      addLog('⚠️ This will switch MetaMask networks automatically', 'info')
      const operationResults = await metaMaskManager.sendCrossChainUserOperations()
      setResults(operationResults)
      addLog('🎉 Cross-chain user operations completed successfully!', 'success')
      addLog(`📋 Sepolia: ${operationResults.userOperation1.transactionHash}`, 'success')
      addLog(`📋 Base Sepolia: ${operationResults.userOperation2.transactionHash}`, 'success')
    } catch (error) {
      addLog(`❌ Failed to send cross-chain user operations: ${error.message}`, 'error')
    } finally {
      setLoading(prev => ({ ...prev, userOperations: false }))
    }
  }

  const handleReset = () => {
    metaMaskManager.reset()
    updateState()
    setLogs([])
    setResults(null)
    addLog('🔄 Demo state reset', 'info')
  }

  useEffect(() => {
    updateState()
  }, [])

  return (
    <div className="demo-2a">
      <div className="demo-container">
        <header className="demo-header">
          <Link to="/" className="back-button">
            ← Back to Demos
          </Link>
          <h1 className="demo-title">Demo 2a: MetaMask + Cross-Chain Smart Accounts with 2 bundles sent</h1>
          <p className="demo-description">
            Connect MetaMask, create smart accounts on Sepolia and Base Sepolia, 
            and send cross-chain user operations with automatic network switching.
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
              <div className={`status-item ${state.hasSepoliaSmartAccount ? 'success' : 'pending'}`}>
                <span className="status-icon">{state.hasSepoliaSmartAccount ? '✅' : '⏳'}</span>
                <span>Sepolia Smart Account</span>
              </div>
              <div className={`status-item ${state.hasBaseSepoliaSmartAccount ? 'success' : 'pending'}`}>
                <span className="status-icon">{state.hasBaseSepoliaSmartAccount ? '✅' : '⏳'}</span>
                <span>Base Sepolia Smart Account</span>
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

            {state.hasSepoliaSmartAccount && (
              <div className="address-info">
                <h4>Smart Account Addresses</h4>
                <div className="address-item">
                  <strong>Sepolia:</strong>
                  <code>{state.sepoliaSmartAccountAddress}</code>
                </div>
                {state.baseSepoliaSmartAccountAddress && (
                  <div className="address-item">
                    <strong>Base Sepolia:</strong>
                    <code>{state.baseSepoliaSmartAccountAddress}</code>
                  </div>
                )}
                {state.addressesMatch !== null && (
                  <div className={`address-info ${state.addressesMatch ? 'success' : 'warning'}`}>
                    <strong>Addresses Match:</strong> {state.addressesMatch ? '✅ Yes' : '⚠️ No (Expected)'}
                  </div>
                )}
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
              <h4>2. Create Sepolia Smart Account</h4>
              <button
                className="btn btn-secondary"
                onClick={handleCreateSepoliaAccount}
                disabled={loading.sepoliaAccount || !state.isConnected || state.hasSepoliaSmartAccount}
              >
                {loading.sepoliaAccount ? '⏳ Creating...' : state.hasSepoliaSmartAccount ? '✅ Sepolia Account Ready' : '🏭 Create Sepolia Smart Account'}
              </button>
            </div>

            <div className="action-step">
              <h4>3. Create Base Sepolia Smart Account</h4>
              <button
                className="btn btn-secondary"
                onClick={handleCreateBaseSepoliaAccount}
                disabled={loading.baseSepoliaAccount || !state.hasSepoliaSmartAccount || state.hasBaseSepoliaSmartAccount}
              >
                {loading.baseSepoliaAccount ? '⏳ Creating...' : state.hasBaseSepoliaSmartAccount ? '✅ Base Sepolia Account Ready' : '🏭 Create Base Sepolia Smart Account'}
              </button>
            </div>

            <div className="action-step">
              <h4>4. Send Cross-Chain User Operations</h4>
              <div className="user-op-info">
                <p><strong>Operation 1:</strong> 3 transactions on Sepolia (0.001 ETH each)</p>
                <p><strong>Operation 2:</strong> 3 transactions on Base Sepolia (0.002 ETH each)</p>
                <p><strong>Note:</strong> MetaMask will automatically switch to Sepolia first, then to Base Sepolia</p>
              </div>
              
              <button
                className="btn btn-primary btn-large"
                onClick={handleSendCrossChainOperations}
                disabled={loading.userOperations || !state.hasBaseSepoliaSmartAccount}
              >
                {loading.userOperations ? '⏳ Sending Cross-Chain Operations...' : '🚀 Send Cross-Chain User Operations'}
              </button>
            </div>

            <div className="action-step">
              <button className="btn btn-danger" onClick={handleReset}>
                🔄 Reset Demo
              </button>
            </div>
          </div>

          {/* Results Panel */}
          {results && (
            <div className="results-panel">
              <h3>Transaction Results</h3>
              <div className="results-grid">
                <div className="result-card">
                  <h4>Sepolia Operation</h4>
                  <div className="result-item">
                    <strong>User Op Hash:</strong>
                    <code>{results.userOperation1.userOperationHash}</code>
                  </div>
                  <div className="result-item">
                    <strong>Transaction Hash:</strong>
                    <a 
                      href={`${results.userOperation1.explorer}/tx/${results.userOperation1.transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {results.userOperation1.transactionHash}
                    </a>
                  </div>
                  <div className="result-item">
                    <strong>Gas Used:</strong> {results.userOperation1.gasUsed.toString()}
                  </div>
                  <div className="result-item">
                    <strong>Status:</strong> 
                    <span className={results.userOperation1.success ? 'success' : 'error'}>
                      {results.userOperation1.success ? '✅ Success' : '❌ Failed'}
                    </span>
                  </div>
                </div>

                <div className="result-card">
                  <h4>Base Sepolia Operation</h4>
                  <div className="result-item">
                    <strong>User Op Hash:</strong>
                    <code>{results.userOperation2.userOperationHash}</code>
                  </div>
                  <div className="result-item">
                    <strong>Transaction Hash:</strong>
                    <a 
                      href={`${results.userOperation2.explorer}/tx/${results.userOperation2.transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {results.userOperation2.transactionHash}
                    </a>
                  </div>
                  <div className="result-item">
                    <strong>Gas Used:</strong> {results.userOperation2.gasUsed.toString()}
                  </div>
                  <div className="result-item">
                    <strong>Status:</strong> 
                    <span className={results.userOperation2.success ? 'success' : 'error'}>
                      {results.userOperation2.success ? '✅ Success' : '❌ Failed'}
                    </span>
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

export default Demo2a
