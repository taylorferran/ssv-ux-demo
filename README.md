# WebAuthn + MetaMask Smart Account Demo

This React app demonstrates creating WebAuthn credentials and using them directly with MetaMask smart accounts (without EIP-7702).

## Features

- 🔐 **WebAuthn Integration**: Create and manage passkeys in the browser
- 👤 **Viem Account Creation**: Convert WebAuthn credentials to viem accounts
- 🦊 **MetaMask Smart Account**: Create smart accounts directly from WebAuthn credentials
- 🚀 **User Operations**: Send transactions through the smart account
- 📊 **Real-time Status**: Visual feedback for each step of the process
- 📝 **Activity Logs**: Detailed logging of all operations

## Prerequisites

- Node.js 18+ 
- Modern browser with WebAuthn support (Chrome, Firefox, Safari, Edge)
- HTTPS connection (required for WebAuthn - use localhost for development)

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Bundler RPC:**
   
   Open `src/webauthn-smart-account.js` and update the `BUNDLER_RPC_URL` with your actual bundler endpoint:
   ```javascript
   const BUNDLER_RPC_URL = "https://your-bundler-rpc.com"
   ```
   
   You can get a free bundler RPC URL from:
   - [Pimlico](https://pimlico.io/)
   - [Alchemy](https://www.alchemy.com/)
   - [Stackup](https://www.stackup.sh/)

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   Navigate to `http://localhost:3000`

## How It Works

### Step-by-Step Flow

1. **Create WebAuthn Credential**: Generate a passkey using the browser's WebAuthn API
2. **Create WebAuthn Account**: Convert the credential to a viem account
3. **Setup Wallet Client**: Initialize a viem wallet client with the WebAuthn account
4. **Create Smart Account**: Initialize a MetaMask smart account directly from WebAuthn credentials
5. **Send User Operation**: Execute transactions through the smart account

### Architecture

```
WebAuthn Credential
        ↓
   Viem Account 
        ↓
   MetaMask Smart Account
        ↓
   User Operations
```

## Key Files

- `src/webauthn-smart-account.js`: Core business logic with complete implementation
- `src/App.jsx`: React frontend component
- `src/App.css`: Styling for the application

## Configuration

### Network Settings
The demo is configured for Sepolia testnet. To change networks, update the `CHAIN` constant in `src/webauthn-smart-account.js`:

```javascript
import { mainnet, sepolia, polygon } from 'viem/chains'

const CHAIN = mainnet // or sepolia, polygon, etc.
```

### Gas Settings
User operation gas settings can be adjusted in the `sendUserOperation` method:

```javascript
const maxFeePerGas = 20000000000n // 20 gwei
const maxPriorityFeePerGas = 1000000000n // 1 gwei
```

## Browser Compatibility

WebAuthn is supported in:
- ✅ Chrome 67+
- ✅ Firefox 60+
- ✅ Safari 14+
- ✅ Edge 18+

## Security Notes

- WebAuthn requires HTTPS in production
- Private keys are managed by the browser's secure enclave
- Smart account operations require proper gas estimation
- Always validate transaction parameters before signing

## Troubleshooting

### Common Issues

1. **WebAuthn not supported**: Ensure you're using a modern browser with WebAuthn support
2. **HTTPS required**: WebAuthn requires HTTPS (localhost works for development)
3. **Bundler errors**: Verify your bundler RPC URL is correct and has sufficient credits
4. **Gas estimation fails**: Check network congestion and adjust gas parameters
5. **Authorization fails**: Ensure the EIP-7702 contract is deployed on your target network

### Debug Mode

Enable detailed logging by opening browser developer tools and checking the console output.

## Development

### Build for production:
```bash
npm run build
```

### Preview production build:
```bash
npm run preview
```

## Resources

- [WebAuthn Guide](https://webauthn.guide/)
- [Viem Documentation](https://viem.sh/)
- [MetaMask Delegation Toolkit](https://github.com/MetaMask/delegation-toolkit)
- [EIP-7702 Specification](https://eips.ethereum.org/EIPS/eip-7702)
