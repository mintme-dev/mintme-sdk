#!/usr/bin/env node

/**
 * createTokenTerminal.js
 *
 * Script to create tokens on Solana from the terminal using the mintme library.
 *
 * Usage:
 * node createTokenTerminal.js --name "MINTME" --symbol "MTKN" [options]
 */

const { Connection, Keypair } = require("@solana/web3.js");
const { createToken, revokeFreezeAuthority } = require("mintme");
const fs = require("fs");
const path = require("path");
const readline = require("readline");

// Function to parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const params = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--")) {
      const key = args[i].slice(2);
      const value =
        args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : true;
      params[key] = value;
      if (value !== true) i++;
    }
  }

  return params;
}

// Function to display help
function showHelp() {
  console.log(`
  createTokenTerminal.js - Create tokens on Solana using mintme

  Usage:
    node createTokenTerminal.js --name "Token Name" --symbol "SYMB" [options]

  Options:
    --name STRING       Token name (required)
    --symbol STRING     Token symbol (required)
    --unique-key STRING     Unique Key
    --decimals NUMBER   Number of decimals (default: 9)
    --supply NUMBER     Initial supply (default: 1000000000)
    --uri STRING        Metadata URI (default: "https://ipfs.mintme.dev/metadata.json")
    --revoke-mint       Revoke mint authority (default: false)
    --revoke-freeze     Revoke freeze authority after creating the token (default: false)
    --wallet STRING     Path to wallet.json file (default: "./wallet.json")
    --cluster STRING    Solana cluster: devnet, testnet, mainnet (default: devnet)
    --endpoint STRING   Custom Solana RPC endpoint (takes priority over --cluster)
    --help              Show this help
  
  Examples:
    node tests/createTokenTerminal.js --name "MINTME" --symbol "MTM" --unique-key "VERSION_1"
    node tests/createTokenTerminal.js --name "MINTME" --symbol "MTM" --decimals 6 --supply 1000000 --unique-key "VERSION_1"
    node tests/createTokenTerminal.js --name "MINTME" --symbol "MTM" --revoke-mint --wallet "./my-wallet.json" --unique-key "VERSION_1"
    node tests/createTokenTerminal.js --name "MINTME" --symbol "MTM" --cluster mainnet --unique-key "VERSION_1"
    node tests/createTokenTerminal.js --name "MINTME" --symbol "MTM" --revoke-freeze --unique-key "VERSION_1"
    node tests/create-token-terminal.js --name "MINTME" --symbol "MTM" --decimals 6 --supply 1000000 --uri "https://mintme.dev/metadata.json" --revoke-mint --revoke-freeze --unique-key "VERSION_1"
    node tests/create-token-terminal.js --name "MINTME" --symbol "MTM" --decimals 6 --supply 1000000 --uri "https://mintme.dev/metadata.json" --revoke-mint --revoke-freeze --endpoint "https://api.devnet.solana.com" --unique-key "VERSION_1"
  `);
}

// Main function
async function main() {
  try {
    // Parse arguments
    const params = parseArgs();

    // Show help if requested or if required parameters are missing
    if (
      params.help ||
      !params.name ||
      !params.symbol ||
      !params["unique-key"]
    ) {
      showHelp();
      if (!params.help) {
        console.error(
          "\nError: Parameters --name, --symbol, and --unique-key are required"
        );
      }
      process.exit(params.help ? 0 : 1);
    }

    // Configure parameters with default values
    const tokenName = params.name;
    const tokenSymbol = params.symbol;
    const uniqueKey = params["unique-key"];
    const decimals = Number.parseInt(params.decimals || "9", 10);
    const initialSupply = Number.parseInt(params.supply || "1000000000", 10);
    const uri = params.uri || "https://ipfs.mintme.dev/metadata.json";
    const revokeMint = params["revoke-mint"] === true;
    const revokeFreezeAfterCreation = params["revoke-freeze"] === true;
    const walletPath = params.wallet || "./wallet.json";
    const cluster = params.cluster || "devnet";

    // Configure endpoint (custom endpoint takes priority over cluster)
    let endpoint;
    if (params.endpoint) {
      endpoint = params.endpoint;
    } else {
      switch (cluster) {
        case "mainnet":
          endpoint = "https://api.mainnet-beta.solana.com";
          break;
        case "testnet":
          endpoint = "https://api.testnet.solana.com";
          break;
        case "devnet":
        default:
          endpoint = "https://api.devnet.solana.com";
          break;
      }
    }

    console.log("=== Token Configuration ===");
    console.log(`Name: ${tokenName}`);
    console.log(`Symbol: ${tokenSymbol}`);
    console.log(`Unique Key: ${uniqueKey}`);
    console.log(`Decimals: ${decimals}`);
    console.log(`Initial Supply: ${initialSupply}`);
    console.log(`URI: ${uri}`);
    console.log(`Revoke mint: ${revokeMint}`);
    console.log(`Revoke freeze after creation: ${revokeFreezeAfterCreation}`);
    console.log(`Wallet: ${walletPath}`);
    console.log(`Cluster: ${cluster}`);
    console.log(`Endpoint: ${endpoint}`);
    console.log("=============================");

    // Verify that the wallet file exists
    const resolvedWalletPath = path.resolve(walletPath);
    if (!fs.existsSync(resolvedWalletPath)) {
      console.error(`Error: Wallet file not found at ${resolvedWalletPath}`);
      console.log(
        "You can generate a wallet by running: node generate-wallet.js"
      );
      process.exit(1);
    }

    // Load wallet
    console.log(`Loading wallet from ${resolvedWalletPath}...`);
    const walletData = JSON.parse(fs.readFileSync(resolvedWalletPath, "utf-8"));
    const payer = Keypair.fromSecretKey(Buffer.from(walletData));

    // Create Solana connection
    console.log(`Connecting to Solana (${endpoint})...`);
    const connection = new Connection(endpoint, "confirmed");

    // Check balance
    const balance = await connection.getBalance(payer.publicKey);
    console.log(`Address: ${payer.publicKey.toString()}`);
    console.log(`Balance: ${balance / 1000000000} SOL`);

    if (balance < 10000000) {
      console.error(
        "Error: Insufficient balance. You need at least 0.01 SOL to create a token."
      );
      console.log(
        `You can get SOL on devnet with: solana airdrop 2 ${payer.publicKey.toString()} --url devnet`
      );
      process.exit(1);
    }

    // Create token
    console.log("\nCreating token...");
    const result = await createToken({
      connection,
      payer,
      name: tokenName,
      symbol: tokenSymbol,
      uniqueKey: uniqueKey,
      decimals,
      initialSupply,
      uri,
      revokeMint,
    });

    if (result.success) {
      console.log("\n✅ Token created successfully!");
      console.log("=== Token Details ===");
      console.log(`Mint: ${result.mint}`);
      console.log(`Token account: ${result.tokenAccount}`);
      console.log(`Metadata: ${result.metadata}`);
      console.log(`Transaction: ${result.txSignature}`);
      console.log(
        `Explorer URL: https://explorer.solana.com/tx/${result.txSignature}?cluster=${cluster}`
      );

      // Save token information to a file
      const tokenInfo = {
        name: tokenName,
        symbol: tokenSymbol,
        mint: result.mint,
        tokenAccount: result.tokenAccount,
        metadata: result.metadata,
        txSignature: result.txSignature,
        createdAt: new Date().toISOString(),
      };

      // Revoke freeze authority if requested
      if (revokeFreezeAfterCreation) {
        console.log("\nRevoking freeze authority...");
        try {
          const revokeResult = await revokeFreezeAuthority({
            connection,
            payer,
            name: tokenName,
            symbol: tokenSymbol,
            uniqueKey: uniqueKey,
          });

          if (revokeResult.success) {
            console.log("\n✅ Freeze authority revoked successfully!");
            console.log(`Transaction: ${revokeResult.txSignature}`);
            console.log(
              `Explorer URL: https://explorer.solana.com/tx/${revokeResult.txSignature}?cluster=${cluster}`
            );
          } else {
            console.error(
              "\n❌ Error revoking freeze authority:",
              revokeResult.error
            );
            if (revokeResult.details) {
              console.error("Details:", revokeResult.details);
            }
          }
        } catch (error) {
          console.error("\n❌ Error revoking freeze authority:", error);
        }
      } else if (!revokeFreezeAfterCreation) {
        // Ask if they want to revoke freeze authority (only if not automatically revoked)
        await askToRevokeFreezeAuthority(
          connection,
          payer,
          tokenName,
          tokenSymbol,
          uniqueKey,
          cluster
        );
      }
    } else {
      console.error("\n❌ Error creating token:", result.error);
      if (result.details) {
        console.error("Details:", result.details);
      }
      process.exit(1);
    }
  } catch (error) {
    console.error("Unexpected error:", error);
    process.exit(1);
  }
}

function askToRevokeFreezeAuthority(
  connection,
  payer,
  tokenName,
  tokenSymbol,
  uniqueKey,
  cluster
) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(
      "Do you want to revoke the freeze authority? (y/n): ",
      async (answer) => {
        rl.close();
        if (answer.toLowerCase() === "y") {
          console.log("\nRevoking freeze authority...");
          try {
            const result = await revokeFreezeAuthority({
              connection,
              payer,
              name: tokenName,
              symbol: tokenSymbol,
              uniqueKey: uniqueKey,
            });

            if (result.success) {
              console.log("\n✅ Freeze authority revoked successfully!");
              console.log(`Transaction: ${result.txSignature}`);
              console.log(
                `Explorer URL: https://explorer.solana.com/tx/${result.txSignature}?cluster=${cluster}`
              );
            } else {
              console.error(
                "\n❌ Error revoking freeze authority:",
                result.error
              );
              if (result.details) {
                console.error("Details:", result.details);
              }
            }
          } catch (error) {
            console.error("\n❌ Error revoking freeze authority:", error);
          }
        } else {
          console.log(
            "\nFreeze authority was not revoked. You can revoke it later if you wish."
          );
        }
        resolve();
      }
    );
  });
}
// Execute the main function
main();
