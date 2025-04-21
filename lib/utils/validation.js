/**
 * Utility functions for validating token creation parameters
 * @module validation-utils
 */

/**
 * Validates token name
 * @param {string} name - Token name
 * @returns {Object} - Validation result with isValid and message properties
 */
function validateTokenName(name) {
	if (!name || typeof name !== "string") {
	  return { isValid: false, message: "Token name is required and must be a string" }
	}
  
	if (name.length > 32) {
	  return { isValid: false, message: "Token name must be 32 characters or less" }
	}
  
	// Check for invalid characters
	const invalidCharsRegex = /[^\w\s\-.]/
	if (invalidCharsRegex.test(name)) {
	  return {
		isValid: false,
		message: "Token name contains invalid characters. Use only letters, numbers, spaces, hyphens, and periods",
	  }
	}
  
	return { isValid: true }
  }
  
  /**
   * Validates token symbol
   * @param {string} symbol - Token symbol
   * @returns {Object} - Validation result with isValid and message properties
   */
  function validateTokenSymbol(symbol) {
	if (!symbol || typeof symbol !== "string") {
	  return { isValid: false, message: "Token symbol is required and must be a string" }
	}
  
	if (symbol.length > 10) {
	  return { isValid: false, message: "Token symbol must be 10 characters or less" }
	}
  
	// Check for invalid characters (only allow uppercase letters, numbers)
	const validSymbolRegex = /^[A-Z0-9]+$/
	if (!validSymbolRegex.test(symbol)) {
	  return { isValid: false, message: "Token symbol must contain only uppercase letters and numbers" }
	}
  
	return { isValid: true }
  }
  
  /**
   * Validates token decimals
   * @param {number} decimals - Token decimals
   * @returns {Object} - Validation result with isValid and message properties
   */
  function validateDecimals(decimals) {
	if (typeof decimals !== "number") {
	  return { isValid: false, message: "Decimals must be a number" }
	}
  
	if (decimals < 0 || decimals > 9) {
	  return { isValid: false, message: "Decimals must be between 0 and 9" }
	}
  
	if (!Number.isInteger(decimals)) {
	  return { isValid: false, message: "Decimals must be an integer" }
	}
  
	return { isValid: true }
  }
  
  // Modificar la función validateInitialSupply para que devuelva también el valor máximo
  function validateInitialSupply(initialSupply) {
	let supply
  
	// Define el valor máximo para tokens de Solana (2^64 - 1)
	const MAX_SUPPLY = 18446744073709551615n
  
	// Convert to number if it's a string
	if (typeof initialSupply === "string") {
	  if (!/^\d+$/.test(initialSupply)) {
		return {
		  isValid: false,
		  message: "Initial supply must contain only digits",
		  maxSupply: MAX_SUPPLY.toString(),
		}
	  }
	  supply = Number(initialSupply)
	} else if (typeof initialSupply === "number") {
	  supply = initialSupply
	} else {
	  return {
		isValid: false,
		message: "Initial supply must be a number or numeric string",
		maxSupply: MAX_SUPPLY.toString(),
	  }
	}
  
	if (supply <= 0) {
	  return {
		isValid: false,
		message: "Initial supply must be greater than 0",
		maxSupply: MAX_SUPPLY.toString(),
	  }
	}
  
	// Check if supply is too large
	if (BigInt(supply) > MAX_SUPPLY) {
	  return {
		isValid: false,
		message: `Initial supply must not exceed ${MAX_SUPPLY.toString()}`,
		maxSupply: MAX_SUPPLY.toString(),
	  }
	}
  
	return {
	  isValid: true,
	  maxSupply: MAX_SUPPLY.toString(),
	}
  }
  
  /**
   * Validates URI (metadata URL)
   * @param {string} uri - Metadata URI
   * @returns {Object} - Validation result with isValid and message properties
   */
  function validateUri(uri) {
	if (!uri || typeof uri !== "string") {
	  return { isValid: false, message: "Metadata URI is required and must be a string" }
	}
  
	try {
	  new URL(uri)
	} catch (error) {
	  return { isValid: false, message: "Metadata URI must be a valid URL" }
	}
  
	// Check if it's HTTPS (recommended for metadata)
	if (!uri.startsWith("https://")) {
	  return { isValid: false, message: "Metadata URI should use HTTPS protocol for security" }
	}
  
	return { isValid: true }
  }
  
  /**
   * Validates a Solana public key
   * @param {string|Object} publicKey - Public key as string or PublicKey object
   * @returns {Object} - Validation result with isValid and message properties
   */
  function validatePublicKey(publicKey) {
	if (!publicKey) {
	  return { isValid: false, message: "Public key is required" }
	}
  
	// If it's already a PublicKey object
	if (typeof publicKey === "object" && publicKey.constructor && publicKey.constructor.name === "PublicKey") {
	  return { isValid: true }
	}
  
	// If it's a string, validate the format
	if (typeof publicKey === "string") {
	  // Solana addresses are base58 encoded and 32-44 characters long
	  const validKeyRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/
	  if (!validKeyRegex.test(publicKey)) {
		return { isValid: false, message: "Invalid Solana public key format" }
	  }
  
	  return { isValid: true }
	}
  
	return { isValid: false, message: "Public key must be a string or PublicKey object" }
  }
  
  /**
   * Validates all token creation parameters
   * @param {Object} options - Token creation options
   * @returns {Object} - Validation result with isValid and errors properties
   */
  function validateTokenCreationParams(options) {
	const errors = []
	let maxSupply = ""
  
	// Validate name
	const nameValidation = validateTokenName(options.name)
	if (!nameValidation.isValid) {
	  errors.push(nameValidation.message)
	}
  
	// Validate symbol
	const symbolValidation = validateTokenSymbol(options.symbol)
	if (!symbolValidation.isValid) {
	  errors.push(symbolValidation.message)
	}
  
	// Validate decimals
	const decimalsValidation = validateDecimals(options.decimals)
	if (!decimalsValidation.isValid) {
	  errors.push(decimalsValidation.message)
	}
  
	// Validate initial supply
	const supplyValidation = validateInitialSupply(options.initialSupply)
	if (!supplyValidation.isValid) {
	  errors.push(supplyValidation.message)
	}
	// Guardar el valor máximo de suministro
	maxSupply = supplyValidation.maxSupply
  
	// Validate URI if provided
	if (options.uri) {
	  const uriValidation = validateUri(options.uri)
	  if (!uriValidation.isValid) {
		errors.push(uriValidation.message)
	  }
	}
  
	// Validate partner wallet if provided
	if (options.partnerWallet) {
	  const walletValidation = validatePublicKey(options.partnerWallet)
	  if (!walletValidation.isValid) {
		errors.push(`Partner wallet: ${walletValidation.message}`)
	  }
	}
  
	return {
	  isValid: errors.length === 0,
	  errors: errors,
	  maxSupply: maxSupply,
	}
  }
  
  module.exports = {
	validateTokenName,
	validateTokenSymbol,
	validateDecimals,
	validateInitialSupply,
	validateUri,
	validatePublicKey,
	validateTokenCreationParams,
  }
  