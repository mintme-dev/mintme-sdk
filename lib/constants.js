/**
 * Constantes utilizadas en la librería MintMe
 */

const solanaWeb3 = require("@solana/web3.js");

// Constantes
const TOKEN_METADATA_PROGRAM_ID = new solanaWeb3.PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);
const DEFAULT_PROGRAM_ID = "4eujMtc4dqftZ2ZZQbH4RAMK7mjf9DGpRMpWhLxYr7hB";
const PAYMENT_SEED = "payment_fixed";
const DEFAULT_IDL_PATH = "./lib/idl.json";

module.exports = {
  TOKEN_METADATA_PROGRAM_ID,
  DEFAULT_PROGRAM_ID,
  PAYMENT_SEED,
  DEFAULT_IDL_PATH,
};
