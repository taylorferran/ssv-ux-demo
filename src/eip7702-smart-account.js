import { 
  createPublicClient,
  createWalletClient,
  http,
  parseEther,
  zeroAddress
} from 'viem'
import { sepolia } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'
import { 
  createBundlerClient
} from 'viem/account-abstraction'
import {
  Implementation,
  toMetaMaskSmartAccount,
  getDeleGatorEnvironment
} from "@metamask/delegation-toolkit"

// Configuration
const SEPOLIA_CHAIN = sepolia

// Bundler URL
const SEPOLIA_BUNDLER_URL = 'https://rpc.zerodev.app/api/v3/e3896e1e-8cf7-4dd8-8fb7-1a95d19111ef/chain/11155111'

class EIP7702SmartAccountManager {
  constructor() {
    this.reset()
  }

  reset() {
    this.publicClient = null
    this.walletClient = null
    this.bundlerClient = null
    this.privateKey = null
    this.account = null
    this.authorization = null
    this.smartAccount = null
    
    console.log('🔄 EIP-7702 manager state reset')
  }

  /**
   * Step 1: Create test account for demo
   */
  async generateRandomAccount() {
    try {
      console.log('🎲 Creating test account for demo...')
      
      // Use a fixed test private key for demo consistency
      // throwaway account for testing
      this.privateKey = "0x4f26ddca912a24349ad8f581ad08d4ec66e03d0d601793dcf27e5bf7eb437456"
      
      // Create account from private key
      this.account = privateKeyToAccount(this.privateKey)
      
      console.log('✅ Test account created:', this.account.address)
      console.log('🔑 Private key:', this.privateKey)
      
      return {
        address: this.account.address,
        privateKey: this.privateKey
      }
    } catch (error) {
      console.error('❌ Failed to create test account:', error)
      throw error
    }
  }

  /**
   * Step 2: Set up clients (Public, Wallet, Bundler)
   */
  async setupClients() {
    if (!this.account || !this.privateKey) {
      throw new Error('No account generated. Generate random account first.')
    }

    try {
      console.log('⚙️ Setting up clients...')

      // Step 1: Set up Public Client
      this.publicClient = createPublicClient({
        chain: SEPOLIA_CHAIN,
        transport: http(),
      })

      // Step 2: Set up Bundler Client
      this.bundlerClient = createBundlerClient({
        client: this.publicClient,
        transport: http(SEPOLIA_BUNDLER_URL),
      })

      // Step 3: Set up Wallet Client (using generated private key account)
      this.walletClient = createWalletClient({
        account: this.account,
        chain: SEPOLIA_CHAIN,
        transport: http(),
      })

      console.log('✅ All clients set up successfully')
      return {
        publicClient: this.publicClient,
        walletClient: this.walletClient,
        bundlerClient: this.bundlerClient
      }
    } catch (error) {
      console.error('❌ Failed to set up clients:', error)
      throw error
    }
  }

  /**
   * Step 3: Authorize EIP-7702 delegation
   */
  async authorizeEIP7702Delegation() {
    if (!this.walletClient || !this.account) {
      throw new Error('Clients not set up. Set up clients first.')
    }

    try {
      console.log('📝 Authorizing EIP-7702 delegation...')

      // Get the DeleGator environment for Sepolia
      const environment = getDeleGatorEnvironment(SEPOLIA_CHAIN.id)
      const contractAddress = environment.implementations.EIP7702StatelessDeleGatorImpl

      console.log('🏗️ Using contract address:', contractAddress)

      // Step 4: Sign authorization
      this.authorization = await this.walletClient.signAuthorization({
        account: this.account,
        contractAddress,
        executor: "self",
      })

      console.log('✅ EIP-7702 authorization signed:', this.authorization)
      return this.authorization
    } catch (error) {
      console.error('❌ Failed to authorize EIP-7702 delegation:', error)
      throw error
    }
  }

  /**
   * Step 4: Submit the authorization transaction
   */
  async submitAuthorization() {
    if (!this.authorization || !this.walletClient) {
      throw new Error('No authorization found. Authorize EIP-7702 delegation first.')
    }

    try {
      console.log('📤 Submitting EIP-7702 authorization transaction...')

      // Step 5: Send transaction with authorization
      const hash = await this.walletClient.sendTransaction({
        authorizationList: [this.authorization],
        data: "0x",
        to: zeroAddress,
      })

      console.log('✅ Authorization transaction submitted:', hash)
      
      // Wait for transaction confirmation
      console.log('⏳ Waiting for transaction confirmation...')
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash })
      console.log('✅ Authorization transaction confirmed:', receipt.transactionHash)
      
      return { hash, receipt }
    } catch (error) {
      console.error('❌ Failed to submit authorization:', error)
      throw error
    }
  }

  /**
   * Step 5: Create MetaMask smart account
   */
  async createMetaMaskSmartAccount() {
    if (!this.publicClient || !this.walletClient || !this.account) {
      throw new Error('Authorization not submitted. Submit authorization first.')
    }

    try {
      console.log('🦊 Creating MetaMask smart account...')

      // Create smart account for Sepolia
      this.smartAccount = await toMetaMaskSmartAccount({
        client: this.publicClient,
        implementation: Implementation.Stateless7702,
        address: this.account.address,
        deployParams: [
          this.account.address, // owner (address) - EOA address
          [], // keyIds (string[]) - empty for EIP-7702
          [], // xValues (bigint[]) - empty for EIP-7702
          []  // yValues (bigint[]) - empty for EIP-7702
        ],
        deploySalt: '0x',
        signatory: { walletClient: this.walletClient },
      })

      console.log('✅ Sepolia smart account created:', this.smartAccount.address)

      return {
        smartAccount: this.smartAccount
      }
    } catch (error) {
      console.error('❌ Failed to create MetaMask smart account:', error)
      throw error
    }
  }

  /**
   * Get current gas prices from bundler
   */
  async getGasPrices() {
    try {
      console.log('⛽ Fetching current gas prices from bundler...')
      
      const sepoliaGasPrices = await this.bundlerClient.request({
        method: 'pimlico_getUserOperationGasPrice',
        params: []
      }).catch(error => {
        console.warn('⚠️ Failed to fetch Sepolia gas prices:', error.message)
        return null
      })
      
      console.log('💰 Sepolia gas prices:', sepoliaGasPrices)
      
      return sepoliaGasPrices ? {
        maxFeePerGas: BigInt(sepoliaGasPrices.fast.maxFeePerGas),
        maxPriorityFeePerGas: BigInt(sepoliaGasPrices.fast.maxPriorityFeePerGas)
      } : {
        maxFeePerGas: parseEther("0.00001"), // 10 gwei fallback
        maxPriorityFeePerGas: parseEther("0.000001") // 1 gwei fallback
      }
    } catch (error) {
      console.error('❌ Failed to get gas prices:', error)
      // Return fallback gas prices
      return {
        maxFeePerGas: parseEther("0.00001"),
        maxPriorityFeePerGas: parseEther("0.000001")
      }
    }
  }

  /**
   * Step 6: Send user operation on Sepolia
   */
  async sendUserOperation() {
    if (!this.smartAccount) {
      throw new Error('Smart account not created. Create smart account first.')
    }

    try {
      console.log('🚀 Sending user operation on Sepolia...')

      // Get current gas prices
      const gasPrices = await this.getGasPrices()

      // Define a single call
      const calls = [
        {
          to: "0x1111111111111111111111111111111111111111",
          value: parseEther("0.001"),
          data: "0x"
        }
      ]

      console.log('📤 Sending Sepolia user operation...')
      const userOpHash = await this.bundlerClient.sendUserOperation({
        account: this.smartAccount,
        calls: calls,
        maxFeePerGas: gasPrices.maxFeePerGas,
        maxPriorityFeePerGas: gasPrices.maxPriorityFeePerGas
      })

      console.log('✅ User operation sent successfully!')
      console.log('🟡 Sepolia User Operation Hash:', userOpHash)

      return userOpHash
    } catch (error) {
      console.error('❌ Failed to send user operation:', error)
      throw error
    }
  }

  /**
   * Complete flow: Create Test Account -> Setup -> Authorize -> Submit -> Create Account -> Send Operation
   */
  async executeCompleteFlow() {
    try {
      console.log('🚀 Starting complete EIP-7702 flow...')
      
      const account = await this.generateRandomAccount()
      await this.setupClients()
      await this.authorizeEIP7702Delegation()
      await this.submitAuthorization()
      await this.createMetaMaskSmartAccount()
      const result = await this.sendUserOperation()
      
      console.log('🎉 Complete EIP-7702 flow executed successfully!')
      return result
    } catch (error) {
      console.error('❌ Complete flow failed:', error)
      throw error
    }
  }
}

// Create singleton instance
export const eip7702Manager = new EIP7702SmartAccountManager()
export default EIP7702SmartAccountManager
