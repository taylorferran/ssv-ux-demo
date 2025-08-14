import { createPublicClient, http, createWalletClient, custom, parseEther } from "viem";
import { createBundlerClient } from "viem/account-abstraction";
import { sepolia, baseSepolia } from "viem/chains";
import { 
  Implementation, 
  toMetaMaskSmartAccount,
} from "@metamask/delegation-toolkit";

// Sepolia clients
const publicClient = createPublicClient({
  chain: sepolia,
  transport: http()
});

// Base Sepolia clients
const baseSepoliaPublicClient = createPublicClient({
  chain: baseSepolia,
  transport: http()
});

const bundlerClient = createBundlerClient({
  client: publicClient,
  transport: http("https://rpc.zerodev.app/api/v3/e3896e1e-8cf7-4dd8-8fb7-1a95d19111ef/chain/11155111") // Sepolia testnet
});

const baseSepoliaBundlerClient = createBundlerClient({
  client: baseSepoliaPublicClient,
  transport: http("https://rpc.zerodev.app/api/v3/e3896e1e-8cf7-4dd8-8fb7-1a95d19111ef/chain/84532") // Base Sepolia testnet
});

class MetaMaskMultiChainManager {
  constructor() {
    this.sepoliaSmartAccount = null
    this.baseSepoliaSmartAccount = null
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

  // Get Sepolia smart account
  async getSepoliaSmartAccount() {
    if (!this.isConnected) {
      throw new Error('MetaMask not connected. Connect first.')
    }

    try {
      console.log('🏭 Creating Sepolia smart account...')
      
      // Create a wallet client using MetaMask for Sepolia
      const walletClient = createWalletClient({
        chain: sepolia,
        transport: custom(window.ethereum)
      });

      // Get the account from the wallet client
      const [account] = await walletClient.getAddresses();

      this.sepoliaSmartAccount = await toMetaMaskSmartAccount({
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

      console.log('✅ Sepolia smart account created:', this.sepoliaSmartAccount.address)
      return this.sepoliaSmartAccount
    } catch (error) {
      console.error('❌ Failed to create Sepolia smart account:', error)
      throw error
    }
  }

  // Get Base Sepolia smart account
  async getBaseSepoliaSmartAccount() {
    if (!this.isConnected) {
      throw new Error('MetaMask not connected. Connect first.')
    }

    try {
      console.log('🏭 Creating Base Sepolia smart account...')
      
      // Create a wallet client using MetaMask for Base Sepolia
      const walletClient = createWalletClient({
        chain: baseSepolia,
        transport: custom(window.ethereum)
      });

      // Get the account from the wallet client
      const [account] = await walletClient.getAddresses();

      this.baseSepoliaSmartAccount = await toMetaMaskSmartAccount({
        client: baseSepoliaPublicClient,
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

      console.log('✅ Base Sepolia smart account created:', this.baseSepoliaSmartAccount.address)
      return this.baseSepoliaSmartAccount
    } catch (error) {
      console.error('❌ Failed to create Base Sepolia smart account:', error)
      throw error
    }
  }

  // Function to request chain switch to Base Sepolia
  async switchToBaseSepolia() {
    this.checkMetaMask()

    try {
      console.log('🔄 Switching to Base Sepolia...')
      // Try to switch to Base Sepolia
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x14A34' }], // Base Sepolia chain ID (84532 in hex)
      });
      console.log('✅ Switched to Base Sepolia')
    } catch (switchError) {
      // If the chain hasn't been added to MetaMask, add it
      if (switchError.code === 4902) {
        console.log('📝 Adding Base Sepolia to MetaMask...')
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0x14A34',
            chainName: 'Base Sepolia',
            nativeCurrency: {
              name: 'ETH',
              symbol: 'ETH',
              decimals: 18,
            },
            rpcUrls: ['https://sepolia.base.org'],
            blockExplorerUrls: ['https://sepolia-explorer.base.org'],
          }],
        });
        console.log('✅ Base Sepolia added and switched')
      } else {
        throw switchError;
      }
    }
  }

  // Function to switch back to Sepolia
  async switchToSepolia() {
    this.checkMetaMask()

    try {
      console.log('🔄 Switching to Sepolia...')
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xAA36A7' }], // Sepolia chain ID (11155111 in hex)
      });
      console.log('✅ Switched to Sepolia')
    } catch (error) {
      if (error.code === 4001) {
        console.error('❌ User rejected chain switch to Sepolia');
        throw new Error('Please switch to Sepolia network to continue');
      }
      console.error('❌ Failed to switch to Sepolia:', error);
      throw error;
    }
  }

  // Get current gas prices from bundlers
  async getGasPrices() {
    try {
      console.log('⛽ Fetching current gas prices from bundlers...')
      
      // Get gas prices for both chains in parallel
      const [sepoliaGasPrices, baseSepoliaGasPrices] = await Promise.all([
        bundlerClient.request({
          method: 'pimlico_getUserOperationGasPrice',
          params: []
        }).catch(error => {
          console.warn('⚠️ Failed to fetch Sepolia gas prices:', error.message)
          return null
        }),
        baseSepoliaBundlerClient.request({
          method: 'pimlico_getUserOperationGasPrice',
          params: []
        }).catch(error => {
          console.warn('⚠️ Failed to fetch Base Sepolia gas prices:', error.message)
          return null
        })
      ])
      
      console.log('💰 Sepolia gas prices:', sepoliaGasPrices)
      console.log('💰 Base Sepolia gas prices:', baseSepoliaGasPrices)
      
      return {
        sepolia: sepoliaGasPrices ? {
          maxFeePerGas: BigInt(sepoliaGasPrices.fast.maxFeePerGas),
          maxPriorityFeePerGas: BigInt(sepoliaGasPrices.fast.maxPriorityFeePerGas)
        } : {
          maxFeePerGas: 3000000000n, // 3 gwei fallback
          maxPriorityFeePerGas: 1500000000n // 1.5 gwei fallback
        },
        baseSepolia: baseSepoliaGasPrices ? {
          maxFeePerGas: BigInt(baseSepoliaGasPrices.fast.maxFeePerGas),
          maxPriorityFeePerGas: BigInt(baseSepoliaGasPrices.fast.maxPriorityFeePerGas)
        } : {
          maxFeePerGas: 3000000000n, // 3 gwei fallback
          maxPriorityFeePerGas: 1500000000n // 1.5 gwei fallback
        }
      }
    } catch (error) {
      console.warn('⚠️ Failed to fetch gas prices, using fallback values:', error.message)
      // Fallback to higher values if gas price fetch fails
      return {
        sepolia: {
          maxFeePerGas: 3000000000n, // 3 gwei fallback
          maxPriorityFeePerGas: 1500000000n // 1.5 gwei fallback
        },
        baseSepolia: {
          maxFeePerGas: 3000000000n, // 3 gwei fallback
          maxPriorityFeePerGas: 1500000000n // 1.5 gwei fallback
        }
      }
    }
  }

  // Send cross-chain user operations
  async sendCrossChainUserOperations() {
    if (!this.sepoliaSmartAccount) {
      throw new Error('Sepolia smart account not created. Create smart accounts first.')
    }

    try {
      // Automatically switch to Sepolia first
      console.log("🔄 Ensuring we're on Sepolia network...")
      await this.switchToSepolia()

      // Get current gas prices from the bundler
      const gasPrices = await this.getGasPrices()
      const maxFeePerGas = gasPrices.sepolia.maxFeePerGas
      const maxPriorityFeePerGas = gasPrices.sepolia.maxPriorityFeePerGas

      console.log("🚀 Sending cross-chain user operations...")
      console.log(`⛽ Using gas prices - maxFee: ${maxFeePerGas.toString()} wei, maxPriority: ${maxPriorityFeePerGas.toString()} wei`)
      
      // Send first user operation on Sepolia
      console.log("📤 Sending User Operation #1 on Sepolia...");
      const userOp1Promise = bundlerClient.sendUserOperation({
        account: this.sepoliaSmartAccount,
        calls: [
          {
            to: "0x1111111111111111111111111111111111111111",
            value: parseEther("0.001"),
            data: "0x"
          },
          {
            to: "0x2222222222222222222222222222222222222222",
            value: parseEther("0.001"),
            data: "0x"
          },
          {
            to: "0x3333333333333333333333333333333333333333",
            value: parseEther("0.001"),
            data: "0x"
          }
        ],
        maxFeePerGas,
        maxPriorityFeePerGas
      });

      // Get the first user operation hash
      const userOpHash1 = await userOp1Promise;
      console.log("✅ User Operation 1 sent on Sepolia:", userOpHash1);

      // Automatically switch to Base Sepolia for the second operation
      await this.switchToBaseSepolia();

      // Get Base Sepolia smart account
      if (!this.baseSepoliaSmartAccount) {
        await this.getBaseSepoliaSmartAccount();
      }

      // Send second user operation on Base Sepolia
      console.log("📤 Sending User Operation #2 on Base Sepolia...");
      console.log(`⛽ Using Base Sepolia gas prices - maxFee: ${gasPrices.baseSepolia.maxFeePerGas.toString()} wei, maxPriority: ${gasPrices.baseSepolia.maxPriorityFeePerGas.toString()} wei`)
      const userOp2Promise = baseSepoliaBundlerClient.sendUserOperation({
        account: this.baseSepoliaSmartAccount,
        calls: [
          {
            to: "0x4444444444444444444444444444444444444444",
            value: parseEther("0.002"),
            data: "0x"
          },
          {
            to: "0x5555555555555555555555555555555555555555",
            value: parseEther("0.002"),
            data: "0x"
          },
          {
            to: "0x6666666666666666666666666666666666666666",
            value: parseEther("0.002"),
            data: "0x"
          }
        ],
        maxFeePerGas: gasPrices.baseSepolia.maxFeePerGas,
        maxPriorityFeePerGas: gasPrices.baseSepolia.maxPriorityFeePerGas
      });

      // Get the second user operation hash
      const userOpHash2 = await userOp2Promise;
      console.log("✅ User Operation 2 sent on Base Sepolia:", userOpHash2);
      
      console.log("🎉 Both cross-chain user operations sent!");
      console.log("📋 User Operation 1 Hash (Sepolia):", userOpHash1);
      console.log("📋 User Operation 2 Hash (Base Sepolia):", userOpHash2);
      console.log("⏳ Now waiting for both receipts...");

      // Wait for both receipts simultaneously
      const [receipt1, receipt2] = await Promise.all([
        bundlerClient.waitForUserOperationReceipt({ hash: userOpHash1 }),
        baseSepoliaBundlerClient.waitForUserOperationReceipt({ hash: userOpHash2 })
      ]);

      console.log("🎊 Both cross-chain user operation receipts received!");

      // Get transaction receipts for both chains
      const [txReceipt1, txReceipt2] = await Promise.all([
        publicClient.getTransactionReceipt({ hash: receipt1.receipt.transactionHash }),
        baseSepoliaPublicClient.getTransactionReceipt({ hash: receipt2.receipt.transactionHash })
      ]);

      // Switch back to Sepolia for consistency
      console.log("🔄 Switching back to Sepolia...");
      await this.switchToSepolia();

      return {
        userOperation1: {
          userOperationHash: userOpHash1,
          transactionHash: receipt1.receipt.transactionHash,
          userOperationReceipt: receipt1,
          transactionReceipt: txReceipt1,
          gasUsed: receipt1.receipt.gasUsed,
          blockNumber: receipt1.receipt.blockNumber,
          blockHash: receipt1.receipt.blockHash,
          success: receipt1.success,
          chain: "Sepolia",
          explorer: "https://sepolia.etherscan.io"
        },
        userOperation2: {
          userOperationHash: userOpHash2,
          transactionHash: receipt2.receipt.transactionHash,
          userOperationReceipt: receipt2,
          transactionReceipt: txReceipt2,
          gasUsed: receipt2.receipt.gasUsed,
          blockNumber: receipt2.receipt.blockNumber,
          blockHash: receipt2.receipt.blockHash,
          success: receipt2.success,
          chain: "Base Sepolia",
          explorer: "https://sepolia-explorer.base.org"
        },
        totalOperations: 2,
        crossChain: true
      };
    } catch (error) {
      console.error('❌ Failed to send cross-chain user operations:', error)
      throw error
    }
  }

  // Get current state
  getState() {
    return {
      isConnected: this.isConnected,
      connectedAccount: this.connectedAccount,
      hasSepoliaSmartAccount: !!this.sepoliaSmartAccount,
      hasBaseSepoliaSmartAccount: !!this.baseSepoliaSmartAccount,
      sepoliaSmartAccountAddress: this.sepoliaSmartAccount?.address || null,
      baseSepoliaSmartAccountAddress: this.baseSepoliaSmartAccount?.address || null,
      addressesMatch: this.sepoliaSmartAccount && this.baseSepoliaSmartAccount 
        ? this.sepoliaSmartAccount.address === this.baseSepoliaSmartAccount.address 
        : null
    }
  }

  // Reset state
  reset() {
    this.sepoliaSmartAccount = null
    this.baseSepoliaSmartAccount = null
    this.connectedAccount = null
    this.isConnected = false
    console.log('🔄 MetaMask multi-chain state reset')
  }
}

// Export singleton instance
export const metaMaskManager = new MetaMaskMultiChainManager()
