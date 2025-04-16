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

/**
 * Creates a token on Solana
 * @param {Object} options - Options for creating the token
 * @param {solanaWeb3.Connection} options.connection - Solana connection
 * @param {solanaWeb3.Keypair|Object} options.payer - Payer's keypair or compatible wallet
 * @param {string} options.name - Token name
 * @param {string} options.symbol - Token symbol
 * @param {number} options.decimals - Token decimals (default 9)
 * @param {number|string|BN} options.initialSupply - Initial supply (default 1000000000)
 * @param {string} options.uri - Metadata URI (default "https://example.com/metadata.json")
 * @param {boolean} options.revokeMint - Revoke mint authority (default false)
 * @param {string|solanaWeb3.PublicKey} options.programId - Program ID (optional)
 * @param {string|Object} options.idl - Program IDL (URL, object, or path, optional)
 * @returns {Promise<Object>} - Result of token creation
 */
function createToken(options) {
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

  // Set default values
  var decimals = options.decimals || 9;
  var initialSupply = options.initialSupply || 1000000000;
  var uri = options.uri || "https://example.com/metadata.json";
  var revokeMint = options.revokeMint || false;
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

      // Derive the necessary addresses
      return Promise.all([
        pdaUtils.derivePaymentPDA(programId),
        pdaUtils.deriveMintPDA(
          programId,
          wallet.publicKey,
          options.name,
          options.symbol
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

          console.log("Mint PDA:", mintPDA.mintPDA.toString());
          console.log("Token Account:", tokenAccount.toString());
          console.log(
            "Metadata Account:",
            metadataAccount.metadataAddress.toString()
          );

          // Call the create_token instruction
          return program.methods
            .createToken(
              options.name,
              options.symbol,
              decimals,
              initialSupply,
              uri,
              revokeMint
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
 * @param {number} config.decimals - Token decimals (default 9)
 * @param {number} config.initialSupply - Initial supply (default 1000000000)
 * @param {string} config.uri - Metadata URI (default "https://example.com/metadata.json")
 * @param {boolean} config.revokeMint - Revoke mint authority (default false)
 * @param {boolean} config.revokeFreeze - Revoke freeze authority after creating the token (default false)
 * @param {string} config.walletPath - Path to wallet.json file (default "./wallet.json")
 * @param {string} config.connection - Solana RPC endpoint (default "https://api.devnet.solana.com")
 * @param {string} config.cluster - Solana cluster (default "devnet")
 * @returns {Promise<Object>} - Result of token creation
 */
function createTokenSimple(config) {
  // Default configuration
  var defaultConfig = {
    tokenName: "Auto Token",
    tokenSymbol: "AUTO",
    decimals: 9,
    initialSupply: 1000000000,
    uri: "https://example.com/metadata.json",
    revokeMint: false,
    revokeFreeze: false,
    walletPath: "./wallet.json",
    connection: "https://api.devnet.solana.com",
    cluster: "devnet",
  };

  // Merge the provided configuration with the default
  config = Object.assign({}, defaultConfig, config || {});

  // Verify that the wallet file exists
  if (!walletUtils.verifyWalletFile(config.walletPath)) {
    return Promise.reject(
      new Error(
        `Wallet file not found at ${config.walletPath}. Generate a wallet with generate-wallet.js`
      )
    );
  }

  // Load wallet
  var payer = walletUtils.loadWalletFromFile(config.walletPath);
  if (!payer) {
    return Promise.reject(
      new Error(`Error loading wallet from ${config.walletPath}`)
    );
  }

  // Create Solana connection
  var connection = new solanaWeb3.Connection(config.connection, "confirmed");
  var tokenResult;

  // Verify balance and create token
  return connection
    .getBalance(payer.publicKey)
    .then((balance) => {
      console.log(`Address: ${payer.publicKey.toString()}`);
      console.log(`Balance: ${balance / 1000000000} SOL`);

      if (balance < 10000000) {
        throw new Error(
          `Insufficient balance. You need at least 0.01 SOL. Get SOL with: solana airdrop 2 ${payer.publicKey.toString()} --url devnet`
        );
      }

      // Create token
      return createToken({
        connection: connection,
        payer: payer,
        name: config.tokenName,
        symbol: config.tokenSymbol,
        decimals: config.decimals,
        initialSupply: config.initialSupply,
        uri: config.uri,
        revokeMint: config.revokeMint,
      });
    })
    .then((result) => {
      tokenResult = result;

      if (result.success && config.revokeFreeze) {
        console.log("Revoking freeze authority...");
        // Revoke the freeze authority if requested
        return tokenAuthority.revokeFreezeAuthority({
          connection: connection,
          payer: payer,
          name: config.tokenName,
          symbol: config.tokenSymbol,
        });
      }

      return null;
    })
    .then((revokeResult) => {
      if (tokenResult.success) {
        // Save token information to a file if we're in Node.js
        if (fs) {
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

            var tokenInfoPath = `created_${config.tokenSymbol.toLowerCase()}_token_info.json`;
            fs.writeFileSync(tokenInfoPath, JSON.stringify(tokenInfo, null, 2));
            console.log(`\nToken information saved to ${tokenInfoPath}`);
          } catch (error) {
            console.warn("Error saving token information:", error);
          }
        }

        // Add information about the freeze revocation to the result
        if (revokeResult) {
          tokenResult.freezeRevoked = revokeResult.success;
          tokenResult.freezeRevokeTx = revokeResult.txSignature;
        }
      }

      return tokenResult;
    });
}

module.exports = {
  createToken,
  createTokenSimple,
};
