import type { Connection, Keypair, PublicKey, Transaction } from "@solana/web3.js"

// Types for wallet interfaces
export interface Web3Wallet {
  publicKey: PublicKey
  signTransaction(transaction: Transaction): Promise<Transaction>
  signAllTransactions?(transactions: Transaction[]): Promise<Transaction[]>
}

// Authority revocation options
export interface RevokeAuthorityOptions {
  connection: Connection
  payer: Keypair | Web3Wallet
  mint: string | PublicKey
  revokeMint?: boolean
  revokeFreeze?: boolean
  partnerWallet?: string | PublicKey
  partnerAmount?: number
  programId?: string | PublicKey
  idl?: string | object
  logger?: (message: string) => void
}

// Simplified revocation config
export interface RevokeAuthoritySimpleConfig {
  mint: string
  revokeMint?: boolean
  revokeFreeze?: boolean
  walletPath?: string
  wallet?: Web3Wallet
  partnerWallet?: string | PublicKey
  partnerAmount?: number
  connection?: string | Connection
  cluster?: string
  logger?: (message: string) => void
}

// Token creation options
export interface TokenCreationOptions {
  connection: Connection
  payer: Keypair | Web3Wallet
  name: string
  symbol: string
  uri: string
  decimals?: number
  initialSupply?: number
  partnerWallet?: string | PublicKey
  partnerAmount?: number
  programId?: string | PublicKey
  idl?: string | object
  logger?: (message: string) => void
}

// Simplified token creation config
export interface TokenCreationSimpleConfig {
  name: string
  symbol: string
  uri: string
  decimals?: number
  initialSupply?: number
  walletPath?: string
  wallet?: Web3Wallet
  partnerWallet?: string | PublicKey
  partnerAmount?: number
  connection?: string | Connection
  cluster?: string
  logger?: (message: string) => void
}

// Result interfaces
export interface AuthorityRevocationResult {
  success: boolean
  mint?: string
  txSignature?: string
  revokedAuthorities?: {
    mint: boolean
    freeze: boolean
  }
  error?: string
  details?: any
}

export interface TokenCreationResult {
  success: boolean
  mint?: string
  txSignature?: string
  error?: string
  details?: any
}

// Main function exports
export declare function createToken(options: TokenCreationOptions): Promise<TokenCreationResult>
export declare function createTokenSimple(config: TokenCreationSimpleConfig): Promise<TokenCreationResult>

// Authority management functions
export declare function revokeAuthority(options: RevokeAuthorityOptions): Promise<AuthorityRevocationResult>
export declare function revokeAuthoritySimple(config: RevokeAuthoritySimpleConfig): Promise<AuthorityRevocationResult>
export declare function revokeFreezeAuthoritySimple(
  config: RevokeAuthoritySimpleConfig,
): Promise<AuthorityRevocationResult>
export declare function simpleRevokeMintAuthority(
  config: RevokeAuthoritySimpleConfig,
): Promise<AuthorityRevocationResult>
export declare function setCustomLogger(loggerFunction: (message: string) => void): void

// PDA utilities
export declare function derivePaymentPDA(programId: PublicKey): Promise<[PublicKey, number]>
export declare function deriveMintPDA(programId: PublicKey): Promise<[PublicKey, number]>
export declare function deriveTokenAccount(mint: PublicKey, owner: PublicKey): Promise<PublicKey>
export declare function deriveMetadataAccount(mint: PublicKey): Promise<PublicKey>

// Wallet utilities
export declare function verifyWalletFile(filePath: string): boolean
export declare function loadWalletFromFile(filePath: string): Keypair | null

// Conversion utilities
export declare const LAMPORTS_PER_SOL: number
export declare function solToLamports(sol: number): number
export declare function lamportsToSol(lamports: number): number
export declare function formatSolAmount(lamports: number, decimals?: number): string

// Validation utilities
export declare function validateTokenName(name: string): boolean
export declare function validateTokenSymbol(symbol: string): boolean
export declare function validateDecimals(decimals: number): boolean
export declare function validateInitialSupply(supply: number): boolean
export declare function validateUri(uri: string): boolean
export declare function validatePublicKey(key: string): boolean
export declare function validateTokenCreationParams(params: any): boolean

// Default export (for compatibility)
declare const mintme: {
  createToken: typeof createToken
  createTokenSimple: typeof createTokenSimple
  revokeAuthority: typeof revokeAuthority
  revokeAuthoritySimple: typeof revokeAuthoritySimple
  revokeFreezeAuthoritySimple: typeof revokeFreezeAuthoritySimple
  simpleRevokeMintAuthority: typeof simpleRevokeMintAuthority
  setCustomLogger: typeof setCustomLogger
  derivePaymentPDA: typeof derivePaymentPDA
  deriveMintPDA: typeof deriveMintPDA
  deriveTokenAccount: typeof deriveTokenAccount
  deriveMetadataAccount: typeof deriveMetadataAccount
  verifyWalletFile: typeof verifyWalletFile
  loadWalletFromFile: typeof loadWalletFromFile
  LAMPORTS_PER_SOL: typeof LAMPORTS_PER_SOL
  solToLamports: typeof solToLamports
  lamportsToSol: typeof lamportsToSol
  formatSolAmount: typeof formatSolAmount
  validateTokenName: typeof validateTokenName
  validateTokenSymbol: typeof validateTokenSymbol
  validateDecimals: typeof validateDecimals
  validateInitialSupply: typeof validateInitialSupply
  validateUri: typeof validateUri
  validatePublicKey: typeof validatePublicKey
  validateTokenCreationParams: typeof validateTokenCreationParams
}

export default mintme
