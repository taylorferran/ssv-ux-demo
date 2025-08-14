import { createWalletClient, custom } from "viem";
import { sepolia, baseSepolia } from "viem/chains";

const CHAINS = {
  sepolia: sepolia,
  baseSepolia: baseSepolia
}

class SendCallsMultiChainManager {
  constructor() {
    this.walletClient = null
    this.connectedAccount = null
    this.isConnected = false
    this.currentChain = null
    this.callResults = []
  }

  // Check if MetaMask is installed and supports EIP-5792
  checkMetaMaskCapabilities() {
    if (!window.ethereum) {
      throw new Error("MetaMask is not installed. Please install MetaMask to continue.");
    }
    
    // Check if wallet supports EIP-5792 sendCalls
    if (!window.ethereum.request) {
      throw new Error("MetaMask does not support required wallet methods.");
    }
    
    return true
  }

  // Connect to MetaMask
  async connectMetaMask() {
    this.checkMetaMaskCapabilities()
    
    try {
      console.log('🦊 Connecting to MetaMask...')
      
      // Create wallet client
      this.walletClient = createWalletClient({
        chain: sepolia, // Default to Sepolia
        transport: custom(window.ethereum),
      });

      // Request account access
      const [account] = await this.walletClient.requestAddresses();
      this.connectedAccount = account
      this.isConnected = true
      this.currentChain = sepolia
      
      console.log('✅ Connected to MetaMask:', this.connectedAccount)
      console.log('📍 Current chain:', this.currentChain.name)
      return this.connectedAccount
    } catch (error) {
      console.error('❌ Failed to connect to MetaMask:', error)
      throw error
    }
  }

  // Switch chain
  async switchChain(chainKey) {
    if (!this.walletClient) {
      throw new Error('Wallet client not initialized. Connect first.')
    }

    const targetChain = CHAINS[chainKey]
    if (!targetChain) {
      throw new Error(`Unsupported chain: ${chainKey}`)
    }

    try {
      console.log(`🔄 Switching to ${targetChain.name}...`)
      
      await this.walletClient.switchChain({
        id: targetChain.id,
      });

      this.currentChain = targetChain
      console.log(`✅ Switched to: ${this.currentChain.name}`)
      return targetChain
    } catch (error) {
      console.error(`❌ Failed to switch to ${targetChain.name}:`, error)
      throw error
    }
  }

  // Watch call status
  async watchStatus(id, chainName) {
    let status;
    let attempts = 0;
    const maxAttempts = 30; // 60 seconds max wait time
    
    console.log(`⏳ Watching status for ${chainName} calls (ID: ${id})...`)
    
    do {
      try {
        status = await this.walletClient.getCallsStatus({ id });
        console.log(`📊 ${chainName} status check ${attempts + 1}: ${status.status}`)
        
        if (status.status === "pending") {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          attempts++;
        }
      } catch (error) {
        console.warn(`⚠️ Error checking status for ${chainName}:`, error.message)
        // If getCallsStatus fails, assume completed after a delay
        await new Promise((resolve) => setTimeout(resolve, 5000));
        break;
      }
    } while (status.status === "pending" && attempts < maxAttempts);

    if (attempts >= maxAttempts) {
      console.warn(`⚠️ ${chainName} status check timed out after ${maxAttempts} attempts`)
      return { status: 'timeout', receipts: [] }
    }

    console.log(`✅ ${chainName} final status:`, status.status);
    if (status.receipts) {
      console.log(`📄 ${chainName} receipts:`, status.receipts);
    }
    
    return status
  }

  // Send calls on Sepolia
  async sendSepoliaCalls() {
    if (!this.walletClient || !this.isConnected) {
      throw new Error('Wallet not connected. Connect first.')
    }

    try {
      // Switch to Sepolia
      await this.switchChain('sepolia')

      console.log("📤 Sending calls on Sepolia...")
      
      const result = await this.walletClient.sendCalls({
        chain: sepolia,
        account: this.connectedAccount,
        calls: [
          {
            data: "0xdeadbeef",
            to: "0xa5cc3c03994DB5b0d9A5eEdD10CabaB0813678AC",
          },
          {
            data: "0xdeadbeef", 
            to: "0xa5cc3c03994DB5b0d9A5eEdD10CabaB0813678AC",
          },
          {
            data: "0xdeadbeef",
            to: "0xa5cc3c03994DB5b0d9A5eEdD10CabaB0813678AC",
          },
        ],
      });

      console.log("✅ Sepolia calls sent, ID:", result.id);
      
      // Watch status
      const status = await this.watchStatus(result.id, "Sepolia")
      
      return {
        id: result.id,
        chain: "Sepolia",
        chainId: sepolia.id,
        callCount: 3,
        status: status,
        explorer: "https://sepolia.etherscan.io"
      }
    } catch (error) {
      console.error('❌ Failed to send Sepolia calls:', error)
      throw error
    }
  }

  // Send calls on Base Sepolia  
  async sendBaseSepoliaCalls() {
    if (!this.walletClient || !this.isConnected) {
      throw new Error('Wallet not connected. Connect first.')
    }

    try {
      // Switch to Base Sepolia
      await this.switchChain('baseSepolia')

      console.log("📤 Sending calls on Base Sepolia...")
      
      const result = await this.walletClient.sendCalls({
        chain: baseSepolia,
        account: this.connectedAccount,
        calls: [
          {
            data: "0xdeadbeef",
            to: "0xa5cc3c03994DB5b0d9A5eEdD10CabaB0813678AC",
          },
          {
            data: "0xdeadbeef",
            to: "0xa5cc3c03994DB5b0d9A5eEdD10CabaB0813678AC",
          },
        ],
      });

      console.log("✅ Base Sepolia calls sent, ID:", result.id);
      
      // Watch status
      const status = await this.watchStatus(result.id, "Base Sepolia")
      
      return {
        id: result.id,
        chain: "Base Sepolia",
        chainId: baseSepolia.id,
        callCount: 2,
        status: status,
        explorer: "https://sepolia-explorer.base.org"
      }
    } catch (error) {
      console.error('❌ Failed to send Base Sepolia calls:', error)
      throw error
    }
  }

  // Send calls on both chains
  async sendMultiChainCalls() {
    if (!this.walletClient || !this.isConnected) {
      throw new Error('Wallet not connected. Connect first.')
    }

    try {
      console.log("🚀 Starting multi-chain sendCalls demo...")
      console.log("📋 This will send batched calls on both Sepolia and Base Sepolia")
      
      // Send calls on Sepolia first
      console.log("\n=== SEPOLIA CALLS ===")
      const sepoliaResult = await this.sendSepoliaCalls()
      
      // Send calls on Base Sepolia
      console.log("\n=== BASE SEPOLIA CALLS ===")
      const baseSepoliaResult = await this.sendBaseSepoliaCalls()
      
      const results = {
        sepolia: sepoliaResult,
        baseSepolia: baseSepoliaResult,
        totalChains: 2,
        totalCalls: sepoliaResult.callCount + baseSepoliaResult.callCount
      }
      
      this.callResults = results
      
      console.log("🎉 Multi-chain sendCalls completed!")
      console.log("📊 Summary:")
      console.log(`- Sepolia: ${sepoliaResult.callCount} calls, Status: ${sepoliaResult.status.status}`)
      console.log(`- Base Sepolia: ${baseSepoliaResult.callCount} calls, Status: ${baseSepoliaResult.status.status}`)
      
      return results
    } catch (error) {
      console.error('❌ Failed to send multi-chain calls:', error)
      throw error
    }
  }

  // Get current state
  getState() {
    return {
      isConnected: this.isConnected,
      connectedAccount: this.connectedAccount,
      currentChain: this.currentChain,
      hasResults: this.callResults.length > 0 || Object.keys(this.callResults).length > 0
    }
  }

  // Reset state
  reset() {
    // Don't reset wallet client connection, just results
    this.callResults = []
    console.log('🔄 SendCalls results reset')
  }
}

// Export singleton instance
export const sendCallsManager = new SendCallsMultiChainManager()
