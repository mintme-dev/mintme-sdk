/**
 * Utilities for Solana unit conversion
 */

// Constant for SOL to lamports conversion
const LAMPORTS_PER_SOL = 1000000000 // 10^9

/**
 * Converts a SOL value to lamports
 * @param {number} solAmount - Amount in SOL (can be integer or decimal)
 * @returns {number} - Equivalent amount in lamports
 */
function solToLamports(solAmount) {
  return Math.round(solAmount * LAMPORTS_PER_SOL)
}

/**
 * Converts a lamports value to SOL
 * @param {number} lamportsAmount - Amount in lamports
 * @returns {number} - Equivalent amount in SOL
 */
function lamportsToSol(lamportsAmount) {
  return lamportsAmount / LAMPORTS_PER_SOL
}

/**
 * Formats a lamports value to display it in SOL with readable format
 * @param {number} lamportsAmount - Amount in lamports
 * @param {number} [decimals=4] - Number of decimals to display
 * @returns {string} - Formatted value in SOL (e.g., "1.5000 SOL")
 */
function formatSolAmount(lamportsAmount, decimals = 4) {
  const solValue = lamportsToSol(lamportsAmount)
  return `${solValue.toFixed(decimals)} SOL`
}

module.exports = {
  LAMPORTS_PER_SOL,
  solToLamports,
  lamportsToSol,
  formatSolAmount,
}
