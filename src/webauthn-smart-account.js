import { 
  createPublicClient,
  createWalletClient,
  http,
  parseEther,
  zeroAddress,
  keccak256,
  getAddress
} from 'viem'
import { sepolia, baseSepolia } from 'viem/chains'
import { 
  createWebAuthnCredential, 
  toWebAuthnAccount,
  createBundlerClient
} from 'viem/account-abstraction'
import {
  Implementation,
  toMetaMaskSmartAccount,
} from "@metamask/delegation-toolkit"

// Configuration
const SEPOLIA_CHAIN = sepolia
const BASE_SEPOLIA_CHAIN = baseSepolia

const SEPOLIA_BUNDLER_URL = "https://rpc.zerodev.app/api/v3/e3896e1e-8cf7-4dd8-8fb7-1a95d19111ef/chain/11155111"
const BASE_SEPOLIA_BUNDLER_URL = "https://rpc.zerodev.app/api/v3/e3896e1e-8cf7-4dd8-8fb7-1a95d19111ef/chain/84532"

/**
 * WebAuthn Smart Account Manager
 * Handles the complete flow from WebAuthn credential creation to smart account operations
 */
export class WebAuthnSmartAccountManager {
  constructor() {
    this.credential = null
    this.owner = null
    
    // Sepolia clients
    this.sepoliaPublicClient = null
    this.sepoliaWalletClient = null
    this.sepoliaBundlerClient = null
    this.sepoliaSmartAccount = null
    
    // Base Sepolia clients
    this.baseSepoliaPublicClient = null
    this.baseSepoliaWalletClient = null
    this.baseSepoliaBundlerClient = null
    this.baseSepoliaSmartAccount = null
    
    this.setupClients()
  }

  /**
   * Step 1 & 2: Set up Viem clients
   */
  setupClients() {
    // Sepolia clients
    this.sepoliaPublicClient = createPublicClient({
      chain: SEPOLIA_CHAIN,
      transport: http(),
    })

    this.sepoliaBundlerClient = createBundlerClient({
      client: this.sepoliaPublicClient,
      transport: http(SEPOLIA_BUNDLER_URL),
    })

    // Base Sepolia clients
    this.baseSepoliaPublicClient = createPublicClient({
      chain: BASE_SEPOLIA_CHAIN,
      transport: http(),
    })

    this.baseSepoliaBundlerClient = createBundlerClient({
      client: this.baseSepoliaPublicClient,
      transport: http(BASE_SEPOLIA_BUNDLER_URL),
    })

    console.log('✅ Multi-chain clients set up successfully')
    console.log('- Sepolia chain ID:', SEPOLIA_CHAIN.id)
    console.log('- Base Sepolia chain ID:', BASE_SEPOLIA_CHAIN.id)
  }

  /**
   * Step 1A: Get existing WebAuthn credential (if available)
   */
  async getExistingWebAuthnCredential() {
    try {
      console.log('🔍 Attempting to get existing WebAuthn credential...')
      
      // Try to get existing credential
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: new Uint8Array(32), // Random challenge for authentication
          allowCredentials: [], // Empty array means any credential from this domain
          userVerification: 'preferred',
          timeout: 60000
        }
      })
      
      if (credential) {
        console.log('✅ Found existing WebAuthn credential:', {
          id: credential.id,
          type: credential.type
        })
        
        // Convert to the format we need
        this.credential = {
          id: credential.id,
          publicKey: credential.response.publicKey || credential.publicKey,
          type: credential.type
        }
        
        return this.credential
      } else {
        console.log('ℹ️ No existing credential found')
        return null
      }
    } catch (error) {
      console.log('ℹ️ No existing credential available:', error.message)
      return null
    }
  }

  /**
   * Step 1B: Create new WebAuthn credential (passkey)
   */
  async createWebAuthnCredential() {
    try {
      console.log('🔐 Creating new WebAuthn credential...')
      
      this.credential = await createWebAuthnCredential({
        name: 'WebAuthn Viem Smart Account Demo',
        id: `user-${Date.now()}`, // Unique user ID to avoid conflicts
        // Add explicit algorithm support to address the warning
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 },  // ES256
          { type: 'public-key', alg: -257 } // RS256
        ]
      })
      
      console.log('✅ WebAuthn credential created:', {
        id: this.credential.id,
        type: this.credential.type,
        publicKey: this.credential.publicKey,
        publicKeyType: typeof this.credential.publicKey
      })
      console.log('Full credential object keys:', Object.keys(this.credential))
      
      return this.credential
    } catch (error) {
      console.error('❌ Failed to create WebAuthn credential:', error)
      throw error
    }
  }

  /**
   * Step 1: Get existing credential or create new one
   */
  async getOrCreateWebAuthnCredential() {
    try {
      // For WebAuthn + Smart Accounts, we need the public key which is only
      // available during credential creation, not retrieval. So we'll create
      // a new credential each time. In production, you'd want to store the
      // public key securely and reuse it.
      console.log('🔐 Creating new WebAuthn credential (public key needed for smart account)...')
      return await this.createWebAuthnCredential()
    } catch (error) {
      console.error('❌ Failed to get or create WebAuthn credential:', error)
      throw error
    }
  }

  /**
   * Step 2: Create WebAuthn account from credential
   */
  async createWebAuthnAccount() {
    if (!this.credential) {
      throw new Error('No WebAuthn credential found. Create credential first.')
    }

    try {
      console.log('👤 Creating WebAuthn account...')
      
      this.owner = toWebAuthnAccount({
        credential: this.credential,
      })
      
      console.log('✅ WebAuthn account created:', this.owner)
      console.log('WebAuthn account keys:', Object.keys(this.owner))
      console.log('WebAuthn account address:', this.owner.address)
      console.log('WebAuthn account publicKey:', this.owner.publicKey)
      console.log('WebAuthn account type:', this.owner.type)
      
      return this.owner
    } catch (error) {
      console.error('❌ Failed to create WebAuthn account:', error)
      throw error
    }
  }

  /**
   * Step 3: Set up wallet clients for both chains
   */
  async setupWalletClients() {
    if (!this.owner) {
      throw new Error('No WebAuthn account found. Create account first.')
    }

    try {
      console.log('💼 Setting up wallet clients for both chains...')
      
      // Sepolia wallet client
      this.sepoliaWalletClient = createWalletClient({
        account: this.owner,
        chain: SEPOLIA_CHAIN,
        transport: http(),
      })
      
      // Base Sepolia wallet client
      this.baseSepoliaWalletClient = createWalletClient({
        account: this.owner,
        chain: BASE_SEPOLIA_CHAIN,
        transport: http(),
      })
      
      console.log('✅ Wallet clients set up successfully for both chains')
      
      return {
        sepolia: this.sepoliaWalletClient,
        baseSepolia: this.baseSepoliaWalletClient
      }
    } catch (error) {
      console.error('❌ Failed to set up wallet clients:', error)
      throw error
    }
  }

  /**
   * Step 4: Create MetaMask smart accounts for both chains
   */
  async createMetaMaskSmartAccounts() {
    if (!this.owner) {
      throw new Error('WebAuthn owner not created. Complete previous steps first.')
    }

    try {
      console.log('🦊 Creating MetaMask smart accounts for both chains...')
      
      // Create smart account with proper WebAuthn signatory configuration
      console.log('WebAuthn account publicKey:', this.owner.publicKey)
      console.log('WebAuthn account id:', this.owner.id)
      
      // Validate that publicKey exists
      if (!this.owner.publicKey) {
        throw new Error('WebAuthn account publicKey is undefined. Check credential creation.')
      }
      
      // Extract X and Y coordinates from the WebAuthn public key
      // WebAuthn public keys are 64 bytes: 32 bytes X + 32 bytes Y (no 0x04 prefix)
      const publicKeyHex = this.owner.publicKey.slice(2) // Remove 0x prefix
      console.log('Public key hex length:', publicKeyHex.length)
      console.log('Public key hex:', publicKeyHex)
      
      // For WebAuthn P-256 keys, first 32 bytes are X, next 32 bytes are Y
      const x = BigInt('0x' + publicKeyHex.slice(0, 64)) // First 32 bytes (64 hex chars)
      const y = BigInt('0x' + publicKeyHex.slice(64, 128)) // Next 32 bytes (64 hex chars)
      
      console.log('Extracted X coordinate:', x.toString(16))
      console.log('Extracted Y coordinate:', y.toString(16))
      
      // Derive Ethereum address from public key
      // For Ethereum, we hash the public key (without 0x04 prefix) and take last 20 bytes
      const addressHash = keccak256(`0x${publicKeyHex}`)
      const derivedAddress = getAddress(`0x${addressHash.slice(-40)}`) // Last 20 bytes (40 hex chars)
      
      console.log('Derived Ethereum address:', derivedAddress)
      
      const smartAccountParams = {
        implementation: Implementation.Hybrid,
        deployParams: [
          derivedAddress, // owner (address) - derived Ethereum address
          [this.owner.id], // keyIds (string[]) - WebAuthn credential ID
          [x], // xValues (bigint[]) - X coordinate of public key
          [y]  // yValues (bigint[]) - Y coordinate of public key
        ],
        deploySalt: '0x',
        signatory: { 
          webAuthnAccount: this.owner,
          keyId: this.owner.id
        },
      }
      
      // Create Sepolia smart account
      console.log('Creating Sepolia smart account...')
      this.sepoliaSmartAccount = await toMetaMaskSmartAccount({
        client: this.sepoliaPublicClient,
        ...smartAccountParams
      })
      
      console.log('✅ Sepolia smart account created:', {
        address: this.sepoliaSmartAccount.address,
        chain: 'Sepolia'
      })
      
      // Create Base Sepolia smart account
      console.log('Creating Base Sepolia smart account...')
      this.baseSepoliaSmartAccount = await toMetaMaskSmartAccount({
        client: this.baseSepoliaPublicClient,
        ...smartAccountParams
      })
      
      console.log('✅ Base Sepolia smart account created:', {
        address: this.baseSepoliaSmartAccount.address,
        chain: 'Base Sepolia'
      })
      
      console.log('🎯 Smart account addresses comparison:')
      console.log('- Sepolia:      ', this.sepoliaSmartAccount.address)
      console.log('- Base Sepolia: ', this.baseSepoliaSmartAccount.address)
      console.log('- Same address? ', this.sepoliaSmartAccount.address === this.baseSepoliaSmartAccount.address)
      
      return {
        sepolia: this.sepoliaSmartAccount,
        baseSepolia: this.baseSepoliaSmartAccount
      }
    } catch (error) {
      console.error('❌ Failed to create MetaMask smart accounts:', error)
      throw error
    }
  }

  /**
   * Step 5A: Send user operation on Sepolia
   */
  async sendSepoliaUserOperation(to, value = "0.001") {
    if (!this.sepoliaSmartAccount || !this.sepoliaBundlerClient) {
      throw new Error('Sepolia smart account not created. Complete previous steps first.')
    }

    try {
      console.log('🚀 Sending Sepolia user operation...')
      console.log('Sepolia smart account:', this.sepoliaSmartAccount.address)
      
      // Check if Buffer is available
      console.log('Buffer available:', typeof Buffer !== 'undefined')
      console.log('global.Buffer available:', typeof global?.Buffer !== 'undefined')
      console.log('window.Buffer available:', typeof window?.Buffer !== 'undefined')
      
      // Note: These gas values should be determined based on the specific bundler
      const maxFeePerGas = 20000000000n // 20 gwei
      const maxPriorityFeePerGas = 1000000000n // 1 gwei
      
      const userOperationHash = await this.sepoliaBundlerClient.sendUserOperation({
        account: this.sepoliaSmartAccount,
        calls: [
          {
            to: to || "0x1234567890123456789012345678901234567890",
            value: parseEther(value)
          }
        ],
        maxFeePerGas,
        maxPriorityFeePerGas
      })
      
      console.log('✅ Sepolia user operation sent:', userOperationHash)
      
      return userOperationHash
    } catch (error) {
      console.error('❌ Failed to send Sepolia user operation:', error)
      throw error
    }
  }

  /**
   * Step 5B: Send user operation on Base Sepolia
   */
  async sendBaseSepoliaUserOperation(to, value = "0.001") {
    if (!this.baseSepoliaSmartAccount || !this.baseSepoliaBundlerClient) {
      throw new Error('Base Sepolia smart account not created. Complete previous steps first.')
    }

    try {
      console.log('🚀 Sending Base Sepolia user operation...')
      console.log('Base Sepolia smart account:', this.baseSepoliaSmartAccount.address)
      
      // Note: These gas values should be determined based on the specific bundler
      const maxFeePerGas = 20000000000n // 20 gwei
      const maxPriorityFeePerGas = 1000000000n // 1 gwei
      
      const userOperationHash = await this.baseSepoliaBundlerClient.sendUserOperation({
        account: this.baseSepoliaSmartAccount,
        calls: [
          {
            to: to || "0x1234567890123456789012345678901234567890",
            value: parseEther(value)
          }
        ],
        maxFeePerGas,
        maxPriorityFeePerGas
      })
      
      console.log('✅ Base Sepolia user operation sent:', userOperationHash)
      
      return userOperationHash
    } catch (error) {
      console.error('❌ Failed to send Base Sepolia user operation:', error)
      throw error
    }
  }

  /**
   * Step 5C: Send user operations on both chains sequentially (WebAuthn limitation)
   * Note: WebAuthn doesn't support concurrent credential requests, so we sign sequentially
   */
  async sendBothUserOperations(to, value = "0.001") {
    if (!this.sepoliaSmartAccount || !this.baseSepoliaSmartAccount || 
        !this.sepoliaBundlerClient || !this.baseSepoliaBundlerClient) {
      throw new Error('Both smart accounts not created. Complete previous steps first.')
    }

    try {
      console.log('🚀🚀 Sending user operations on BOTH chains sequentially...')
      console.log('Using same WebAuthn credential for both transactions')
      console.log('⚠️ Note: WebAuthn requires sequential signing (concurrent requests not supported)')
      
      // Check if Buffer is available
      console.log('Buffer available:', typeof Buffer !== 'undefined')
      
      // Note: These gas values should be determined based on the specific bundler
      const maxFeePerGas = 20000000000n // 20 gwei
      const maxPriorityFeePerGas = 1000000000n // 1 gwei
      
      const calls = [
        {
          to: to || "0x1234567890123456789012345678901234567890",
          value: parseEther(value)
        }
      ]
      
      // Execute user operations sequentially (WebAuthn doesn't support concurrent requests)
      console.log('⏳ Executing sequential user operations (WebAuthn limitation)...')
      console.log('📝 Signing first transaction on Sepolia...')
      const sepoliaResult = await this.sepoliaBundlerClient.sendUserOperation({
        account: this.sepoliaSmartAccount,
        calls,
        maxFeePerGas,
        maxPriorityFeePerGas
      })
      
      console.log('✅ Sepolia transaction signed, now signing Base Sepolia...')
      const baseSepoliaResult = await this.baseSepoliaBundlerClient.sendUserOperation({
        account: this.baseSepoliaSmartAccount,
        calls,
        maxFeePerGas,
        maxPriorityFeePerGas
      })
      
      console.log('✅ Both user operations sent successfully!')
      console.log('- Sepolia hash:      ', sepoliaResult)
      console.log('- Base Sepolia hash: ', baseSepoliaResult)
      
      return {
        sepolia: sepoliaResult,
        baseSepolia: baseSepoliaResult
      }
    } catch (error) {
      console.error('❌ Failed to send simultaneous user operations:', error)
      throw error
    }
  }

  /**
   * Complete flow: Execute all steps in sequence for both chains
   */
  async executeCompleteFlow() {
    try {
      console.log('🚀 Starting complete WebAuthn Multi-Chain Smart Account flow...')
      
      // Step 1: Get existing or create WebAuthn credential
      await this.getOrCreateWebAuthnCredential()
      
      // Step 2: Create WebAuthn account
      await this.createWebAuthnAccount()
      
      // Step 3: Set up wallet clients for both chains
      await this.setupWalletClients()
      
      // Step 4: Create MetaMask smart accounts for both chains
      await this.createMetaMaskSmartAccounts()
      
      console.log('🎉 Complete multi-chain flow executed successfully!')
      
      return {
        credential: this.credential,
        owner: this.owner,
        sepoliaSmartAccount: this.sepoliaSmartAccount,
        baseSepoliaSmartAccount: this.baseSepoliaSmartAccount
      }
    } catch (error) {
      console.error('❌ Complete flow failed:', error)
      throw error
    }
  }

  /**
   * Get current state
   */
  getState() {
    return {
      hasCredential: !!this.credential,
      hasOwner: !!this.owner,
      hasWalletClients: !!(this.sepoliaWalletClient && this.baseSepoliaWalletClient),
      hasSmartAccounts: !!(this.sepoliaSmartAccount && this.baseSepoliaSmartAccount),
      ownerAddress: this.owner?.address,
      sepoliaSmartAccountAddress: this.sepoliaSmartAccount?.address,
      baseSepoliaSmartAccountAddress: this.baseSepoliaSmartAccount?.address,
      addressesMatch: this.sepoliaSmartAccount?.address === this.baseSepoliaSmartAccount?.address
    }
  }

  /**
   * Reset all state
   */
  reset() {
    this.credential = null
    this.owner = null
    
    // Reset Sepolia clients
    this.sepoliaWalletClient = null
    this.sepoliaSmartAccount = null
    
    // Reset Base Sepolia clients
    this.baseSepoliaWalletClient = null
    this.baseSepoliaSmartAccount = null
    
    console.log('🔄 Multi-chain state reset')
  }
}

// Export singleton instance
export const webauthnManager = new WebAuthnSmartAccountManager()
