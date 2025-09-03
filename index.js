/**
 * Access point to the functions
 * Supports both CommonJS and ES modules
 */

const mintme = require("./lib/mintme")

// CommonJS export (existing)
module.exports = mintme

// ES modules export (new)
// Export individual functions for named imports
module.exports.createToken = mintme.createToken
module.exports.createTokenSimple = mintme.createTokenSimple

// Authority management functions
module.exports.revokeAuthority = mintme.revokeAuthority
module.exports.revokeAuthoritySimple = mintme.revokeAuthoritySimple
module.exports.revokeFreezeAuthoritySimple = mintme.revokeFreezeAuthoritySimple
module.exports.simpleRevokeMintAuthority = mintme.simpleRevokeMintAuthority
module.exports.setCustomLogger = mintme.setCustomLogger

// PDA utilities
module.exports.derivePaymentPDA = mintme.derivePaymentPDA
module.exports.deriveMintPDA = mintme.deriveMintPDA
module.exports.deriveTokenAccount = mintme.deriveTokenAccount
module.exports.deriveMetadataAccount = mintme.deriveMetadataAccount

// Wallet utilities
module.exports.verifyWalletFile = mintme.verifyWalletFile
module.exports.loadWalletFromFile = mintme.loadWalletFromFile

// Conversion utilities
module.exports.LAMPORTS_PER_SOL = mintme.LAMPORTS_PER_SOL
module.exports.solToLamports = mintme.solToLamports
module.exports.lamportsToSol = mintme.lamportsToSol
module.exports.formatSolAmount = mintme.formatSolAmount

// Validation utilities
module.exports.validateTokenName = mintme.validateTokenName
module.exports.validateTokenSymbol = mintme.validateTokenSymbol
module.exports.validateDecimals = mintme.validateDecimals
module.exports.validateInitialSupply = mintme.validateInitialSupply
module.exports.validateUri = mintme.validateUri
module.exports.validatePublicKey = mintme.validatePublicKey
module.exports.validateTokenCreationParams = mintme.validateTokenCreationParams

// Default export for ES modules
module.exports.default = mintme
