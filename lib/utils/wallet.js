/**
 * Wallet management utilities
 */

const fs = require("fs");
const path = require("path");
const solanaWeb3 = require("@solana/web3.js");

/**
 * Verifies if the wallet file exists
 * @param {string} walletPath - Path to the wallet file
 * @returns {boolean} - true if the file exists, false otherwise
 */
function verifyWalletFile(walletPath) {
  if (!fs) {
    console.warn(
      "The verifyWalletFile function is only available in Node.js environments"
    );
    return false;
  }

  try {
    const resolvedPath = path ? path.resolve(walletPath) : walletPath;
    return fs.existsSync(resolvedPath);
  } catch (error) {
    console.error("Error verifying wallet file:", error);
    return false;
  }
}

/**
 * Loads a wallet from a file
 * @param {string} walletPath - Path to the wallet file
 * @returns {solanaWeb3.Keypair|null} - Loaded Keypair or null if there's an error
 */
function loadWalletFromFile(walletPath) {
  if (!fs) {
    console.warn(
      "The loadWalletFromFile function is only available in Node.js environments"
    );
    return null;
  }

  try {
    const resolvedPath = path ? path.resolve(walletPath) : walletPath;
    if (!fs.existsSync(resolvedPath)) {
      console.error(`Error: Wallet file not found at ${resolvedPath}`);
      return null;
    }

    const walletData = JSON.parse(fs.readFileSync(resolvedPath, "utf-8"));
    return solanaWeb3.Keypair.fromSecretKey(Buffer.from(walletData));
  } catch (error) {
    console.error("Error loading wallet from file:", error);
    return null;
  }
}

module.exports = {
  verifyWalletFile,
  loadWalletFromFile,
};
