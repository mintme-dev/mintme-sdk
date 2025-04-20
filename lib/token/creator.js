/**
 * Functions for creating tokens on Solana
 * @module solana-token-utils
 */

const solanaWeb3 = require("@solana/web3.js");
const splToken = require("@solana/spl-token");
const anchor = require("@project-serum/anchor");
const fs = require("fs");
const constants = require("../constants");
const walletUtils = require("../utils/wallet");
const pdaUtils = require("../utils/pda");
const idlUtils = require("../utils/idl");
const tokenAuthority = require("./authority");
const conversionUtils = require('../utils/conversion');

// Variable for custom logger
let customLogger = console.log;

/**
 * Sets a custom logger function
 * @param {Function} loggerFunction - Function that will receive log messages
 */
function setCustomLogger(loggerFunction) {
  customLogger = loggerFunction || console.log;
}

/**
 * Creates a token on Solana
 * @param {Object} options - Options for creating the token
 * @param {solanaWeb3.Connection} options.connection - Solana connection
 * @param {solanaWeb3.Keypair|Object} options.payer - Payer's keypair or compatible wallet
 * @param {string} options.name - Token name
 * @param {string} options.symbol - Token symbol
 * @param {string} options.uniqueKey - Unique Key
 * @param {number} options.decimals - Token decimals (default 9)
 * @param {number|string|BN} options.initialSupply - Initial supply (default 1000000000)
 * @param {string} options.uri - Metadata URI (default "https://example.com/metadata.json")
 * @param {boolean} options.revokeMint - Revoke mint authority (default false)
 * @param {boolean} options.revokeFreeze - Revoke freeze authority (default false)
 * @param {string|PublicKey} options.partnerWallet - Partner wallet public key
 * @param {number|string|BN} [options.partnerAmount=0] - Amount for partner wallet
 * @param {string|solanaWeb3.PublicKey} options.programId - Program ID (optional)
 * @param {string|Object} options.idl - Program IDL (URL, object, or path, optional)
 * @param {Function} options.logger - Custom logger function (optional)
 * @returns {Promise<Object>} - Result of token creation
 */
function createToken(options) {
  // Use custom logger if provided in options for this call
  const logger = options.logger || customLogger;

  // Validate required options
  if (!options.connection) {
    return Promise.reject(new Error("A Solana connection is required"));
  }
  if (!options.payer) {
    return Promise.reject(new Error("A payer (wallet or keypair) is required"));
  }
  if (!options.name) {
    return Promise.reject(new Error("A token name is required"));
  }
  if (!options.symbol) {
    return Promise.reject(new Error("A token symbol is required"));
  }
  if (!options.uniqueKey) {
    return Promise.reject(new Error("A uniqueKey is required"));
  }

  // Set default values
  const decimals = options.decimals || 9;
  const initialSupply = options.initialSupply || 1;
  const uri = options.uri || "https://ipfs.mintme.dev/metadata.json";
  const revokeMint = options.revokeMint || false;
  const revokeFreeze = options.revokeFreeze || false;
  
  // Handle partner wallet correctly
  const partnerWallet = options.partnerWallet
    ? (typeof options.partnerWallet === "string"
        ? new solanaWeb3.PublicKey(options.partnerWallet)
        : options.partnerWallet)
    : options.payer.publicKey;  
    
  const partnerAmount = options.partnerAmount || 0;
  const uniqueKey = options.uniqueKey || "mintme.dev";
  const programId = options.programId
    ? typeof options.programId === "string"
      ? new solanaWeb3.PublicKey(options.programId)
      : options.programId
    : new solanaWeb3.PublicKey(constants.DEFAULT_PROGRAM_ID);

  // Use the provided IDL or the default
  const idlSource = options.idl || null;

  // Determine the wallet/payer type
  let wallet;
  if (
    options.payer.constructor &&
    options.payer.constructor.name === "Keypair"
  ) {
    wallet = new anchor.Wallet(options.payer);
  } else if (options.payer.publicKey && options.payer.signTransaction) {
    // Anchor-compatible wallet (like Phantom)
    wallet = options.payer;
  } else {
    return Promise.reject(new Error("Unsupported wallet format"));
  }

  // Configure the Anchor provider
  const provider = new anchor.AnchorProvider(options.connection, wallet, {
    commitment: "confirmed",
  });
  anchor.setProvider(provider);

  // Load the IDL and configure the program
  return idlUtils
    .loadIDL(idlSource)
    .then((idl) => {
      const program = new anchor.Program(idl, programId, provider);

      // Convert initialSupply to BN if necessary
      let initialSupplyBN = initialSupply;
      if (
        typeof initialSupply === "number" ||
        typeof initialSupply === "string"
      ) {
        initialSupplyBN = new anchor.BN(initialSupply);
      }

      // Get current timestamp
      const timestamp = Math.floor(Date.now() / 1000);

      // Derive the necessary addresses
      return Promise.all([
        pdaUtils.derivePaymentPDA(programId),
        pdaUtils.deriveMintPDA(
          programId,
          wallet.publicKey,
          options.name,
          options.symbol,
          options.uniqueKey
        ),
        pdaUtils.deriveNetworkFeeConfigPDA(programId),
      ])
        .then((results) => {
          const paymentPDA = results[0];
          const mintPDA = results[1];
          const configPDA = results[2];

          return Promise.all([
            paymentPDA,
            mintPDA,
            pdaUtils.deriveTokenAccount(mintPDA.mintPDA, wallet.publicKey),
            pdaUtils.deriveMetadataAccount(mintPDA.mintPDA),
            configPDA,
          ]);
        })
        .then((results) => {
          const paymentPDA = results[0];
          const mintPDA = results[1];
          const tokenAccount = results[2];
          const metadataAccount = results[3];
          const configPDA = results[4];

          logger(`Payment PDA: ${paymentPDA.pda.toString()}`);
          logger(`Mint PDA: ${mintPDA.mintPDA.toString()}`);
          logger(`Token Account: ${tokenAccount.toString()}`);
          logger(`Metadata Account: ${metadataAccount.metadataAddress.toString()}`);
          logger(`Network Fee Config: ${configPDA.pda.toString()}`);
          logger(`Partner: ${partnerWallet?.toString() || "Not defined"}`);

          // Call the create_token instruction
          return program.methods
            .createToken(
              options.name,
              options.symbol,
              uniqueKey,
              decimals,
              initialSupplyBN,
              uri,
              revokeMint,
              revokeFreeze,
              partnerWallet,
              new anchor.BN(partnerAmount)
            )
            .accounts({
              payer: wallet.publicKey,
              config: configPDA.pda,
              mint: mintPDA.mintPDA,
              tokenAccount: tokenAccount,
              metadata: metadataAccount.metadataAddress,
              tokenPda: paymentPDA.pda, // Use tokenPda instead of paymentPda according to the new IDL
              tokenProgram: splToken.TOKEN_PROGRAM_ID,
              metadataProgram: constants.TOKEN_METADATA_PROGRAM_ID,
              systemProgram: solanaWeb3.SystemProgram.programId,
              partnerWallet: partnerWallet,
              rent: solanaWeb3.SYSVAR_RENT_PUBKEY,
              associatedTokenProgram: splToken.ASSOCIATED_TOKEN_PROGRAM_ID,
            })
            .rpc()
            .then((txSignature) => ({
              success: true,
              mint: mintPDA.mintPDA.toString(),
              tokenAccount: tokenAccount.toString(),
              metadata: metadataAccount.metadataAddress.toString(),
              txSignature: txSignature,
              tokenName: options.name,
              tokenSymbol: options.symbol,
            }));
        });
    })
    .catch((error) => {
      console.error("Error creating token:", error);
      logger("Error creating token: " + error.message);
      return {
        success: false,
        error: error.message,
        details: error,
      };
    });
}

/**
 * Creates a token with simplified configuration
 * @param {Object} config - Simplified configuration
 * @param {string} config.tokenName - Token name
 * @param {string} config.tokenSymbol - Token symbol
 * @param {string} config.uniqueKey - Unique Key
 * @param {number} config.decimals - Token decimals (default 9)
 * @param {number} config.initialSupply - Initial supply (default 1000000000)
 * @param {string} config.uri - Metadata URI (default "https://example.com/metadata.json")
 * @param {boolean} config.revokeMint - Revoke mint authority (default false)
 * @param {boolean} config.revokeFreeze - Revoke freeze authority after creating the token (default false)
 * @param {string|PublicKey} config.partnerWallet - Partner wallet receiving funds
 * @param {number} [config.partnerAmount=0] - Amount for partner wallet
 * @param {string} [config.walletPath] - Path to wallet.json file (default "./wallet.json")
 * @param {Object} [config.wallet] - Web3 wallet object with publicKey and signTransaction methods
 * @param {string|solanaWeb3.Connection} config.connection - Solana RPC endpoint or Connection object (default "https://api.devnet.solana.com")
 * @param {string} config.cluster - Solana cluster (default "devnet")
 * @param {Function} [config.logger] - Custom logger function
 * @returns {Promise<Object>} - Result of token creation
 */
function createTokenSimple(config) {
  
  // Default configuration
  const defaultConfig = {
    tokenName: "MINTME.DEV",
    tokenSymbol: "MTM",
    uniqueKey: "mintme.dev",
    decimals: 9,
    initialSupply: 1000000000,
    uri: "https://ipfs.mintme.dev/metadata.json",
    revokeMint: false,
    revokeFreeze: false,
    partnerWallet: "7viHj1u6aQS9Nmc55FokX3B9NbDJUPwMYQvKgBfWeYXE",
    partnerAmount: 0,
    walletPath: "./wallet.json",
    connection: "https://api.devnet.solana.com",
    cluster: "devnet",
  };

  // Merge the provided configuration with the default
  const mergedConfig = Object.assign({}, defaultConfig, config || {});

  // Use provided logger or default
  const logger = mergedConfig.logger || customLogger;

  // Create Solana connection if a string was provided
  const connection = typeof mergedConfig.connection === 'string' 
    ? new solanaWeb3.Connection(mergedConfig.connection, "confirmed")
    : mergedConfig.connection;

  // Determine the wallet to use (web3 wallet or file-based wallet)
  let payer;
  const useWeb3Wallet = !!(mergedConfig.wallet && mergedConfig.wallet.publicKey);

  if (useWeb3Wallet) {
    // Use the provided web3 wallet
    payer = mergedConfig.wallet;
  } else {
    // Use file-based wallet
    // Verify that the wallet file exists
    if (!walletUtils.verifyWalletFile(mergedConfig.walletPath)) {
      return Promise.reject(
        new Error(
          `Wallet file not found at ${mergedConfig.walletPath}. Generate a wallet with generate-wallet.js`
        )
      );
    }

    // Load wallet from file
    payer = walletUtils.loadWalletFromFile(mergedConfig.walletPath);
    if (!payer) {
      return Promise.reject(
        new Error(`Error loading wallet from ${mergedConfig.walletPath}`)
      );
    }
  }

  let tokenResult;

  // Verify balance and create token
  return connection
    .getBalance(payer.publicKey)
    .then((balance) => {
      logger(`Address: ${payer.publicKey.toString()}`);
      logger(`Balance: ${balance / 1000000000} SOL`);

      if (balance < 10000000) {
        if (mergedConfig.cluster === "devnet") {
          throw new Error(
            `Insufficient balance. You need at least 0.03 SOL. Get SOL with: solana airdrop 2 ${payer.publicKey.toString()} --url devnet`
          );
        } else {
          throw new Error(
            `Insufficient balance. You need at least 0.03 SOL.`
          );
        }
      }

      // Create token
      return createToken({
        connection: connection,
        payer: payer,
        name: mergedConfig.tokenName,
        symbol: mergedConfig.tokenSymbol,
        uniqueKey: mergedConfig.uniqueKey,
        decimals: mergedConfig.decimals,
        initialSupply: conversionUtils.solToLamports(mergedConfig.initialSupply),
        uri: mergedConfig.uri,
        revokeMint: mergedConfig.revokeMint,
        revokeFreeze: mergedConfig.revokeFreeze,
        partnerWallet: mergedConfig.partnerWallet,
        partnerAmount: conversionUtils.solToLamports(mergedConfig.partnerAmount),
        logger: logger, // Send Logger
      });
    })
    .then((result) => {
      tokenResult = result;

      if (result.success && mergedConfig.revokeMint) {
        logger("Revoked Mint authority...");
      }
      if (result.success && mergedConfig.revokeFreeze) {
        logger("Revoked Freeze authority...");
      }

      return null;
    })
    .then((revokeResult) => {
      if (tokenResult.success) {
        // Save token information to a file if we're in Node.js and not using a web3 wallet
        if (fs && !useWeb3Wallet) {
          try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
            const tokenInfo = {
              name: mergedConfig.tokenName,
              symbol: mergedConfig.tokenSymbol,
              mint: tokenResult.mint,
              tokenAccount: tokenResult.tokenAccount,
              metadata: tokenResult.metadata,
              txSignature: tokenResult.txSignature,
              createdAt: new Date().toISOString(),
              freezeRevoked: revokeResult ? revokeResult.success : false,
              freezeRevokeTx: revokeResult ? revokeResult.txSignature : null,
            };
            
            // Note: The original code doesn't actually save the file, 
            // just prepares the tokenInfo object
          } catch (error) {
            logger("Error saving token information: " + error.message);
          }
        }

        // Add information about the freeze revocation to the result
        if (revokeResult) {
          tokenResult.freezeRevoked = revokeResult.success;
          tokenResult.freezeRevokeTx = revokeResult.txSignature;
        }
      }

      return tokenResult;
    })
    .catch((error) => {
      logger(`Error in createTokenSimple: ${error.message}`);
      return {
        success: false,
        error: error.message,
        details: error,
      };
    });
}

module.exports = {
  createToken,
  createTokenSimple,
  setCustomLogger
};