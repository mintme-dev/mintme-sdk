/**
 * MintMe - Solana Token Creator Library
 *
 * A simple library for creating tokens on Solana that works in both NodeJS and browsers.
 * Compatible with ECMAScript 5 for greater compatibility.
 */

;((root, factory) => {
  // Support for UMD (Universal Module Definition)
  // Works in Node.js, AMD and global browser
  if (typeof define === "function" && define.amd) {
    // AMD. Register as an anonymous module
    define(["@solana/web3.js", "@solana/spl-token", "@project-serum/anchor", "fs", "path"], factory)
  } else if (typeof module === "object" && module.exports) {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    module.exports = factory(
      require("@solana/web3.js"),
      require("@solana/spl-token"),
      require("@project-serum/anchor"),
      require("fs"),
      require("path"),
    )
  } else {
    // Browser globals (root is window)
    root.mintme = factory(root.solanaWeb3, root.splToken, root.anchor, null, null)
  }
})(typeof self !== "undefined" ? self : this, (solanaWeb3, splToken, anchor, fs, path) => {
  // Import modules
  const constants = require("./constants")
  const walletUtils = require("./utils/wallet")
  const pdaUtils = require("./utils/pda")
  const idlUtils = require("./utils/idl")
  const tokenCreator = require("./token/creator")
  const tokenAuthority = require("./token/authority")
  const conversionUtils = require("./utils/conversion")
  const validationUtils = require("./utils/validation")

  // Export public functions
  return {
    // Main functions
    createToken: tokenCreator.createToken,
    createTokenSimple: tokenCreator.createTokenSimple,

    // Authority management functions
    revokeAuthority: tokenAuthority.revokeAuthority,
    revokeAuthoritySimple: tokenAuthority.revokeAuthoritySimple,
    revokeFreezeAuthoritySimple: tokenAuthority.revokeFreezeAuthoritySimple,
    simpleRevokeMintAuthority: tokenAuthority.simpleRevokeMintAuthority,
    setCustomLogger: tokenAuthority.setCustomLogger,

    // PDA utilities
    derivePaymentPDA: pdaUtils.derivePaymentPDA,
    deriveMintPDA: pdaUtils.deriveMintPDA,
    deriveTokenAccount: pdaUtils.deriveTokenAccount,
    deriveMetadataAccount: pdaUtils.deriveMetadataAccount,

    // Wallet utilities
    verifyWalletFile: walletUtils.verifyWalletFile,
    loadWalletFromFile: walletUtils.loadWalletFromFile,

    // Conversion utilities
    LAMPORTS_PER_SOL: conversionUtils.LAMPORTS_PER_SOL,
    solToLamports: conversionUtils.solToLamports,
    lamportsToSol: conversionUtils.lamportsToSol,
    formatSolAmount: conversionUtils.formatSolAmount,

    // Validation utilities
    validateTokenName: validationUtils.validateTokenName,
    validateTokenSymbol: validationUtils.validateTokenSymbol,
    validateDecimals: validationUtils.validateDecimals,
    validateInitialSupply: validationUtils.validateInitialSupply,
    validateUri: validationUtils.validateUri,
    validatePublicKey: validationUtils.validatePublicKey,
    validateTokenCreationParams: validationUtils.validateTokenCreationParams,
  }
})
