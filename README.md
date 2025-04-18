# MintMe SDK - Simplify Solana Token Creation 🚀

The MintMe SDK is a JavaScript library designed to simplify token creation on the Solana blockchain. It provides an easy-to-use API for developers looking to interact with the MintMe Smart Contract, enabling seamless token creation, metadata integration, and advanced features.

---

## Features 🌟

1. **Token Creation Made Easy**: Create SPL tokens with customizable parameters like name, symbol, decimals, and supply.
2. **Metadata Integration**: Automatically attach metadata to tokens using the Metaplex standard.
3. **Cross-Platform Support**: Works in both Node.js and browser environments.
4. **Secure Commission Handling**: Built-in mechanisms to ensure transparency and security in token creation.

---

## Installation 📦

Install the MintMe SDK via npm:

```bash
npm install mintme-sdk
```

---

## How to Use MintMe SDK 🛠️

### **1. Create a Token Using `create-token-simple.js`**

This script provides a straightforward way to create tokens with minimal configuration. It uses the `createTokenSimple()` function from the SDK.

Here’s how to run the script:

```bash
node tests/create-token-simple.js
```

**Example Code:**

partnerWallet = Your wallet.
partnerAmount = Your commission for the transaction.

```javascript
const { createTokenSimple } = require("mintme-sdk");

(async () => {
  try {
    const config = {
      tokenName: "MTM",
      tokenSymbol: "MTM",
      uniqueKey: Date.now().toString(),
      decimals: 9,
      initialSupply: 1000000000000000,
      uri: "https://ipfs.mintme.dev/metadata.json",
      revokeMint: true,
      revokeFreeze: true,
      partnerWallet: new PublicKey("_YOUR_WALLET_HERE_"),
      partnerAmount: 0.1,
      walletPath: "./wallet.json",
      connection: "https://api.devnet.solana.com",
      cluster: "devnet",
    };

    console.log("=== MINTING TOKEN ===");
    const result = await createTokenSimple(config);

    if (result.success) {
      console.log("=== TOKEN CREATED ===");
      console.log(
        `TX: https://explorer.solana.com/tx/${result.txSignature}?cluster=${config.cluster}`
      );
    } else {
      console.error("Error creating the token:", result.error);
    }
  } catch (error) {
    console.error("Fatal error:", error);
  }
})();
```

### Run this example code in Codesandbox.io 💡
You can run this code directly in Codesandbox.io in your own machine witouth cost.
- **Codesandbox.io Template Mintme Node Example**: [[codesandbox.io/p/devbox/template...](https://codesandbox.io/p/devbox/template-mintme-easy-node-example-hgpt49)](https://codesandbox.io/p/devbox/template-mintme-easy-node-example-hgpt49)

---

### **2. Token Creation Directly from the Terminal Using `create-token-terminal.js`**

This script allows you to create tokens directly from the terminal by passing specific parameters. It is ideal for developers who need more control over token creation.

**Usage:**

```bash
node tests/create-token-terminal.js --name "MINTME" --symbol "MTKN" --unique-key "VERSION_1"
```

**Example Command Line Options:**

- `--name` (required): Token name.
- `--symbol` (required): Token symbol.
- `--unique-key` (required): Unique identifier for the token.
- `--decimals`: Number of decimals (default: 9).
- `--supply`: Initial supply (default: 1,000,000,000).
- `--uri`: Metadata URI (default: `https://ipfs.mintme.dev/metadata.json`).
- `--revoke-mint`: Revoke mint authority.
- `--revoke-freeze`: Revoke freeze authority.

**Example Command:**

```bash
node tests/create-token-terminal.js --name "MINTME" --symbol "MTM" --decimals 6 --supply 1000000 --uri "https://ipfs.mintme.dev/metadata.json" --revoke-mint --revoke-freeze --endpoint "https://api.devnet.solana.com" --unique-key "VERSION_1"
```

This script provides detailed logs of the token creation process, including transaction details and URLs for Solana Explorer.

---

### **3. Create a Wallet Using `create-wallet-json.js`**

Before creating tokens, you’ll need a wallet file (`wallet.json`). Use the `create-wallet-json.js` script to generate one from a private key.

**Steps:**

1. Replace the placeholder `YOUR_PRIVATE_KEY_HERE` in the script with your Base58-encoded private key.
2. Run the script:

   ```bash
   node tests/create-wallet-json.js
   ```

3. This will generate a `wallet.json` file with your wallet’s secret key.

**Example Code:**

```javascript
const bs58 = require("bs58");
const fs = require("fs");

const base58Key = "YOUR_PRIVATE_KEY_HERE";
const secretKey = bs58.decode(base58Key);

fs.writeFileSync("wallet.json", JSON.stringify(Array.from(secretKey)));

console.log("✅ wallet.json successfully created");
```

---

## Example Scripts 📜

The project includes example scripts to help you get started quickly:

1. **Simple Token Creation (`create-token-simple.js`)**:

   - Automatically creates a token with predefined parameters.

2. **Terminal-Based Creation (`create-token-terminal.js`)**:

   - Allows token creation directly from the terminal with customizable options.

3. **Wallet Creation (`create-wallet-json.js`)**:
   - Generates a `wallet.json` file from a private key.

---

## Support 🤝

Need help? Join our community or check out our documentation:

- **Website**: [mintme.dev](https://mintme.dev)
- **Issues**: Report bugs or request features on [GitHub](https://github.com/mintme-dev/mintme-sdk/issues)

---

## License ⚖️

This project is licensed under the MIT License. See the `LICENSE` file for more details.

---

Start building with MintMe SDK today and unleash the power of Solana! 🚀
