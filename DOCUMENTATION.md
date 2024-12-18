# Junkcoin Wallet Finder Implementation Documentation

## Overview
The Junkcoin Wallet Finder is a Node.js application that helps find private keys from a mnemonic phrase by trying different derivation paths. It supports Junkcoin's network parameters and generates addresses starting with '7' and private keys starting with 'N'.

## Network Parameters
The Junkcoin network parameters are taken from junkcoinjs-lib:
```javascript
const junkcoinNetwork = {
    messagePrefix: 'Junkcoin Signed Message:\n',
    bech32: 'junk',
    bip32: {
        public: 0x0488B21E,
        private: 0x0488ADE4,
    },
    pubKeyHash: 16,    // This makes addresses start with '7'
    scriptHash: 5,
    wif: 144,          // This makes private keys start with 'N'
};
```

## Dependencies
Required npm packages:
```json
{
    "express": "For HTTP server",
    "body-parser": "For parsing JSON requests",
    "bip39": "For mnemonic handling",
    "bitcoinjs-lib": "For Bitcoin/Junkcoin operations",
    "tiny-secp256k1": "For cryptographic operations",
    "bip32": "For HD wallet derivation",
    "ecpair": "For key pair handling"
}
```

## Installation
1. Create project directory:
```bash
mkdir junkwallet-finder
cd junkwallet-finder
```

2. Initialize npm project:
```bash
npm init -y
```

3. Install dependencies:
```bash
npm install express body-parser bip39 bitcoinjs-lib tiny-secp256k1 bip32 ecpair
```

## Code Structure

### 1. Imports and Setup
```javascript
const express = require('express');
const bodyParser = require('body-parser');
const bip39 = require('bip39');
const bitcoin = require('bitcoinjs-lib');
const ecc = require('tiny-secp256k1');
const { BIP32Factory } = require('bip32');
const { ECPairFactory } = require('ecpair');

const ECPair = ECPairFactory(ecc);
const bip32 = BIP32Factory(ecc);
```

### 2. Address Generation
The P2PKH address generation function ensures addresses start with '7':
```javascript
function generateP2PKHAddress(publicKey, network) {
    const { address } = bitcoin.payments.p2pkh({
        pubkey: publicKey,
        network: network
    });
    return address;
}
```

### 3. Derivation Paths
The application tries multiple derivation paths to find the correct address:
```javascript
const paths = [
    "m/44'/0'/0'/0",  // BIP44
    "m/44'/0'/0'",    // BIP44 no change
    "m/0'/0'",        // Legacy
    "m/0"             // Basic path
];
```

### 4. Key Features

#### Master Key Check
- Checks if the address was generated from the master key directly
- Uses root.publicKey for address generation
- Converts private key to WIF format with correct network parameters

#### Path Derivation
- Tries each derivation path systematically
- Generates up to 50 addresses per path
- Supports both change and non-change addresses
- Handles derivation errors gracefully

#### WIF Private Key Generation
- Uses ECPair to generate WIF format private keys
- Ensures private keys start with 'N' using network.wif = 144
- Uses compressed public keys by default

## Usage

1. Start the server:
```bash
PORT=3001 npm start
```

2. Send POST request to /find-key with:
```json
{
    "mnemonic": "your twelve word mnemonic phrase here",
    "targetAddress": "7xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
}
```

3. Response format:
```json
{
    "found": true,
    "privateKey": "Nxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "path": "m/44'/0'/0'/0/0",
    "type": "p2pkh",
    "address": "7xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
}
```

## Error Handling
- Validates mnemonic phrase
- Checks for required parameters
- Handles derivation path errors
- Returns appropriate error messages

## Network Compatibility
The implementation is specifically tailored for Junkcoin with:
- Address prefix: '7' (pubKeyHash: 16)
- Private key prefix: 'N' (wif: 144)
- BIP32 parameters from chainparams.cpp
