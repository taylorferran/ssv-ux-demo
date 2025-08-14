import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { PrivyProvider, usePrivy, useWallets } from "@privy-io/react-auth";
import { privyManager } from "../privy-smart-account";
import "./Demo26.css";

const PRIVY_APP_ID = "cme9vkbog002pjq0b3fzlqllo";

// Inner component that uses Privy hooks
const Demo26Inner = () => {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const { wallets } = useWallets();
  
  const [state, setState] = useState({
    hasPrivyUser: false,
    hasPrivyWallet: false,
    hasOwner: false,
    hasWalletClients: false,
    hasSmartAccounts: false,
    ownerAddress: null,
    sepoliaSmartAccountAddress: null,
    baseSepoliaSmartAccountAddress: null,
    addressesMatch: false
  });
  
  const [loading, setLoading] = useState({
    login: false,
    setupWallets: false,
    smartAccounts: false,
    sepoliaUserOp: false,
    baseSepoliaUserOp: false,
    bothUserOps: false
  });
  
  const [logs, setLogs] = useState([]);
  const [userOpResults, setUserOpResults] = useState(null);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { timestamp, message, type }]);
  };

  const updateState = () => {
    const newState = privyManager.getState();
    setState(newState);
  };

  useEffect(() => {
    if (ready) {
      addLog('✅ Privy SDK ready', 'success');
      if (authenticated && user) {
        addLog(`✅ User authenticated: ${user.email?.address || user.id}`, 'success');
      }
    }
  }, [ready, authenticated, user]);

  useEffect(() => {
    updateState();
  }, []);

  const handleLogin = async () => {
    setLoading(prev => ({ ...prev, login: true }));
    try {
      addLog('🔐 Starting Privy login...', 'info');
      await login();
      addLog('✅ Privy login successful!', 'success');
      updateState();
    } catch (error) {
      addLog(`❌ Failed to login: ${error.message}`, 'error');
    } finally {
      setLoading(prev => ({ ...prev, login: false }));
    }
  };

  const handleSetupWallets = async () => {
    setLoading(prev => ({ ...prev, setupWallets: true }));
    try {
      addLog('👛 Setting up Privy wallet...', 'info');
      
      if (!authenticated || !user) {
        throw new Error('Please login first');
      }

      const embeddedWallet = wallets.find(wallet => wallet.walletClientType === 'privy');
      if (!embeddedWallet) {
        throw new Error('No embedded wallet found');
      }

      addLog('✅ Found Privy embedded wallet', 'success');
      addLog(`📱 Wallet address: ${embeddedWallet.address}`, 'info');
      
      await privyManager.setPrivyWallet(user, embeddedWallet);
      addLog('✅ Privy wallet set up!', 'success');
      
      addLog('💼 Setting up wallet clients...', 'info');
      await privyManager.setupWalletClients();
      addLog('✅ Wallet clients ready!', 'success');
      
      updateState();
    } catch (error) {
      addLog(`❌ Failed to setup wallets: ${error.message}`, 'error');
    } finally {
      setLoading(prev => ({ ...prev, setupWallets: false }));
    }
  };

  const handleCreateSmartAccounts = async () => {
    setLoading(prev => ({ ...prev, smartAccounts: true }));
    try {
      addLog('🦊 Creating MetaMask smart accounts...', 'info');
      await privyManager.createMetaMaskSmartAccounts();
      addLog('✅ Smart accounts created on both chains!', 'success');
      updateState();
    } catch (error) {
      addLog(`❌ Failed to create smart accounts: ${error.message}`, 'error');
    } finally {
      setLoading(prev => ({ ...prev, smartAccounts: false }));
    }
  };

  const handleSendSepoliaUserOp = async () => {
    setLoading(prev => ({ ...prev, sepoliaUserOp: true }));
    try {
      addLog('🚀 Sending Sepolia user operation...', 'info');
      const result = await privyManager.sendSepoliaUserOperation();
      addLog(`✅ Sepolia user operation sent: ${result}`, 'success');
      setUserOpResults(prev => ({ ...prev, sepolia: result }));
    } catch (error) {
      addLog(`❌ Failed to send Sepolia user operation: ${error.message}`, 'error');
    } finally {
      setLoading(prev => ({ ...prev, sepoliaUserOp: false }));
    }
  };

  const handleSendBaseSepoliaUserOp = async () => {
    setLoading(prev => ({ ...prev, baseSepoliaUserOp: true }));
    try {
      addLog('🚀 Sending Base Sepolia user operation...', 'info');
      const result = await privyManager.sendBaseSepoliaUserOperation();
      addLog(`✅ Base Sepolia user operation sent: ${result}`, 'success');
      setUserOpResults(prev => ({ ...prev, baseSepolia: result }));
    } catch (error) {
      addLog(`❌ Failed to send Base Sepolia user operation: ${error.message}`, 'error');
    } finally {
      setLoading(prev => ({ ...prev, baseSepoliaUserOp: false }));
    }
  };

  const handleSendBothUserOps = async () => {
    setLoading(prev => ({ ...prev, bothUserOps: true }));
    try {
      addLog('🚀🚀 Sending user operations on BOTH chains...', 'info');
      addLog('✨ Note: Privy supports parallel transactions!', 'info');
      const results = await privyManager.sendBothUserOperations();
      addLog('✅ Both user operations sent successfully!', 'success');
      addLog(`📊 Sepolia: ${results.sepolia}`, 'success');
      addLog(`📊 Base Sepolia: ${results.baseSepolia}`, 'success');
      setUserOpResults(results);
    } catch (error) {
      addLog(`❌ Failed to send both user operations: ${error.message}`, 'error');
    } finally {
      setLoading(prev => ({ ...prev, bothUserOps: false }));
    }
  };

  const handleReset = () => {
    privyManager.reset();
    setUserOpResults(null);
    setLogs([]);
    updateState();
    addLog('🔄 Application state reset', 'info');
    if (authenticated) {
      logout();
    }
  };

  if (!ready) {
    return <div className="demo-loading">Loading Privy...</div>;
  }

  return (
    <div className="demo26">
      <div className="demo-container">
        <header className="demo-header">
          <Link to="/" className="back-button">
            ← Back to Demos
          </Link>
          <h1 className="demo-title">Demo 2.2: Privy Email Auth + Multi-Chain MetaMask Smart Accounts</h1>
          <p className="demo-description">
            Login with Privy (email authentication) and create MetaMask smart accounts owned by your Privy EOA. 
          </p>
        </header>

        <div className="demo-content">
          {/* Status Panel */}
          <div className="status-panel">
            <h3>📊 Current Status</h3>
            <div className="status-grid">
              <div className={`status-item ${authenticated ? 'success' : 'pending'}`}>
                <span className="status-icon">{authenticated ? '✅' : '⏳'}</span>
                <span>Privy Login</span>
              </div>
              <div className={`status-item ${state.hasOwner ? 'success' : 'pending'}`}>
                <span className="status-icon">{state.hasOwner ? '✅' : '⏳'}</span>
                <span>Wallet Setup</span>
              </div>
              <div className={`status-item ${state.hasSmartAccounts ? 'success' : 'pending'}`}>
                <span className="status-icon">{state.hasSmartAccounts ? '✅' : '⏳'}</span>
                <span>Smart Accounts</span>
              </div>
              <div className={`status-item ${userOpResults ? 'success' : 'pending'}`}>
                <span className="status-icon">{userOpResults ? '✅' : '⏳'}</span>
                <span>User Operations</span>
              </div>
            </div>

            {/* Address Information */}
            {state.hasOwner && (
              <div className="address-info">
                <h4>🔗 Addresses</h4>
                <div className="address-item">
                  <strong>Privy EOA (Owner):</strong>
                  <code>{state.ownerAddress}</code>
                </div>
                {state.sepoliaSmartAccountAddress && (
                  <div className="address-item">
                    <strong>Sepolia Smart Account:</strong>
                    <code>{state.sepoliaSmartAccountAddress}</code>
                  </div>
                )}
                {state.baseSepoliaSmartAccountAddress && (
                  <div className="address-item">
                    <strong>Base Sepolia Smart Account:</strong>
                    <code>{state.baseSepoliaSmartAccountAddress}</code>
                  </div>
                )}
                {state.sepoliaSmartAccountAddress && state.baseSepoliaSmartAccountAddress && (
                  <div className="address-item">
                    <strong>Same Address Across Chains:</strong>
                    <span className={state.addressesMatch ? 'success' : 'warning'}>
                      {state.addressesMatch ? '✅ Yes' : '⚠️ No'}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions Panel */}
          <div className="actions-panel">
            <h3>🎯 Actions</h3>

            {!authenticated ? (
              <div className="action-step">
                <h4>1. Login with Privy</h4>
                <p>Connect using email authentication (social OAuth providers not configured for this demo app)</p>
                <button
                  className="btn btn-primary btn-large"
                  onClick={handleLogin}
                  disabled={loading.login}
                >
                  {loading.login ? '⏳ Logging in...' : '🔐 Login with Email'}
                </button>
              </div>
            ) : (
              <>
                <div className="action-step">
                  <h4>1. ✅ Logged in as {user?.email?.address || 'Social User'}</h4>
                  <p>Privy authentication successful!</p>
                </div>

                <div className="action-step">
                  <h4>2. Setup Wallet & Clients</h4>
                  <p>Configure Privy embedded wallet and create Viem clients for both chains</p>
                  <button
                    className="btn btn-primary"
                    onClick={handleSetupWallets}
                    disabled={loading.setupWallets || state.hasOwner}
                  >
                    {loading.setupWallets ? '⏳ Setting up...' : state.hasOwner ? '✅ Wallet Ready' : '👛 Setup Wallet'}
                  </button>
                </div>

                <div className="action-step">
                  <h4>3. Create Smart Accounts</h4>
                  <p>Deploy MetaMask smart accounts owned by your Privy EOA on both chains</p>
                  <button
                    className="btn btn-primary"
                    onClick={handleCreateSmartAccounts}
                    disabled={loading.smartAccounts || !state.hasOwner || state.hasSmartAccounts}
                  >
                    {loading.smartAccounts ? '⏳ Creating...' : state.hasSmartAccounts ? '✅ Smart Accounts Ready' : '🦊 Create Smart Accounts'}
                  </button>
                </div>

                <div className="action-step">
                  <h4>4. Send User Operations</h4>
                  <p>Send user operations through smart accounts on individual chains or both simultaneously</p>
                  
                  <button
                    className="btn btn-primary btn-large"
                    onClick={handleSendBothUserOps}
                    disabled={loading.bothUserOps || !state.hasSmartAccounts}
                  >
                    {loading.bothUserOps ? '⏳ Signing Both Sequentially...' : '🚀 Send on BOTH Chains (Sequential Signing)'}
                  </button>
                  
                  <div className="button-group">
                    <button
                      className="btn btn-secondary"
                      onClick={handleSendSepoliaUserOp}
                      disabled={loading.sepoliaUserOp || !state.hasSmartAccounts}
                    >
                      {loading.sepoliaUserOp ? '⏳ Sending...' : '📤 Sepolia Only'}
                    </button>
                    
                    <button
                      className="btn btn-secondary"
                      onClick={handleSendBaseSepoliaUserOp}
                      disabled={loading.baseSepoliaUserOp || !state.hasSmartAccounts}
                    >
                      {loading.baseSepoliaUserOp ? '⏳ Sending...' : '📤 Base Sepolia Only'}
                    </button>
                  </div>
                  
                  <div className="privy-advantage">
                    <p><strong>✨ Privy Advantage:</strong> Unlike WebAuthn, Privy supports <em>parallel</em> user operation signing!</p>
                    <p><strong>📧 Note:</strong> This demo uses email authentication with MetaMask smart accounts.</p>
                    <p><strong>🦊 Architecture:</strong> Privy EOA owns and signs for smart accounts on both chains!</p>
                  </div>
                </div>

                <div className="action-step">
                  <button className="btn btn-danger" onClick={handleReset}>
                    🔄 Reset Demo
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Results Panel */}
          {userOpResults && (
            <div className="results-panel">
              <h3>🎉 User Operation Results</h3>
              <div className="results-grid">
                {userOpResults.sepolia && (
                  <div className="result-card">
                    <h4>🟡 Sepolia Results</h4>
                    <div className="result-item">
                      <strong>User Operation Hash:</strong>
                      <code>{userOpResults.sepolia}</code>
                    </div>
                    <div className="result-item">
                      <strong>Smart Account:</strong>
                      <code>{state.sepoliaSmartAccountAddress}</code>
                    </div>
                    <div className="result-item">
                      <strong>Explorer:</strong>
                      <a href={`https://sepolia.etherscan.io/tx/${userOpResults.sepolia}`} target="_blank" rel="noopener noreferrer">
                        View on Sepolia Etherscan
                      </a>
                    </div>
                  </div>
                )}
                
                {userOpResults.baseSepolia && (
                  <div className="result-card">
                    <h4>🔵 Base Sepolia Results</h4>
                    <div className="result-item">
                      <strong>User Operation Hash:</strong>
                      <code>{userOpResults.baseSepolia}</code>
                    </div>
                    <div className="result-item">
                      <strong>Smart Account:</strong>
                      <code>{state.baseSepoliaSmartAccountAddress}</code>
                    </div>
                    <div className="result-item">
                      <strong>Explorer:</strong>
                      <a href={`https://sepolia-explorer.base.org/tx/${userOpResults.baseSepolia}`} target="_blank" rel="noopener noreferrer">
                        View on Base Explorer
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Logs Panel */}
          <div className="logs-panel">
            <h3>📝 Activity Logs</h3>
            <div className="logs-container">
              {logs.length === 0 ? (
                <p className="no-logs">No activity yet. Start by logging in with Privy!</p>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className={`log-entry log-${log.type}`}>
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
  );
};

// Main component with Privy provider
const Demo26 = () => {
  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        appearance: {
          theme: 'dark',
          accentColor: '#6366F1',
        },
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
        loginMethods: ['email'],
      }}
    >
      <Demo26Inner />
    </PrivyProvider>
  );
};

export default Demo26;
