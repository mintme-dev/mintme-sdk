/**
 * Utilities for deriving Program Derived Addresses (PDAs)
 */

const solanaWeb3 = require("@solana/web3.js");
const anchor = require("@project-serum/anchor");
const constants = require("../constants");

/**
 * Derives the PDA for payment
 * @param {solanaWeb3.PublicKey} programId - Program ID
 * @returns {Promise<{pda: solanaWeb3.PublicKey, bump: number}>}
 */
function derivePaymentPDA(programId) {
  return solanaWeb3.PublicKey.findProgramAddress(
    [Buffer.from(constants.PAYMENT_SEED)],
    programId
  ).then((result) => ({
    pda: result[0],
    bump: result[1],
  }));
}

/**
 * Derives the PDA for the mint
 * @param {solanaWeb3.PublicKey} programId - Program ID
 * @param {solanaWeb3.PublicKey} payer - Payer's address
 * @param {string} name - Token name
 * @param {string} symbol - Token symbol
 * @param {string} uniqueKey - Unique Key
 * @returns {Promise<{mintPDA: solanaWeb3.PublicKey, bump: number}>}
 */
function deriveMintPDA(programId, payer, name, symbol, uniqueKey = "mitnme.dev") {

  return solanaWeb3.PublicKey.findProgramAddress(
    [
      Buffer.from("token-mint"),
      payer.toBuffer(),
      Buffer.from(name),
      Buffer.from(uniqueKey),
    ],
    programId
  ).then((result) => ({
    mintPDA: result[0],
    bump: result[1],
  }));
}

/**
 * Derives the associated token account
 * @param {solanaWeb3.PublicKey} mintPDA - Mint address
 * @param {solanaWeb3.PublicKey} owner - Account owner
 * @returns {Promise<solanaWeb3.PublicKey>}
 */
function deriveTokenAccount(mintPDA, owner) {
  return anchor.utils.token.associatedAddress({
    mint: mintPDA,
    owner: owner,
  });
}

/**
 * Derives the metadata account
 * @param {solanaWeb3.PublicKey} mintPDA - Mint address
 * @returns {Promise<{metadataAddress: solanaWeb3.PublicKey, metadataBump: number}>}
 */
function deriveMetadataAccount(mintPDA) {
  return solanaWeb3.PublicKey.findProgramAddress(
    [
      Buffer.from("metadata"),
      constants.TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      mintPDA.toBuffer(),
    ],
    constants.TOKEN_METADATA_PROGRAM_ID
  ).then((result) => ({
    metadataAddress: result[0],
    metadataBump: result[1],
  }));
}

module.exports = {
  derivePaymentPDA,
  deriveMintPDA,
  deriveTokenAccount,
  deriveMetadataAccount,
};
