import { 
  createPublicClient,
  createWalletClient,
  http,
  parseEther,
  zeroAddress,
  keccak256,
  getAddress,
  custom
} from 'viem'
import { sepolia, baseSepolia } from 'viem/chains'
import { 
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
 * Privy Smart Account Manager
 * Handles the complete flow from Privy social login to smart account operations
 */
export class PrivySmartAccountManager {
  constructor() {
    this.privyUser = null
    this.privyWallet = null
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
   * Step 1: Set Privy user and wallet (called after Privy login)
   */
  async setPrivyWallet(user, wallet) {
    try {
      console.log('🔐 Setting Privy wallet...')
      
      this.privyUser = user
      this.privyWallet = wallet
      
      // Get the Ethereum provider from Privy wallet
      const provider = await wallet.getEthereumProvider()
      
      // Try to create a proper viem account using the provider
      try {
        // Method 1: Try to create wallet client and extract account
        const tempWalletClient = createWalletClient({
          transport: custom(provider)
        })
        
        // Get account info from provider
        const accounts = await provider.request({ method: 'eth_accounts' })
        const address = accounts[0] || wallet.address
        
        console.log('🔍 Provider accounts:', accounts)
        console.log('🔍 Using address:', address)
        
        // Create a simple account object that should work with MetaMask smart accounts
        this.owner = {
          address: address,
          type: 'json-rpc',
          source: 'privateKey', // Add source property that viem expects
          signMessage: async ({ message }) => {
            const messageToSign = typeof message === 'string' ? message : message.raw
            return await provider.request({
              method: 'personal_sign',
              params: [messageToSign, address]
            })
          },
          signTransaction: async (transaction) => {
            return await provider.request({
              method: 'eth_signTransaction',
              params: [transaction]
            })
          },
          signTypedData: async (typedData) => {
            // Convert BigInt values to strings for JSON serialization
            const serializeTypedData = (obj) => {
              if (typeof obj === 'bigint') {
                return obj.toString()
              }
              if (Array.isArray(obj)) {
                return obj.map(serializeTypedData)
              }
              if (obj && typeof obj === 'object') {
                const serialized = {}
                for (const [key, value] of Object.entries(obj)) {
                  serialized[key] = serializeTypedData(value)
                }
                return serialized
              }
              return obj
            }
            
            const serializedTypedData = serializeTypedData(typedData)
            return await provider.request({
              method: 'eth_signTypedData_v4',
              params: [address, JSON.stringify(serializedTypedData)]
            })
          }
        }
        
      } catch (providerError) {
        console.warn('⚠️ Provider method failed, using fallback:', providerError)
        
        // Fallback: Create minimal account object
        this.owner = {
          address: wallet.address,
          type: 'json-rpc',
          source: 'privateKey'
        }
      }
      
      console.log('✅ Privy wallet set:', {
        userDID: user?.id,
        walletAddress: wallet?.address,
        walletType: wallet?.walletClientType,
        ownerAddress: this.owner.address,
        ownerType: this.owner.type,
        ownerSource: this.owner.source
      })
      
      console.log('Full wallet object keys:', Object.keys(wallet))
      console.log('Wallet methods available:', wallet.getEthereumProvider ? 'getEthereumProvider ✅' : 'getEthereumProvider ❌')
      console.log('Owner object keys:', Object.keys(this.owner))
      
      return this.owner
    } catch (error) {
      console.error('❌ Failed to set Privy wallet:', error)
      throw error
    }
  }

  /**
   * Step 3: Set up wallet clients for both chains
   */
  async setupWalletClients() {
    if (!this.privyWallet || !this.owner) {
      throw new Error('No Privy wallet found. Login with Privy first.')
    }

    try {
      console.log('💼 Setting up wallet clients for both chains...')
      
      // Get the Ethereum provider from Privy wallet
      const provider = await this.privyWallet.getEthereumProvider()
      
      // Sepolia wallet client using Privy provider
      this.sepoliaWalletClient = createWalletClient({
        account: this.owner,
        chain: SEPOLIA_CHAIN,
        transport: custom(provider),
      })
      
      // Base Sepolia wallet client using Privy provider
      this.baseSepoliaWalletClient = createWalletClient({
        account: this.owner,
        chain: BASE_SEPOLIA_CHAIN,
        transport: custom(provider),
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
   * Step 4: Create MetaMask smart accounts using Privy EOA as owner
   */
  async createMetaMaskSmartAccounts() {
    if (!this.owner) {
      throw new Error('Privy wallet not set. Complete login first.')
    }

    try {
      console.log('🦊 Creating MetaMask smart accounts with Privy EOA as owner...')
      console.log('📝 Note: Privy EOA will be the owner/signatory of the smart accounts')
      console.log('🔍 This creates deterministic smart account addresses across chains')
      
      // Use Privy EOA address as the owner
      const ownerAddress = this.owner.address
      console.log('Privy EOA (owner) address:', ownerAddress)
      
      const smartAccountParams = {
        implementation: Implementation.Hybrid,
        deployParams: [
          ownerAddress, // owner (address) - Privy EOA address
          [], // keyIds (string[]) - empty for non-WebAuthn
          [], // xValues (bigint[]) - empty for non-WebAuthn
          []  // yValues (bigint[]) - empty for non-WebAuthn
        ],
        deploySalt: '0x',
        signatory: { 
          account: this.owner // Wrap the Privy EOA in account property
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
        owner: ownerAddress,
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
        owner: ownerAddress,
        chain: 'Base Sepolia'
      })
      
      console.log('🎯 Smart account addresses comparison:')
      console.log('- Privy EOA (Owner):  ', ownerAddress)
      console.log('- Sepolia Smart Acc:  ', this.sepoliaSmartAccount.address)
      console.log('- Base Sepolia Smart: ', this.baseSepoliaSmartAccount.address)
      console.log('- Same smart address? ', this.sepoliaSmartAccount.address === this.baseSepoliaSmartAccount.address)
      
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
      console.log('Smart account address:', this.sepoliaSmartAccount.address)
      console.log('Owner (Privy EOA):', this.owner.address)
      
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
      console.log('Smart account address:', this.baseSepoliaSmartAccount.address)
      console.log('Owner (Privy EOA):', this.owner.address)
      
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
   * Step 5C: Send user operations on both chains 
   * Note: Unlike WebAuthn, Privy doesn't have concurrent request limitations
   */
  async sendBothUserOperations(to, value = "0.001") {
    if (!this.sepoliaSmartAccount || !this.baseSepoliaSmartAccount || 
        !this.sepoliaBundlerClient || !this.baseSepoliaBundlerClient) {
      throw new Error('Smart accounts not created. Complete previous steps first.')
    }

    try {
      console.log('🚀🚀 Sending user operations on BOTH chains...')
      console.log('Using Privy EOA-owned smart accounts for both user operations')
      console.log('✨ Note: Privy supports concurrent user operations (unlike WebAuthn)')
      
      // Note: These gas values should be determined based on the specific bundler
      const maxFeePerGas = 20000000000n // 20 gwei
      const maxPriorityFeePerGas = 1000000000n // 1 gwei
      
      const calls = [
        {
          to: to || "0x1234567890123456789012345678901234567890",
          value: parseEther(value)
        }
      ]
      
      // Execute user operations in parallel (Privy supports concurrent requests)
      console.log('⏳ Executing parallel user operations...')
      const [sepoliaResult, baseSepoliaResult] = await Promise.all([
        this.sepoliaBundlerClient.sendUserOperation({
          account: this.sepoliaSmartAccount,
          calls,
          maxFeePerGas,
          maxPriorityFeePerGas
        }),
        this.baseSepoliaBundlerClient.sendUserOperation({
          account: this.baseSepoliaSmartAccount,
          calls,
          maxFeePerGas,
          maxPriorityFeePerGas
        })
      ])
      
      console.log('✅ Both user operations sent successfully!')
      console.log('- Sepolia hash:      ', sepoliaResult)
      console.log('- Base Sepolia hash: ', baseSepoliaResult)
      
      return {
        sepolia: sepoliaResult,
        baseSepolia: baseSepoliaResult
      }
    } catch (error) {
      console.error('❌ Failed to send parallel user operations:', error)
      throw error
    }
  }

  /**
   * Complete flow: Execute all steps in sequence for both chains
   */
  async executeCompleteFlow(user, wallet) {
    try {
      console.log('🚀 Starting complete Privy Multi-Chain Smart Account flow...')
      
      // Step 1: Set Privy wallet
      await this.setPrivyWallet(user, wallet)
      
      // Step 2: Set up wallet clients for both chains
      await this.setupWalletClients()
      
      // Step 3: Create MetaMask smart accounts for both chains
      await this.createMetaMaskSmartAccounts()
      
      console.log('🎉 Complete multi-chain flow executed successfully!')
      
      return {
        privyUser: this.privyUser,
        privyWallet: this.privyWallet,
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
      hasPrivyUser: !!this.privyUser,
      hasPrivyWallet: !!this.privyWallet,
      hasOwner: !!this.owner,
      hasWalletClients: !!(this.sepoliaWalletClient && this.baseSepoliaWalletClient),
      hasSmartAccounts: !!(this.sepoliaSmartAccount && this.baseSepoliaSmartAccount),
      ownerAddress: this.owner?.address,
      sepoliaSmartAccountAddress: this.sepoliaSmartAccount?.address,
      baseSepoliaSmartAccountAddress: this.baseSepoliaSmartAccount?.address,
      addressesMatch: this.sepoliaSmartAccount?.address === this.baseSepoliaSmartAccount?.address,
      privyUserDID: this.privyUser?.id,
      privyUserEmail: this.privyUser?.email?.address
    }
  }

  /**
   * Reset all state
   */
  reset() {
    this.privyUser = null
    this.privyWallet = null
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
export const privyManager = new PrivySmartAccountManager()
