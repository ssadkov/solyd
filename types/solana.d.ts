// Solana wallet types for browser
interface SolanaWallet {
  isPhantom?: boolean;
  isSolflare?: boolean;
  isBackpack?: boolean;
  connect(): Promise<{
    publicKey: {
      toString(): string;
    };
  }>;
  disconnect(): Promise<void>;
  signTransaction(transaction: any): Promise<any>;
  signAllTransactions(transactions: any[]): Promise<any[]>;
  signMessage(message: Uint8Array): Promise<{
    signature: Uint8Array;
  }>;
  publicKey?: {
    toString(): string;
  };
}

declare global {
  interface Window {
    solana?: SolanaWallet;
  }
}

export {};
