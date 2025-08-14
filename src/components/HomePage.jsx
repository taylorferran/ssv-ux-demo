import React from 'react'
import { Link } from 'react-router-dom'
import './HomePage.css'

const HomePage = () => {
  const demos = [
    {
      id: '1a',
      title: 'Demo 1a',
      description: 'EIP-5792 Multi-Chain sendCalls with Native Wallet Batching',
      path: '/demo-1a',
      status: 'active'
    },
    {
      id: '2a',
      title: 'Demo 2a',
      description: 'MetaMask + Cross-Chain Smart Account User Operations',
      path: '/demo-2a',
      status: 'active'
    },
    {
      id: '2b',
      title: 'Demo 2b',
      description: 'MetaMask + Batched Transactions in Single User Operation',
      path: '/demo-2b',
      status: 'active'
    },
    {
      id: '2.1',
      title: 'Demo 2.1',
      description: 'WebAuthn + Multi-Chain MetaMask Smart Account',
      path: '/demo-2-5',
      status: 'active'
    },
    {
      id: '2.2',
      title: 'Demo 2.2',
      description: 'Privy Email Auth + Multi-Chain MetaMask Smart Accounts',
      path: '/demo-2-6',
      status: 'active'
    },
    {
      id: '3',
      title: 'Demo 3',
      description: 'EIP-7702 Account Delegation + sendUserOperation',
      path: '/demo-3',
      status: 'active'
    }
  ]

  return (
    <div className="homepage">
      <div className="homepage-container">
        <header className="homepage-header">
          <h1 className="homepage-title">SSV Rollup UX Demos</h1>
        </header>

        <div className="demos-grid">
          {demos.map((demo) => (
            <div key={demo.id} className={`demo-card ${demo.status}`}>
              <div className="demo-card-header">
                <span className="demo-id">{demo.id}</span>
                {demo.status === 'coming-soon' && (
                  <span className="status-badge"></span>
                )}
              </div>
              <h3 className="demo-title">{demo.title}</h3>
              <p className="demo-description">{demo.description}</p>
              
              {demo.status === 'active' ? (
                <Link to={demo.path} className="demo-button">
                  Launch Demo
                </Link>
              ) : (
                <button className="demo-button disabled" disabled>
                  
                </button>
              )}
            </div>
          ))}
        </div>

        <footer className="homepage-footer">
          <p>Built with React, Viem, WebAuthn, Privy, EIP-7702, and MetaMask Delegation Toolkit</p>
        </footer>
      </div>
    </div>
  )
}

export default HomePage
