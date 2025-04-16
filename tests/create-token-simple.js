/**
 * create-token-simple.js
 *
 * Minified version to automatically create tokens on Solana.
 * Simply run with: node createTokenNode.js
 */

const { createTokenSimple } = require("mintme");

async function main() {
  try {
    // Config File
    const config = {
      tokenName: "MTM",
      tokenSymbol: "MTM",
      uniqueKey: Date.now().toString(),
      decimals: 9,
      initialSupply: 1000000000000000,
      uri: "https://ipfs.mintme.dev/metadata.json",
      revokeMint: true,
      revokeFreeze: true,
      walletPath: "./wallet.json",
      connection: "https://api.devnet.solana.com",
      cluster: "devnet",
    };

    console.log("=== MINTING TOKEN ===");
    console.log(config);
    console.log("=====================================");

    // Create token using the simplified function
    const result = await createTokenSimple(config);

    if (result.success) {
      console.log("=== TOKEN CREATED ===");
      console.log(result);
      console.log(
        `TX: https://explorer.solana.com/tx/${result.txSignature}?cluster=${config.cluster}`
      );
      console.log(
        `TKN: https://explorer.solana.com/address/${result.mint}?cluster=${config.cluster}`
      );
    } else {
      console.error("\n❌ Error creating the token:", result.error);
      if (result.details) {
        console.error("Details:", result.details);
      }
      process.exit(1);
    }
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
}

// Run the main function
main();
