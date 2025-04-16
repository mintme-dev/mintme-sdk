/**
 * Functions for managing token authorities on Solana
 */

const solanaWeb3 = require("@solana/web3.js");
const splToken = require("@solana/spl-token");
const anchor = require("@project-serum/anchor");
const constants = require("../constants");
const pdaUtils = require("../utils/pda");
const idlUtils = require("../utils/idl");

/**
 * Revokes the freeze authority of a token
 * @param {Object} options - Options for revoking the authority
 * @param {solanaWeb3.Connection} options.connection - Solana connection
 * @param {solanaWeb3.Keypair|Object} options.payer - Payer's keypair or compatible wallet
 * @param {string} options.name - Token name
 * @param {string} options.symbol - Token symbol
 * @param {string|solanaWeb3.PublicKey} options.programId - Program ID (optional)
 * @param {string|Object} options.idl - Program IDL (URL, object, or path, optional)
 * @returns {Promise<Object>} - Result of the revocation
 */
function revokeFreezeAuthority(options) {
  // Validate required options
  if (!options.connection) {
    return Promise.reject(new Error("A Solana connection is required"));
  }
  if (!options.payer) {
    return Promise.reject(new Error("A payer (wallet or keypair) is required"));
  }
  if (!options.name) {
    return Promise.reject(new Error("The token name is required"));
  }
  if (!options.symbol) {
    return Promise.reject(new Error("The token symbol is required"));
  }

  // Set default values
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

      // Derive the mint address
      return pdaUtils
        .deriveMintPDA(
          programId,
          wallet.publicKey,
          options.name,
          options.symbol
        )
        .then((mintPDA) => {
          console.log("Mint PDA:", mintPDA.mintPDA.toString());

          // Call the revoke_freeze_authority instruction
          return program.methods
            .revokeFreezeAuthority(options.name, options.symbol)
            .accounts({
              payer: wallet.publicKey,
              mint: mintPDA.mintPDA,
              tokenProgram: splToken.TOKEN_PROGRAM_ID,
              systemProgram: solanaWeb3.SystemProgram.programId,
            })
            .rpc()
            .then((txSignature) => ({
              success: true,
              mint: mintPDA.mintPDA.toString(),
              txSignature: txSignature,
            }));
        });
    })
    .catch((error) => {
      console.error("Error revoking freeze authority:", error);
      return {
        success: false,
        error: error.message,
        details: error,
      };
    });
}

module.exports = {
  revokeFreezeAuthority,
};
