# Privy Wallet Integration Setup

## Prerequisites

1. **Privy Dashboard Account**: You need to have a Privy account and app created
2. **App ID**: Get your Privy App ID from the Privy Dashboard

## Setup Instructions

### 1. Environment Variables

Create a `.env.local` file in the root directory and add your Privy App ID:

```bash
NEXT_PUBLIC_PRIVY_APP_ID=your-actual-privy-app-id
```

### 2. Privy Dashboard Configuration

1. Go to [Privy Dashboard](https://dashboard.privy.io)
2. Create a new app or use existing one
3. Configure Solana settings:
   - Enable Solana mainnet
   - Enable embedded wallets
   - Enable external wallet connectors (Phantom, Solflare, Backpack)

### 3. Features Implemented

- **Wallet Connection**: Connect/disconnect wallet functionality
- **Embedded Wallets**: Automatic creation for users without wallets
- **External Wallets**: Support for external wallet connection via Privy
- **Sidebar Integration**: Wallet component integrated in app sidebar
- **Address Display**: Shows truncated wallet address
- **Copy Address**: One-click copy wallet address to clipboard
- **Two Connection Options**: Embedded wallet or external wallet connection

### 4. Usage

The wallet component is automatically available in the sidebar. Users can:
- Click "Connect Wallet" for embedded wallet authentication
- Click "External Wallet" to connect existing wallets (Phantom, Solflare, etc.)
- View their wallet address when connected
- Copy their address to clipboard
- Disconnect their wallet

### 5. Configuration

The Privy configuration is in `providers.tsx` and includes:
- Embedded wallet creation for new users
- Simplified configuration (external wallets handled via Privy UI)

## Next Steps

1. Replace `your-privy-app-id` with your actual App ID
2. Test wallet connection functionality
3. Customize UI styling if needed
4. Add additional wallet features as required
