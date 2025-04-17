/**
 * Utilities for handling IDL (Interface Description Language)
 */

const fs = require("fs");
const path = require("path");
const constants = require("../constants");

/**
 * Loads the IDL from a URL, an object, a file, or uses the default IDL
 * @param {string|Object|null} idlSource - IDL URL, IDL object, file path, or null to use the default
 * @returns {Promise<Object>} - The loaded IDL
 */
function loadIDL(idlSource) {
  // If no IDL is provided, try to load from the default file
  if (!idlSource) {
    if (fs && path) {
      try {
        const defaultPath = path.resolve(constants.DEFAULT_IDL_PATH);
        if (fs.existsSync(defaultPath)) {
          return Promise.resolve(
            JSON.parse(fs.readFileSync(defaultPath, "utf-8"))
          );
        }
      } catch (error) {
        console.warn("Error loading IDL from default file:", error);
      }
    }
    // If it can't be loaded from the file, use a basic embedded IDL
    return Promise.resolve({
      version: "0.1.0",
      name: "token_creator",
      instructions: [
        {
          name: "createToken",
          accounts: [
            { name: "payer", isMut: true, isSigner: true },
            { name: "mint", isMut: true, isSigner: false },
            { name: "tokenAccount", isMut: true, isSigner: false },
            { name: "metadata", isMut: true, isSigner: false },
            { name: "tokenPda", isMut: true, isSigner: false },
            { name: "tokenProgram", isMut: false, isSigner: false },
            { name: "metadataProgram", isMut: false, isSigner: false },
            { name: "systemProgram", isMut: false, isSigner: false },
            { name: "rent", isMut: false, isSigner: false },
            {
              name: "associatedTokenProgram",
              isMut: false,
              isSigner: false,
            },
          ],
          args: [
            { name: "name", type: "string" },
            { name: "symbol", type: "string" },
            { name: "uniqueKey", type: "string" },
            { name: "decimals", type: "u8" },
            { name: "initialSupply", type: "u64" },
            { name: "uri", type: "string" },
            { name: "revokeMint", type: "bool" },
            { name: "revokeFreeze", type: "bool" },
            { name: "partnerWallet", type: "publicKey" },
            { name: "partnerAmount", type: "u64" },
          ],
        },
        {
          name: "revokeFreezeAuthority",
          accounts: [
            { name: "payer", isMut: true, isSigner: true },
            { name: "mint", isMut: true, isSigner: false },
            { name: "tokenProgram", isMut: false, isSigner: false },
            { name: "systemProgram", isMut: false, isSigner: false },
          ],
          args: [
            { name: "name", type: "string" },
            { name: "symbol", type: "string" },
            { name: "uniqueKey", type: "string" },
          ],
        },
      ],
      errors: [
        {
          code: 6000,
          name: "NoFreezeAuthority",
          msg: "The mint has no freeze authority",
        },
      ],
    });
  }

  // If it's an object, use it directly
  if (typeof idlSource === "object") {
    return Promise.resolve(idlSource);
  }

  // If it's a string, it could be a URL or a file path
  if (typeof idlSource === "string") {
    // First try to load as a file if we're in Node.js
    if (fs && path) {
      try {
        const resolvedPath = path.resolve(idlSource);
        if (fs.existsSync(resolvedPath)) {
          return Promise.resolve(
            JSON.parse(fs.readFileSync(resolvedPath, "utf-8"))
          );
        }
      } catch (error) {
        console.warn("Error loading IDL from file:", error);
      }
    }

    // If it couldn't be loaded as a file or we're not in Node.js, try as a URL
    if (typeof fetch === "undefined") {
      return Promise.reject(
        new Error(
          "fetch is not available in this environment. Please use a fetch polyfill."
        )
      );
    }
    return fetch(idlSource)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Error loading IDL: " + response.statusText);
        }
        return response.json();
      })
      .catch((error) => {
        console.error("Error loading IDL from URL:", error);
        throw error;
      });
  }

  // If we get here, the idlSource type is not valid
  return Promise.reject(new Error("Invalid IDL source type"));
}

module.exports = {
  loadIDL,
};
