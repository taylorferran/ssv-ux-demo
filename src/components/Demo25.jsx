import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { webauthnManager } from '../webauthn-smart-account'
import './Demo25.css'

const Demo25 = () => {
  const [state, setState] = useState({
    hasCredential: false,
    hasOwner: false,
    hasWalletClients: false,
    hasSmartAccounts: false,
    sepoliaSmartAccountAddress: null,
    baseSepoliaSmartAccountAddress: null,
    addressesMatch: null,
    sepoliaUserOp: null,
    baseSepoliaUserOp: null,
    bothUserOps: null
  })
  const [loading, setLoading] = useState({
    credential: false,
    walletClients: false,
    smartAccounts: false,
    sepoliaUserOp: false,
    baseSepoliaUserOp: false,
    bothUserOps: false
  })
  const [logs, setLogs] = useState([])
  const [userOpParams] = useState({
    to: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    value: '0.001'
  })

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, { message, type, timestamp }])
  }

  const updateState = () => {
    setState(webauthnManager.getState())
  }

  const handleCreateWebAuthnCredential = async () => {
    setLoading(prev => ({ ...prev, credential: true }))
    try {
      addLog('🔐 Creating or retrieving WebAuthn credential...', 'info')
      await webauthnManager.getOrCreateWebAuthnCredential()
      addLog('✅ WebAuthn credential ready!', 'success')
      
      addLog('👤 Creating WebAuthn account...', 'info')
      await webauthnManager.createWebAuthnAccount()
      addLog('✅ WebAuthn account created!', 'success')
      
      updateState()
    } catch (error) {
      addLog(`❌ Failed to create WebAuthn credential/account: ${error.message}`, 'error')
    } finally {
      setLoading(prev => ({ ...prev, credential: false }))
    }
  }

  const handleSetupWallets = async () => {
    setLoading(prev => ({ ...prev, walletClients: true }))
    try {
      addLog('💼 Setting up wallet clients for both chains...', 'info')
      await webauthnManager.setupWalletClients()
      updateState()
      addLog('✅ Wallet clients created for Sepolia and Base Sepolia!', 'success')
    } catch (error) {
      addLog(`❌ Failed to setup wallet clients: ${error.message}`, 'error')
    } finally {
      setLoading(prev => ({ ...prev, walletClients: false }))
    }
  }

  const handleCreateSmartAccounts = async () => {
    setLoading(prev => ({ ...prev, smartAccounts: true }))
    try {
      addLog('🏭 Creating MetaMask smart accounts on both chains...', 'info')
      await webauthnManager.createMetaMaskSmartAccounts()
      updateState()
      addLog('✅ Smart accounts created on both chains!', 'success')
    } catch (error) {
      addLog(`❌ Failed to create MetaMask smart accounts: ${error.message}`, 'error')
    } finally {
      setLoading(prev => ({ ...prev, smartAccounts: false }))
    }
  }

  const handleSendSepoliaUserOperation = async () => {
    setLoading(prev => ({ ...prev, sepoliaUserOp: true }))
    try {
      addLog('🚀 Sending user operation on Sepolia...', 'info')
      const hash = await webauthnManager.sendSepoliaUserOperation(userOpParams.to, userOpParams.value)
      updateState()
      addLog(`✅ Sepolia user operation sent: ${hash}`, 'success')
    } catch (error) {
      addLog(`❌ Failed to send Sepolia user operation: ${error.message}`, 'error')
    } finally {
      setLoading(prev => ({ ...prev, sepoliaUserOp: false }))
    }
  }

  const handleSendBaseSepoliaUserOperation = async () => {
    setLoading(prev => ({ ...prev, baseSepoliaUserOp: true }))
    try {
      addLog('🚀 Sending user operation on Base Sepolia...', 'info')
      const hash = await webauthnManager.sendBaseSepoliaUserOperation(userOpParams.to, userOpParams.value)
      updateState()
      addLog(`✅ Base Sepolia user operation sent: ${hash}`, 'success')
    } catch (error) {
      addLog(`❌ Failed to send Base Sepolia user operation: ${error.message}`, 'error')
    } finally {
      setLoading(prev => ({ ...prev, baseSepoliaUserOp: false }))
    }
  }

  const handleSendBothUserOperations = async () => {
    setLoading(prev => ({ ...prev, bothUserOps: true }))
    try {
      addLog('🚀🚀 Initiating sequential user operations on both chains...', 'info')
      addLog('⚠️ WebAuthn requires sequential signing (no concurrent requests)', 'info')
      const results = await webauthnManager.sendBothUserOperations(userOpParams.to, userOpParams.value)
      updateState()
      addLog(`✅ Both user operations sent successfully!`, 'success')
      addLog(`- Sepolia: ${results.sepolia}`, 'success')
      addLog(`- Base Sepolia: ${results.baseSepolia}`, 'success')
    } catch (error) {
      addLog(`❌ Failed to send simultaneous user operations: ${error.message}`, 'error')
    } finally {
      setLoading(prev => ({ ...prev, bothUserOps: false }))
    }
  }

  const handleReset = () => {
    webauthnManager.reset()
    updateState()
    setLogs([])
    addLog('🔄 Application state reset', 'info')
  }

  useEffect(() => {
    updateState()
  }, [])

  return (
    <div className="demo-25">
      <div className="demo-container">
        <header className="demo-header">
          <Link to="/" className="back-button">
            ← Back to Demos
          </Link>
          <h1 className="demo-title">Demo 2.5: WebAuthn + Multi-Chain MetaMask Smart Account</h1>
          <p className="demo-description">
            Create WebAuthn passkeys, generate MetaMask smart accounts on Sepolia and Base Sepolia, 
            and send user operations with sequential signing across both chains.
          </p>
        </header>

        <div className="demo-content">
          {/* Status Panel */}
          <div className="status-panel">
            <h3>Status</h3>
            <div className="status-grid">
              <div className={`status-item ${state.hasOwner ? 'success' : 'pending'}`}>
                <span className="status-icon">{state.hasOwner ? '✅' : '⏳'}</span>
                <span>WebAuthn Account</span>
              </div>
              <div className={`status-item ${state.hasWalletClients ? 'success' : 'pending'}`}>
                <span className="status-icon">{state.hasWalletClients ? '✅' : '⏳'}</span>
                <span>Wallet Clients</span>
              </div>
              <div className={`status-item ${state.hasSmartAccounts ? 'success' : 'pending'}`}>
                <span className="status-icon">{state.hasSmartAccounts ? '✅' : '⏳'}</span>
                <span>Smart Accounts</span>
              </div>
            </div>

            {state.hasSmartAccounts && (
              <div className="address-info">
                <h4>Smart Account Addresses</h4>
                <div className="address-item">
                  <strong>Sepolia:</strong>
                  <code>{state.sepoliaSmartAccountAddress}</code>
                </div>
                <div className="address-item">
                  <strong>Base Sepolia:</strong>
                  <code>{state.baseSepoliaSmartAccountAddress}</code>
                </div>
                <div className={`address-info ${state.addressesMatch ? 'success' : 'warning'}`}>
                  <strong>Addresses Match:</strong> {state.addressesMatch ? '✅ Yes' : '⚠️ No (Expected)'}
                </div>
              </div>
            )}
          </div>

          {/* Step by Step Actions */}
          <div className="actions-panel">
            <h3>Step-by-Step Demo</h3>
            
            <div className="action-step">
              <h4>1. Create WebAuthn Account</h4>
              <button
                className="btn btn-primary"
                onClick={handleCreateWebAuthnCredential}
                disabled={loading.credential || state.hasOwner}
              >
                {loading.credential ? '⏳ Creating...' : state.hasOwner ? '✅ Account Ready' : '🔐 Create WebAuthn Account'}
              </button>
            </div>

            <div className="action-step">
              <h4>2. Setup Wallet Clients</h4>
              <button
                className="btn btn-secondary"
                onClick={handleSetupWallets}
                disabled={loading.walletClients || !state.hasOwner || state.hasWalletClients}
              >
                {loading.walletClients ? '⏳ Setting up...' : state.hasWalletClients ? '✅ Wallets Ready' : '💼 Setup Multi-Chain Wallets'}
              </button>
            </div>

            <div className="action-step">
              <h4>3. Create Smart Accounts</h4>
              <button
                className="btn btn-secondary"
                onClick={handleCreateSmartAccounts}
                disabled={loading.smartAccounts || !state.hasWalletClients || state.hasSmartAccounts}
              >
                {loading.smartAccounts ? '⏳ Creating...' : state.hasSmartAccounts ? '✅ Smart Accounts Ready' : '🏭 Create MetaMask Smart Accounts'}
              </button>
            </div>

            <div className="action-step">
              <h4>4. Send User Operations</h4>
              <div className="user-op-params">
                <p><strong>To:</strong> <code>{userOpParams.to}</code></p>
                <p><strong>Value:</strong> {userOpParams.value} ETH</p>
              </div>
              
              <div className="multi-chain-buttons">
                <button
                  className="btn btn-primary btn-large"
                  onClick={handleSendBothUserOperations}
                  disabled={loading.bothUserOps || !state.hasSmartAccounts}
                >
                  {loading.bothUserOps ? '⏳ Signing Both Sequentially...' : '🚀 Send on BOTH Chains (Sequential Signing)'}
                </button>
                
                <div className="individual-buttons">
                  <button
                    className="btn btn-outline"
                    onClick={handleSendSepoliaUserOperation}
                    disabled={loading.sepoliaUserOp || !state.hasSmartAccounts}
                  >
                    {loading.sepoliaUserOp ? '⏳ Sending...' : '📤 Sepolia Only'}
                  </button>
                  
                  <button
                    className="btn btn-outline"
                    onClick={handleSendBaseSepoliaUserOperation}
                    disabled={loading.baseSepoliaUserOp || !state.hasSmartAccounts}
                  >
                    {loading.baseSepoliaUserOp ? '⏳ Sending...' : '📤 Base Sepolia Only'}
                  </button>
                </div>
              </div>
            </div>

            <div className="action-step">
              <button className="btn btn-danger" onClick={handleReset}>
                🔄 Reset Demo
              </button>
            </div>
          </div>

          {/* Logs Panel */}
          <div className="logs-panel">
            <h3>Activity Logs</h3>
            <div className="logs-container">
              {logs.length === 0 ? (
                <p className="no-logs">No activity yet. Start by creating a WebAuthn credential!</p>
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

export default Demo25
