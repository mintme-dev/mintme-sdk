/**
 * Functions for creating tokens on Solana
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

// Variable para el logger personalizado
let customLogger = console.log;

/**
 * Establece una función de logger personalizada
 * @param {Function} loggerFunction - Función que recibirá los mensajes de log
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
 * @param {boolean} options.revokeFreeze - Revoke mint authority (default false)
 * @param {string|PublicKey} config.partnerWallet
 * @param {number}    [config.partnerAmount=0]
 * @param {string|solanaWeb3.PublicKey} options.programId - Program ID (optional)
 * @param {string|Object} options.idl - Program IDL (URL, object, or path, optional)
 * @param {Function} options.logger - Custom logger function (optional)
 * @returns {Promise<Object>} - Result of token creation
 */
function createToken(options) {
  // Si se proporciona un logger en las opciones, usarlo para esta llamada
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
  var decimals = options.decimals || 9;
  var initialSupply = options.initialSupply || 1000000000;
  var uri = options.uri || "https://ipn.mintme.dev/metadata.json";
  var revokeMint = options.revokeMint || false;
  var revokeFreeze = options.revokeFreeze || false;
  var partnerWallet = options.partnerWallet
  ? (typeof options.partnerWallet === "string"
      ? new PublicKey(options.partnerWallet)
      : options.partnerWallet)
  : payer.publicKey;  
  var partnerAmount = options.partnerAmount || 0;
  var uniqueKey = options.uniqueKey || "mintme.dev";
  var programId = options.programId
    ? typeof options.programId === "string"
      ? new solanaWeb3.PublicKey(options.programId)
      : options.programId
    : new solanaWeb3.PublicKey(constants.DEFAULT_PROGRAM_ID);

  // Use the provided IDL or the default
  var idlSource = options.idl || null;

  // Determine the wallet/payer type
  var wallet;
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
  var provider = new anchor.AnchorProvider(options.connection, wallet, {
    commitment: "confirmed",
  });
  anchor.setProvider(provider);

  // Load the IDL and configure the program
  return idlUtils
    .loadIDL(idlSource)
    .then((idl) => {
      var program = new anchor.Program(idl, programId, provider);

      // Convert initialSupply to BN if necessary
      if (
        typeof initialSupply === "number" ||
        typeof initialSupply === "string"
      ) {
        initialSupply = new anchor.BN(initialSupply);
      }

      // const uniqueSeed = `${options.name}_${Date.now().toString()}`; //
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
      ])
        .then((results) => {
          var paymentPDA = results[0];
          var mintPDA = results[1];

          return Promise.all([
            paymentPDA,
            mintPDA,
            pdaUtils.deriveTokenAccount(mintPDA.mintPDA, wallet.publicKey),
            pdaUtils.deriveMetadataAccount(mintPDA.mintPDA),
          ]);
        })
        .then((results) => {
          var paymentPDA = results[0];
          var mintPDA = results[1];
          var tokenAccount = results[2];
          var metadataAccount = results[3];

          logger("Mint PDA: " + mintPDA.mintPDA.toString());
          logger("Token Account: " + tokenAccount.toString());
          logger("Metadata Account: " + metadataAccount.metadataAddress.toString());
          logger("Partner Wallet: " + partnerWallet.toString());
          logger("Partner Amoubt: " + partnerAmount);

          // Call the create_token instruction
          return program.methods
            .createToken(
              options.name,
              options.symbol,
              uniqueKey,
              decimals,
              initialSupply,
              uri,
              revokeMint,
              revokeFreeze,
              partnerWallet,
              partnerAmount
            )
            .accounts({
              payer: wallet.publicKey,
              mint: mintPDA.mintPDA,
              tokenAccount: tokenAccount,
              metadata: metadataAccount.metadataAddress,
              tokenPda: paymentPDA.pda, // Use tokenPda instead of paymentPda according to the new IDL
              tokenProgram: splToken.TOKEN_PROGRAM_ID,
              metadataProgram: constants.TOKEN_METADATA_PROGRAM_ID,
              systemProgram: solanaWeb3.SystemProgram.programId,
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
 * @param {publicKey} config.revokeFreeze - Revoke freeze authority after creating the token (default false)
 * @param {string|PublicKey} config.partnerWallet
 * @param {number} [config.partnerAmount=0]
 * @param {string} [config.walletPath] - Path to wallet.json file (default "./wallet.json")
 * @param {Object} [config.wallet] - Web3 wallet object with publicKey and signTransaction methods
 * @param {string|solanaWeb3.Connection} config.connection - Solana RPC endpoint or Connection object (default "https://api.devnet.solana.com")
 * @param {string} config.cluster - Solana cluster (default "devnet")
 * @param {Function} [config.logger] - Custom logger function
 * @returns {Promise<Object>} - Result of token creation
 */
function createTokenSimple(config) {
  // Default configuration
  var defaultConfig = {
    tokenName: "MINTME.DEV",
    tokenSymbol: "MTM",
    uniqueKey: "mintme.dev",
    decimals: 9,
    initialSupply: 1000000000,
    uri: "https://ipn.mintme.dev/metadata.json",
    revokeMint: false,
    revokeFreeze: false,
    partnerWallet: "7viHj1u6aQS9Nmc55FokX3B9NbDJUPwMYQvKgBfWeYXE",
    partnerAmount: 0,
    walletPath: "./wallet.json",
    connection: "https://api.devnet.solana.com",
    cluster: "devnet",
  };

  // Merge the provided configuration with the default
  config = Object.assign({}, defaultConfig, config || {});

  // Si se proporciona un logger en la configuración, usarlo para esta llamada
  const logger = config.logger || customLogger;

  // Create Solana connection if a string was provided
  var connection = typeof config.connection === 'string' 
    ? new solanaWeb3.Connection(config.connection, "confirmed")
    : config.connection;

  // Determine the wallet to use (web3 wallet or file-based wallet)
  var payer;
  var useWeb3Wallet = false;

  if (config.wallet && config.wallet.publicKey) {
    // Use the provided web3 wallet
    payer = config.wallet;
    useWeb3Wallet = true;
  } else {
    // Use file-based wallet
    // Verify that the wallet file exists
    if (!walletUtils.verifyWalletFile(config.walletPath)) {
      return Promise.reject(
        new Error(
          `Wallet file not found at ${config.walletPath}. Generate a wallet with generate-wallet.js`
        )
      );
    }

    // Load wallet from file
    payer = walletUtils.loadWalletFromFile(config.walletPath);
    if (!payer) {
      return Promise.reject(
        new Error(`Error loading wallet from ${config.walletPath}`)
      );
    }
  }

  var tokenResult;

  // Verify balance and create token
  return connection
    .getBalance(payer.publicKey)
    .then((balance) => {
      logger(`Address: ${payer.publicKey.toString()}`);
      logger(`Balance: ${balance / 1000000000} SOL`);

      if (balance < 10000000) {
        if(config.cluster==devnet)
          {
          throw new Error(
            `Insufficient balance. You need at least 0.03 SOL. Get SOL with: solana airdrop 2 ${payer.publicKey.toString()} --url devnet`
          );
        }else{
          throw new Error(
            `Insufficient balance. You need at least 0.03 SOL.`
          );
        }
      }

      // Create token
      return createToken({
        connection: connection,
        payer: payer,
        name: config.tokenName,
        symbol: config.tokenSymbol,
        uniqueKey: config.uniqueKey,
        decimals: config.decimals,
        initialSupply: config.initialSupply,
        uri: config.uri,
        revokeMint: config.revokeMint,
        revokeFreeze: config.revokeFreeze,
        partnerWallet: config.partnerWallet,
        partnerAmount: config.partnerAmount,
        logger: logger, // Send Logger
      });
    })
    .then((result) => {
      tokenResult = result;

      if (result.success && config.revokeMint) {
        logger("Revoked Mint authority...");
      }
      if (result.success && config.revokeFreeze) {
        logger("Revoked Freeze authority...");
      }

      return null;
    })
    .then((revokeResult) => {
      if (tokenResult.success) {
        // Save token information to a file if we're in Node.js and not using a web3 wallet
        if (fs && !useWeb3Wallet) {
          try {
            var timestamp = new Date().toISOString().replace(/[:.]/g, "-");
            var tokenInfo = {
              name: config.tokenName,
              symbol: config.tokenSymbol,
              mint: tokenResult.mint,
              tokenAccount: tokenResult.tokenAccount,
              metadata: tokenResult.metadata,
              txSignature: tokenResult.txSignature,
              createdAt: new Date().toISOString(),
              freezeRevoked: revokeResult ? revokeResult.success : false,
              freezeRevokeTx: revokeResult ? revokeResult.txSignature : null,
            };
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