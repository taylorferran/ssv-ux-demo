import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { eip7702Manager } from '../eip7702-smart-account'
import './Demo25.css' // Reuse the same styling

const Demo3 = () => {
  const [state, setState] = useState({
    hasAccount: false,
    accountAddress: '',
    privateKey: '',
    hasClients: false,
    hasAuthorization: false,
    hasSmartAccount: false,
    smartAccountAddress: '',
  })

  const [loading, setLoading] = useState({
    account: false,
    clients: false,
    authorization: false,
    submission: false,
    smartAccount: false,
    userOperation: false,
  })

  const [userOpResult, setUserOpResult] = useState(null)
  const [authorizationHash, setAuthorizationHash] = useState('')

  const handleGenerateAccount = async () => {
    setLoading(prev => ({ ...prev, account: true }))
    try {
      const account = await eip7702Manager.generateRandomAccount()
      setState(prev => ({
        ...prev,
        hasAccount: true,
        accountAddress: account.address,
        privateKey: account.privateKey
      }))
    } catch (error) {
      console.error('Account generation failed:', error)
      alert('Failed to generate account: ' + error.message)
    } finally {
      setLoading(prev => ({ ...prev, account: false }))
    }
  }

  const handleSetupClients = async () => {
    setLoading(prev => ({ ...prev, clients: true }))
    try {
      await eip7702Manager.setupClients()
      setState(prev => ({ ...prev, hasClients: true }))
    } catch (error) {
      console.error('Client setup failed:', error)
      alert('Failed to setup clients: ' + error.message)
    } finally {
      setLoading(prev => ({ ...prev, clients: false }))
    }
  }

  const handleAuthorizeEIP7702 = async () => {
    setLoading(prev => ({ ...prev, authorization: true }))
    try {
      await eip7702Manager.authorizeEIP7702Delegation()
      setState(prev => ({ ...prev, hasAuthorization: true }))
    } catch (error) {
      console.error('Authorization failed:', error)
      alert('Failed to authorize EIP-7702: ' + error.message)
    } finally {
      setLoading(prev => ({ ...prev, authorization: false }))
    }
  }

  const handleSubmitAuthorization = async () => {
    setLoading(prev => ({ ...prev, submission: true }))
    try {
      const result = await eip7702Manager.submitAuthorization()
      setAuthorizationHash(result.hash)
    } catch (error) {
      console.error('Submission failed:', error)
      alert('Failed to submit authorization: ' + error.message)
    } finally {
      setLoading(prev => ({ ...prev, submission: false }))
    }
  }

  const handleCreateSmartAccount = async () => {
    setLoading(prev => ({ ...prev, smartAccount: true }))
    try {
      const account = await eip7702Manager.createMetaMaskSmartAccount()
      setState(prev => ({
        ...prev,
        hasSmartAccount: true,
        smartAccountAddress: account.smartAccount.address
      }))
    } catch (error) {
      console.error('Smart account creation failed:', error)
      alert('Failed to create smart account: ' + error.message)
    } finally {
      setLoading(prev => ({ ...prev, smartAccount: false }))
    }
  }

  const handleSendUserOperation = async () => {
    setLoading(prev => ({ ...prev, userOperation: true }))
    try {
      const result = await eip7702Manager.sendUserOperation()
      setUserOpResult(result)
    } catch (error) {
      console.error('User operation failed:', error)
      alert('Failed to send user operation: ' + error.message)
    } finally {
      setLoading(prev => ({ ...prev, userOperation: false }))
    }
  }

  const handleReset = () => {
    eip7702Manager.reset()
    setState({
      hasAccount: false,
      accountAddress: '',
      privateKey: '',
      hasClients: false,
      hasAuthorization: false,
      hasSmartAccount: false,
      smartAccountAddress: '',
    })
    setLoading({
      account: false,
      clients: false,
      authorization: false,
      submission: false,
      smartAccount: false,
      userOperation: false,
    })
    setUserOpResult(null)
    setAuthorizationHash('')
  }

  return (
    <div className="demo-container">
      <div className="demo-content">
        <div className="demo-header">
          <Link to="/" className="back-link">
            ← Back to Home
          </Link>
          <h1 className="demo-title">Demo 3: EIP-7702 Account Delegation + User Operation</h1>
          <p className="demo-description">
            Create a test EOA and transform it into a smart account using EIP-7702 delegation, then send a user operation on Sepolia.
          </p>
        </div>

        <div className="demo-body">
          <div className="demo-steps">
            <div className="action-step">
              <h4>1. Create Test Account</h4>
              <p>Create a test EOA account using a known private key for the demo</p>
              <button
                className="btn btn-primary"
                onClick={handleGenerateAccount}
                disabled={loading.account || state.hasAccount}
              >
                {loading.account ? '⏳ Creating...' : state.hasAccount ? '✅ Account Created' : '🎲 Create Test Account'}
              </button>
            </div>

            <div className="action-step">
              <h4>2. Setup Clients</h4>
              <p>Initialize public, wallet, and bundler clients for both chains</p>
              <button
                className="btn btn-primary"
                onClick={handleSetupClients}
                disabled={loading.clients || !state.hasAccount || state.hasClients}
              >
                {loading.clients ? '⏳ Setting up...' : state.hasClients ? '✅ Clients Ready' : '⚙️ Setup Clients'}
              </button>
            </div>

            <div className="action-step">
              <h4>3. Authorize EIP-7702 Delegation</h4>
              <p>Sign authorization to delegate your EOA to a smart contract</p>
              <button
                className="btn btn-primary"
                onClick={handleAuthorizeEIP7702}
                disabled={loading.authorization || !state.hasClients || state.hasAuthorization}
              >
                {loading.authorization ? '⏳ Authorizing...' : state.hasAuthorization ? '✅ Authorized' : '📝 Authorize Delegation'}
              </button>
            </div>

            <div className="action-step">
              <h4>4. Submit Authorization</h4>
              <p>Send EIP-7702 transaction to activate the delegation</p>
              <button
                className="btn btn-primary"
                onClick={handleSubmitAuthorization}
                disabled={loading.submission || !state.hasAuthorization || authorizationHash}
              >
                {loading.submission ? '⏳ Submitting...' : authorizationHash ? '✅ Submitted' : '📤 Submit Authorization'}
              </button>
            </div>

            <div className="action-step">
              <h4>5. Create Smart Account</h4>
              <p>Transform your EOA into a smart account on Sepolia</p>
              <button
                className="btn btn-primary"
                onClick={handleCreateSmartAccount}
                disabled={loading.smartAccount || !authorizationHash || state.hasSmartAccount}
              >
                {loading.smartAccount ? '⏳ Creating...' : state.hasSmartAccount ? '✅ Smart Account Ready' : '🦊 Create Smart Account'}
              </button>
            </div>

            <div className="action-step">
              <h4>6. Send User Operation</h4>
              <p>Send a user operation through your delegated smart account</p>
              <div className="user-op-info">
                <p><strong>Sepolia:</strong> 1 transaction (0.001 ETH)</p>
              </div>
              <button
                className="btn btn-primary btn-large"
                onClick={handleSendUserOperation}
                disabled={loading.userOperation || !state.hasSmartAccount}
              >
                {loading.userOperation ? '⏳ Sending Operation...' : '🚀 Send User Operation'}
              </button>
            </div>

            <div className="action-step">
              <button className="btn btn-danger" onClick={handleReset}>
                🔄 Reset Demo
              </button>
            </div>
          </div>

          <div className="demo-sidebar">
            <div className="status-panel">
              <h3>🔍 Status</h3>
              <div className="status-list">
                <div className={`status-item ${state.hasAccount ? 'success' : 'pending'}`}>
                  <span className="status-icon">{state.hasAccount ? '✅' : '⏳'}</span>
                  <span>Test Account Created</span>
                </div>
                <div className={`status-item ${state.hasClients ? 'success' : 'pending'}`}>
                  <span className="status-icon">{state.hasClients ? '✅' : '⏳'}</span>
                  <span>Clients Setup</span>
                </div>
                <div className={`status-item ${state.hasAuthorization ? 'success' : 'pending'}`}>
                  <span className="status-icon">{state.hasAuthorization ? '✅' : '⏳'}</span>
                  <span>EIP-7702 Authorized</span>
                </div>
                <div className={`status-item ${authorizationHash ? 'success' : 'pending'}`}>
                  <span className="status-icon">{authorizationHash ? '✅' : '⏳'}</span>
                  <span>Authorization Submitted</span>
                </div>
                <div className={`status-item ${state.hasSmartAccount ? 'success' : 'pending'}`}>
                  <span className="status-icon">{state.hasSmartAccount ? '✅' : '⏳'}</span>
                  <span>Smart Account</span>
                </div>
                <div className={`status-item ${userOpResult ? 'success' : 'pending'}`}>
                  <span className="status-icon">{userOpResult ? '✅' : '⏳'}</span>
                  <span>User Operation</span>
                </div>
              </div>
            </div>

            {state.hasAccount && (
              <div className="address-info">
                <h4>Test Account</h4>
                <div className="address-item">
                  <strong>EOA Address:</strong>
                  <code>{state.accountAddress}</code>
                </div>
                <div className="address-item">
                  <strong>Private Key:</strong>
                  <code>{state.privateKey.slice(0, 20)}...{state.privateKey.slice(-10)}</code>
                </div>
              </div>
            )}

            {authorizationHash && (
              <div className="address-info">
                <h4>Authorization Transaction</h4>
                <div className="address-item">
                  <strong>Transaction Hash:</strong>
                  <code>{authorizationHash.slice(0, 20)}...{authorizationHash.slice(-10)}</code>
                </div>
              </div>
            )}

            {state.hasSmartAccount && (
              <div className="address-info">
                <h4>Smart Account Address</h4>
                <div className="address-item">
                  <strong>Sepolia:</strong>
                  <code>{state.smartAccountAddress}</code>
                </div>
              </div>
            )}
          </div>
        </div>

        {userOpResult && (
          <div className="results-panel">
            <h3>🎉 User Operation Result</h3>
            <div className="results-grid">
              <div className="result-card">
                <h4>🟡 Sepolia Result</h4>
                <div className="result-item">
                  <strong>User Operation Hash:</strong>
                  <code>{userOpResult}</code>
                </div>
                <div className="result-item">
                  <strong>Smart Account:</strong>
                  <code>{state.smartAccountAddress}</code>
                </div>
                <div className="result-item">
                  <strong>Transaction:</strong>
                  <span>0.001 ETH</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="demo-info">
          <h3>🔍 About EIP-7702</h3>
          <p>
            <strong>EIP-7702 Account Delegation</strong> is a revolutionary proposal that allows EOAs to temporarily 
            delegate their behavior to smart contracts. This demo uses a randomly generated private key to showcase 
            the delegation process without requiring external wallet connections.
          </p>
          <div className="info-grid">
            <div className="info-item">
              <strong>🎲 Self-Contained:</strong> No external wallet needed
            </div>
            <div className="info-item">
              <strong>🔗 Delegation:</strong> Transform EOA into smart account
            </div>
            <div className="info-item">
              <strong>🔄 Reversible:</strong> Can be undone at any time
            </div>
            <div className="info-item">
              <strong>⛽ Gas Efficient:</strong> No migration costs
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Demo3
