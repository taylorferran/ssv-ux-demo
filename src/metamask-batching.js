import { createPublicClient, http, createWalletClient, custom, parseEther, zeroAddress } from "viem";
import { createBundlerClient } from "viem/account-abstraction";
import { sepolia as chain } from "viem/chains";
import { 
  Implementation, 
  toMetaMaskSmartAccount,
} from "@metamask/delegation-toolkit";

const publicClient = createPublicClient({
  chain,
  transport: http()
});

const bundlerClient = createBundlerClient({
  client: publicClient,
  transport: http("https://rpc.zerodev.app/api/v3/e3896e1e-8cf7-4dd8-8fb7-1a95d19111ef/chain/11155111") // Sepolia testnet
});

class MetaMaskBatchingManager {
  constructor() {
    this.smartAccount = null
    this.connectedAccount = null
    this.isConnected = false
  }

  // Check if MetaMask is installed
  checkMetaMask() {
    if (!window.ethereum) {
      throw new Error("MetaMask is not installed. Please install MetaMask to continue.");
    }
    return true
  }

  // Connect to MetaMask and get account
  async connectMetaMask() {
    this.checkMetaMask()
    
    try {
      console.log('🦊 Connecting to MetaMask...')
      
      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      this.connectedAccount = accounts[0]
      this.isConnected = true
      
      console.log('✅ Connected to MetaMask:', this.connectedAccount)
      return this.connectedAccount
    } catch (error) {
      console.error('❌ Failed to connect to MetaMask:', error)
      throw error
    }
  }

  // Create smart account
  async createSmartAccount() {
    if (!this.isConnected) {
      throw new Error('MetaMask not connected. Connect first.')
    }

    try {
      console.log('🏭 Creating smart account...')
      
      // Create a wallet client using MetaMask
      const walletClient = createWalletClient({
        chain,
        transport: custom(window.ethereum)
      });

      // Get the account from the wallet client
      const [account] = await walletClient.getAddresses();

      this.smartAccount = await toMetaMaskSmartAccount({
        client: publicClient,
        implementation: Implementation.Hybrid,
        deployParams: [account, [], [], []],
        deploySalt: "0x",
        signatory: { 
          account: {
            address: account,
            signMessage: async ({ message }) => {
              return await walletClient.signMessage({
                account,
                message: typeof message === 'string' ? message : { raw: message }
              });
            },
            signTypedData: async (typedData) => {
              return await walletClient.signTypedData({
                account,
                ...typedData
              });
            }
          }
        },
      });

      console.log('✅ Smart account created:', this.smartAccount.address)
      return this.smartAccount
    } catch (error) {
      console.error('❌ Failed to create smart account:', error)
      throw error
    }
  }

  // Get current gas prices from bundler
  async getGasPrices() {
    try {
      console.log('⛽ Fetching current gas prices from bundler...')
      const gasPrices = await bundlerClient.request({
        method: 'pimlico_getUserOperationGasPrice',
        params: []
      })
      
      console.log('💰 Gas prices:', gasPrices)
      
      return {
        maxFeePerGas: BigInt(gasPrices.fast.maxFeePerGas),
        maxPriorityFeePerGas: BigInt(gasPrices.fast.maxPriorityFeePerGas)
      }
    } catch (error) {
      console.warn('⚠️ Failed to fetch gas prices, using fallback values:', error.message)
      // Fallback to higher values if gas price fetch fails
      return {
        maxFeePerGas: 3000000000n, // 3 gwei fallback
        maxPriorityFeePerGas: 1500000000n // 1.5 gwei fallback
      }
    }
  }

  // Send batched user operation
  async sendBatchedUserOperation() {
    if (!this.smartAccount) {
      throw new Error('Smart account not created. Create smart account first.')
    }

    try {
      // Get current gas prices
      const gasPrices = await this.getGasPrices()
      
      console.log("📦 Encoding calls with chain IDs...")
      console.log("🌐 Call 1: Sepolia (11155111) → 0x1234...7890 (0.00001 ETH)")
      console.log("🌐 Call 2: Base Sepolia (84532) → 0x5678...1234 (0.00002 ETH)")
      console.log("🌐 Call 3: No chain ID → Zero address")
      console.log(`⛽ Using gas prices - maxFee: ${gasPrices.maxFeePerGas.toString()} wei, maxPriority: ${gasPrices.maxPriorityFeePerGas.toString()} wei`)
      
      // Encode multiple calls into a single batch
      const callData = await this.smartAccount.encodeCalls([
        {
          chain: "11155111", // Sepolia chain ID
          to: "0x1234567890123456789012345678901234567890", // Sepolia destination
          value: parseEther("0.00001"),
          data: "0x"
        },
        {
          chain: "84532", // Base Sepolia chain ID
          to: "0x5678901234567890123456789012345678901234", // Base Sepolia destination
          value: parseEther("0.00002"),
          data: "0x"
        },
        {
          to: zeroAddress, 
          value: BigInt(0),
          data: "0x"
        }
      ]);

      console.log("✅ Encoded call data:", callData);
      console.log("🚀 Sending user operation with batched transactions...");
      
      const userOperationHash = await bundlerClient.sendUserOperation({
        account: this.smartAccount,
        calls: [
          {
            to: this.smartAccount.address,
            data: callData,
            value: BigInt(0)
          }
        ],
        maxFeePerGas: gasPrices.maxFeePerGas,
        maxPriorityFeePerGas: gasPrices.maxPriorityFeePerGas
      });

      console.log("📋 User operation sent, hash:", userOperationHash);
      console.log("⏳ Waiting for user operation receipt...");

      // Wait for the user operation to be included in a block
      const receipt = await bundlerClient.waitForUserOperationReceipt({
        hash: userOperationHash,
      });

      console.log("🎊 User operation receipt received:", receipt);

      // Get the transaction hash from the receipt
      const transactionHash = receipt.receipt.transactionHash;
      
      // Get the full transaction receipt
      const transactionReceipt = await publicClient.getTransactionReceipt({
        hash: transactionHash,
      });

      console.log("📄 Transaction receipt:", transactionReceipt);

      return {
        userOperationHash,
        transactionHash,
        userOperationReceipt: receipt,
        transactionReceipt,
        gasUsed: receipt.receipt.gasUsed,
        blockNumber: receipt.receipt.blockNumber,
        blockHash: receipt.receipt.blockHash,
        success: receipt.success,
        batchSize: 3, // Number of transactions batched
        chain: "Sepolia",
        explorer: "https://sepolia.etherscan.io"
      };
    } catch (error) {
      console.error('❌ Failed to send batched user operation:', error)
      throw error
    }
  }

  // Get current state
  getState() {
    return {
      isConnected: this.isConnected,
      connectedAccount: this.connectedAccount,
      hasSmartAccount: !!this.smartAccount,
      smartAccountAddress: this.smartAccount?.address || null
    }
  }

  // Reset state
  reset() {
    this.smartAccount = null
    this.connectedAccount = null
    this.isConnected = false
    console.log('🔄 MetaMask batching state reset')
  }
}

// Export singleton instance
export const batchingManager = new MetaMaskBatchingManager()
