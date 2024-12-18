# Junkcoin Wallet Finder

A tool to find Junkcoin private keys from mnemonic phrases. Supports multiple derivation paths and generates addresses starting with '7' and private keys starting with 'N'.

## Quick Start

1. Install dependencies:
```bash
npm run install-deps
```

2. Start the server:
```bash
PORT=3001 npm start
```

3. Open http://localhost:3001 in your browser

## Features

- Supports BIP39 mnemonic phrases
- Generates Junkcoin-compatible addresses (prefix: '7')
- Returns private keys in WIF format (prefix: 'N')
- Tries multiple derivation paths:
  - BIP44 (m/44'/0'/0'/0/x)
  - BIP44 no change (m/44'/0'/0'/x)
  - Legacy (m/0'/0'/x)
  - Basic (m/0/x)
  - Master key

## API Usage

POST to `/find-key` with:
```json
{
    "mnemonic": "your twelve word mnemonic phrase here",
    "targetAddress": "7xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
}
```

Response:
```json
{
    "found": true,
    "privateKey": "Nxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "path": "m/44'/0'/0'/0/0",
    "type": "p2pkh",
    "address": "7xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
}
```

## Documentation

See [DOCUMENTATION.md](./DOCUMENTATION.md) for detailed implementation details and API documentation.

## Requirements

- Node.js >= 14.0.0
- NPM

## Security Notice

This tool is for development and testing purposes. Never enter production mnemonic phrases on development tools.
