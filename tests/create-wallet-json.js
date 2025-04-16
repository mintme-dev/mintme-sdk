// Import required modules
const bs58 = require("bs58"); // For Base58 encoding/decoding
const fs = require("fs"); // For file system operations

// Replace this with your actual private key in Base58 format
const base58Key = "YOUR_PRIVATE_KEY_HERE";

// Decode the Base58-encoded private key to get the raw byte array
const secretKey = bs58.decode(base58Key);

// Convert the byte array to a regular array and write it to a JSON file
fs.writeFileSync("wallet.json", JSON.stringify(Array.from(secretKey)));

console.log("✅ wallet.json successfully created");
