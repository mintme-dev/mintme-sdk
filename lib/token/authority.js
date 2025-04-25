/**
 * Functions for managing token authorities on Solana
 * @module token-authority-utils
 */

const solanaWeb3 = require("@solana/web3.js")
const splToken = require("@solana/spl-token")
const anchor = require("@project-serum/anchor")
const constants = require("../constants")
const walletUtils = require("../utils/wallet")
const idlUtils = require("../utils/idl")
const conversionUtils = require("../utils/conversion")
const { PublicKey } = require("@solana/web3.js")

// Variable for custom logger
let customLogger = console.log

/**
 * Sets a custom logger function
 * @param {Function} loggerFunction - Function that will receive log messages
 */
function setCustomLogger(loggerFunction) {
  customLogger = loggerFunction || console.log
}

/**
 * Revokes mint and/or freeze authorities in a single transaction
 * @param {Object} options - Options for revoking authorities
 * @param {solanaWeb3.Connection} options.connection - Solana connection
 * @param {solanaWeb3.Keypair|Object} options.payer - Payer's keypair or compatible wallet
 * @param {string|solanaWeb3.PublicKey} options.mint - Token mint address
 * @param {boolean} options.revokeMint - Whether to revoke mint authority (default: true)
 * @param {boolean} options.revokeFreeze - Whether to revoke freeze authority (default: true)
 * @param {string|PublicKey} options.partnerWallet - Partner wallet receiving funds
 * @param {number} [options.partnerAmount=0] - Amount for partner wallet
 * @param {string|solanaWeb3.PublicKey} options.programId - Program ID (optional)
 * @param {string|Object} options.idl - Program IDL (URL, object, or path, optional)
 * @param {Function} options.logger - Custom logger function (optional)
 * @returns {Promise<Object>} - Result of the revocation
 */
function revokeAuthority(options) {
  // Use custom logger if provided in options for this call
  const logger = options.logger || customLogger

  // Validate required options
  if (!options.connection) {
    return Promise.reject(new Error("A Solana connection is required"))
  }
  if (!options.payer) {
    return Promise.reject(new Error("A payer (wallet or keypair) is required"))
  }
  if (!options.mint) {
    return Promise.reject(new Error("A token mint address is required"))
  }

  // Set default values for which authorities to revoke
  const revokeMint = options.revokeMint !== false // Default to true if not specified
  const revokeFreeze = options.revokeFreeze !== false // Default to true if not specified

  if (!revokeMint && !revokeFreeze) {
    return Promise.reject(new Error("At least one authority must be specified to revoke"))
  }

  // Parse mint address
  let mintPubkey
  try {
    mintPubkey = typeof options.mint === "string" ? new solanaWeb3.PublicKey(options.mint) : options.mint
  } catch (error) {
    logger(`Error parsing mint address: ${error.message}`)
    return Promise.reject(new Error(`Invalid mint address: ${error.message}`))
  }

  // Handle partner wallet correctly
  let partnerWallet
  try {
    partnerWallet = options.partnerWallet
      ? typeof options.partnerWallet === "string"
        ? new solanaWeb3.PublicKey(options.partnerWallet)
        : options.partnerWallet
      : options.payer.publicKey
  } catch (error) {
    logger(`Error parsing partner wallet: ${error.message}`)
    return Promise.reject(new Error(`Invalid partner wallet: ${error.message}`))
  }

  // Get partner amount or default to 0
  const partnerAmount = options.partnerAmount || 0

  // Validate programId
  let programId
  try {
    programId = options.programId
      ? typeof options.programId === "string"
        ? new solanaWeb3.PublicKey(options.programId)
        : options.programId
      : new solanaWeb3.PublicKey(constants.DEFAULT_PROGRAM_ID)
  } catch (error) {
    logger(`Error parsing program ID: ${error.message}`)
    return Promise.reject(new Error(`Invalid program ID: ${error.message}`))
  }

  // Use the provided IDL or the default
  const idlSource = options.idl || null

  // Determine the wallet/payer type
  let wallet
  if (options.payer.constructor && options.payer.constructor.name === "Keypair") {
    wallet = new anchor.Wallet(options.payer)
  } else if (options.payer.publicKey && options.payer.signTransaction) {
    // Anchor-compatible wallet (like Phantom)
    wallet = options.payer
  } else {
    return Promise.reject(new Error("Unsupported wallet format"))
  }

  // Configure the Anchor provider
  const provider = new anchor.AnchorProvider(options.connection, wallet, {
    commitment: "confirmed",
  })
  anchor.setProvider(provider)

  // Load the IDL and configure the program
  return idlUtils
    .loadIDL(idlSource)
    .then(async (idl) => {
      const program = new anchor.Program(idl, programId, provider)

      logger(`Revoking authorities for token: ${mintPubkey.toString()}`)
      logger(`Owner: ${wallet.publicKey.toString()}`)
      logger(
        `Authorities to revoke: ${revokeMint ? "Mint" : ""}${revokeMint && revokeFreeze ? " and " : ""}${revokeFreeze ? "Freeze" : ""}`,
      )

      // Derive the PDA addresses
      const [networkConfigPDA] = await PublicKey.findProgramAddress([Buffer.from("network_fee_config")], programId)
      const [revokeConfigPDA] = await PublicKey.findProgramAddress([Buffer.from("revoke_fee_config")], programId)
      const [tokenPDA] = await PublicKey.findProgramAddress([Buffer.from("payment_fixed")], programId)

      logger(`partnerWallet: ${partnerWallet.toString()}`)
      logger(`partnerAmount: ${partnerAmount}`)

      // Call the revoke_authority instruction with updated account structure
      return program.methods
        .revokeAuthority(revokeMint, revokeFreeze, partnerWallet, new anchor.BN(partnerAmount))
        .accounts({
          owner: wallet.publicKey,
          mint: mintPubkey,
          tokenProgram: splToken.TOKEN_PROGRAM_ID,
          systemProgram: solanaWeb3.SystemProgram.programId,
          tokenPda: tokenPDA,
          payer: wallet.publicKey,
          partnerWallet: partnerWallet,
          config: revokeConfigPDA, // Use revokeConfigPDA instead of networkConfigPDA
        })
        .rpc()
        .then((txSignature) => ({
          success: true,
          mint: mintPubkey.toString(),
          txSignature: txSignature,
          revokedAuthorities: {
            mint: revokeMint,
            freeze: revokeFreeze,
          },
        }))
    })
    .catch((error) => {
      logger(`Error revoking authorities: ${error.message}`)
      return {
        success: false,
        error: error.message,
        details: error,
      }
    })
}

/**
 * Simplified function to revoke authorities with minimal configuration
 * @param {Object} config - Simplified configuration
 * @param {string} config.mint - Token mint address
 * @param {boolean} [config.revokeMint=true] - Whether to revoke mint authority
 * @param {boolean} [config.revokeFreeze=true] - Whether to revoke freeze authority
 * @param {string} [config.walletPath] - Path to wallet.json file (default "./wallet.json")
 * @param {Object} [config.wallet] - Web3 wallet object with publicKey and signTransaction methods
 * @param {string|PublicKey} options.partnerWallet - Partner wallet receiving funds
 * @param {number} [options.partnerAmount=0] - Amount for partner wallet
 * @param {string|solanaWeb3.Connection} config.connection - Solana RPC endpoint or Connection object (default "https://api.devnet.solana.com")
 * @param {string} config.cluster - Solana cluster (default "devnet")
 * @param {Function} [config.logger] - Custom logger function
 * @returns {Promise<Object>} - Result of the operation
 */
function revokeAuthoritySimple(config) {
  // Default configuration
  const defaultConfig = {
    walletPath: "./wallet.json",
    connection: "https://api.devnet.solana.com",
    cluster: "devnet",
    revokeMint: true,
    revokeFreeze: true,
    partnerWallet: "7viHj1u6aQS9Nmc55FokX3B9NbDJUPwMYQvKgBfWeYXE",
    partnerAmount: 0,
  }

  // Merge the provided configuration with the default
  const mergedConfig = Object.assign({}, defaultConfig, config || {})

  // Use provided logger or default
  const logger = mergedConfig.logger || customLogger

  // Validate required parameters
  if (!mergedConfig.mint) {
    return Promise.reject(new Error("Token mint address is required"))
  }

  // Create Solana connection if a string was provided
  const connection =
    typeof mergedConfig.connection === "string"
      ? new solanaWeb3.Connection(mergedConfig.connection, "confirmed")
      : mergedConfig.connection

  // Determine the wallet to use (web3 wallet or file-based wallet)
  let payer
  const useWeb3Wallet = !!(mergedConfig.wallet && mergedConfig.wallet.publicKey)

  if (useWeb3Wallet) {
    // Use the provided web3 wallet
    payer = mergedConfig.wallet
  } else {
    // Use file-based wallet
    // Verify that the wallet file exists
    if (!walletUtils.verifyWalletFile(mergedConfig.walletPath)) {
      return Promise.reject(
        new Error(`Wallet file not found at ${mergedConfig.walletPath}. Generate a wallet with generate-wallet.js`),
      )
    }

    // Load wallet from file
    payer = walletUtils.loadWalletFromFile(mergedConfig.walletPath)
    if (!payer) {
      return Promise.reject(new Error(`Error loading wallet from ${mergedConfig.walletPath}`))
    }
  }

  // Verify balance and revoke authorities
  return connection
    .getBalance(payer.publicKey)
    .then(async (balance) => {
      logger(`Address: ${payer.publicKey.toString()}`)
      logger(`Balance: ${balance / 1000000000} SOL`)

      // Estimate the required fee (transaction fee + revoke fee)
      // In a production environment, you might want to query the actual fee from the RevokeFeeConfig account
      const estimatedRevokeFee = 2000000 // 0.002 SOL (typical revoke fee)
      const estimatedTxFee = 5000 // 0.000005 SOL (typical transaction fee)
      const requiredBalance = estimatedRevokeFee + estimatedTxFee

      if (balance < requiredBalance) {
        if (mergedConfig.cluster === "devnet") {
          throw new Error(
            `Insufficient balance. You need at least ${requiredBalance / 1000000000} SOL. Get SOL with: solana airdrop 1 ${payer.publicKey.toString()} --url devnet`,
          )
        } else {
          throw new Error(`Insufficient balance. You need at least ${requiredBalance / 1000000000} SOL.`)
        }
      }

      // Revoke authorities
      return revokeAuthority({
        connection: connection,
        payer: payer,
        mint: mergedConfig.mint,
        revokeMint: mergedConfig.revokeMint,
        revokeFreeze: mergedConfig.revokeFreeze,
        partnerWallet: mergedConfig.partnerWallet,
        partnerAmount: conversionUtils.solToLamports(mergedConfig.partnerAmount),
        logger: logger,
      })
    })
    .catch((error) => {
      logger(`Error in revokeAuthoritySimple: ${error.message}`)
      return {
        success: false,
        error: error.message,
        details: error,
      }
    })
}

/**
 * Revokes only the freeze authority (convenience function)
 * @param {Object} config - Configuration (see revokeAuthoritySimple)
 * @returns {Promise<Object>} - Result of the operation
 */
function revokeFreezeAuthoritySimple(config) {
  return revokeAuthoritySimple({
    ...config,
    revokeMint: false,
    revokeFreeze: true,
  })
}

/**
 * Revokes only the mint authority (convenience function)
 * @param {Object} config - Configuration (see revokeAuthoritySimple)
 * @returns {Promise<Object>} - Result of the operation
 */
function simpleRevokeMintAuthority(config) {
  return revokeAuthoritySimple({
    ...config,
    revokeMint: true,
    revokeFreeze: false,
  })
}

module.exports = {
  revokeAuthority,
  revokeAuthoritySimple,
  // Maintain these exports for compatibility with existing code
  revokeFreezeAuthoritySimple,
  simpleRevokeMintAuthority,
  setCustomLogger,
}
