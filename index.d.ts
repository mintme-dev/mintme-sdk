/**
 * MintMe SDK - TypeScript Definitions
 * A simple library for creating tokens on Solana
 */

import { PublicKey, Connection, Transaction, Signer } from '@solana/web3.js';

/**
 * Configuration options for token creation
 */
export interface TokenCreationConfig {
  /**
   * Name of the token
   */
  tokenName: string;
  
  /**
   * Symbol of the token
   */
  tokenSymbol: string;
  
  /**
   * A unique key for this token creation
   */
  uniqueKey: string;
  
  /**
   * Number of decimal places for the token
   */
  decimals: number;
  
  /**
   * Initial supply of the token
   */
  initialSupply: number;
  
  /**
   * URI for the token metadata
   */
  uri?: string;
  
  /**
   * Whether to revoke the mint authority after creation
   */
  revokeMint?: boolean;
  
  /**
   * Whether to revoke the freeze authority after creation
   */
  revokeFreeze?: boolean;
  
  /**
   * Solana connection string or Connection object
   */
  connection: string | Connection;
  
  /**
   * Solana cluster to use (e.g., 'devnet', 'mainnet-beta')
   */
  cluster: 'devnet' | 'testnet' | 'mainnet-beta';
  
  /**
   * Wallet configuration for signing transactions
   */
  wallet: {
    /**
     * Public key of the wallet
     */
    publicKey: PublicKey;
    
    /**
     * Function to sign a transaction
     */
    signTransaction: (transaction: Transaction) => Promise<Transaction>;
    
    /**
     * Function to sign multiple transactions
     */
    signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
  } | string; // Can also be a path to a wallet file
}

/**
 * Result of a token creation operation
 */
export interface TokenCreationResult {
  /**
   * Whether the operation was successful
   */
  success: boolean;
  
  /**
   * The address of the created token
   */
  tokenAddress?: string;
  
  /**
   * The transaction signature
   */
  txSignature?: string;
  
  /**
   * Error message if the operation failed
   */
  error?: string;
}

/**
 * Creates a token on Solana with simplified configuration
 * @param config Configuration options for token creation
 * @returns A promise that resolves to the result of the token creation
 */
export function createTokenSimple(config: TokenCreationConfig): Promise<TokenCreationResult>;

// Export as default and named export for maximum compatibility
export default {
  createTokenSimple
};