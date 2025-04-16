/**
 * MintMe SDK - TypeScript Definitions
 * A simple library for creating tokens on Solana
 */

import type { PublicKey, Connection, Transaction, VersionedTransaction } from "@solana/web3.js"

/**
 * Type for logger function
 */
export type LoggerFunction = (message: string) => void

/**
 * Configuration options for token creation
 */
export interface TokenCreationConfig {
  /**
   * Name of the token
   */
  tokenName: string

  /**
   * Symbol of the token
   */
  tokenSymbol: string

  /**
   * A unique key for this token creation
   */
  uniqueKey: string

  /**
   * Number of decimal places for the token
   */
  decimals: number

  /**
   * Initial supply of the token
   */
  initialSupply: number

  /**
   * URI for the token metadata
   */
  uri?: string

  /**
   * Whether to revoke the mint authority after creation
   */
  revokeMint?: boolean

  /**
   * Whether to revoke the freeze authority after creation
   */
  revokeFreeze?: boolean

  /**
   * Solana connection string or Connection object
   */
  connection: string | Connection

  /**
   * Solana cluster to use (e.g., 'devnet', 'mainnet-beta')
   * Made more flexible to accept any string value for future compatibility
   */
  cluster: "devnet" | "testnet" | "mainnet-beta" | string

  /**
   * Wallet configuration for signing transactions
   */
  wallet?:
    | {
        /**
         * Public key of the wallet
         */
        publicKey: PublicKey

        /**
         * Function to sign a transaction
         * Updated to support both Transaction and VersionedTransaction
         */
        signTransaction?: <T extends Transaction | VersionedTransaction>(transaction: T) => Promise<T>

        /**
         * Function to sign multiple transactions
         * Updated to support both Transaction and VersionedTransaction
         */
        signAllTransactions?: <T extends Transaction | VersionedTransaction>(transactions: T[]) => Promise<T[]>
      }
    | string // Can also be a path to a wallet file

  /**
   * Custom logger function to capture log messages
   */
  logger?: LoggerFunction

  /**
   * Path to wallet file (when not using wallet object)
   */
  walletPath?: string
}

/**
 * Result of a token creation operation
 */
export interface TokenCreationResult {
  /**
   * Whether the operation was successful
   */
  success: boolean

  /**
   * The address of the created token
   * @deprecated Use mint instead
   */
  tokenAddress?: string

  /**
   * The address of the created token (mint address)
   */
  mint?: string

  /**
   * The transaction signature
   */
  txSignature?: string

  /**
   * Error message if the operation failed
   */
  error?: string

  /**
   * Additional error details if available
   */
  details?: any

  /**
   * Whether the freeze authority was revoked (if revokeFreeze was true)
   */
  freezeRevoked?: boolean

  /**
   * Transaction signature for the freeze authority revocation
   */
  freezeRevokeTx?: string
}

/**
 * Creates a token on Solana with simplified configuration
 * @param config Configuration options for token creation
 * @returns A promise that resolves to the result of the token creation
 */
export function createTokenSimple(config: TokenCreationConfig): Promise<TokenCreationResult>

/**
 * Sets a custom logger function to capture log messages
 * @param loggerFunction Function that will receive log messages
 */
export function setCustomLogger(loggerFunction: LoggerFunction): void

// Export as default and named export for maximum compatibility
export default {
  createTokenSimple,
  setCustomLogger,
}
