const express = require('express');
const bodyParser = require('body-parser');
const bip39 = require('bip39');
const bitcoin = require('bitcoinjs-lib');
const ecc = require('tiny-secp256k1');
const { BIP32Factory } = require('bip32');
const { ECPairFactory } = require('ecpair');

const ECPair = ECPairFactory(ecc);
const bip32 = BIP32Factory(ecc);

const app = express();
app.use(bodyParser.json());

// Junkcoin network parameters from junkcoinjs-lib
const junkcoinNetwork = {
    messagePrefix: 'Junkcoin Signed Message:\n',
    bech32: 'junk',
    bip32: {
        public: 0x0488B21E,
        private: 0x0488ADE4,
    },
    pubKeyHash: 16,
    scriptHash: 5,
    wif: 144,
};

// Serve static HTML
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Generate P2PKH address for Junkcoin
function generateP2PKHAddress(publicKey, network) {
    const { address } = bitcoin.payments.p2pkh({
        pubkey: publicKey,
        network: network
    });
    return address;
}

// Try to find address in a derivation path
async function tryDerivationPath(root, basePath, targetAddress) {
    try {
        const baseNode = basePath ? root.derivePath(basePath) : root;
        
        // Try first 50 addresses
        for (let i = 0; i < 50; i++) {
            let child;
            try {
                // For paths ending in /0, derive the index
                // For other paths, append /0/index
                child = basePath.endsWith("/0") ? 
                       baseNode.derive(i) : 
                       baseNode.derive(0).derive(i);
            } catch (e) {
                continue; // Skip if derivation fails
            }

            const address = generateP2PKHAddress(child.publicKey, junkcoinNetwork);
            console.log(`Trying ${basePath}/${i}: ${address}`);

            if (address === targetAddress) {
                // Create ECPair from private key
                const keyPair = ECPair.fromPrivateKey(child.privateKey, { 
                    network: junkcoinNetwork,
                    compressed: true
                });
                
                return {
                    found: true,
                    privateKey: keyPair.toWIF(),
                    path: `${basePath}/${i}`,
                    type: 'p2pkh',
                    address: address
                };
            }
        }
    } catch (e) {
        console.log(`Skipping path ${basePath}: ${e.message}`);
    }
    return null;
}

// Find private key from mnemonic and address
app.post('/find-key', async (req, res) => {
    try {
        const { mnemonic, targetAddress } = req.body;

        if (!mnemonic || !targetAddress) {
            return res.status(400).json({ 
                error: 'Both mnemonic and target address are required' 
            });
        }

        // Validate mnemonic
        if (!bip39.validateMnemonic(mnemonic)) {
            return res.status(400).json({ 
                error: 'Invalid mnemonic phrase' 
            });
        }

        // Convert mnemonic to seed
        const seed = await bip39.mnemonicToSeed(mnemonic);
        const root = bip32.fromSeed(seed, junkcoinNetwork);

        // Try different derivation paths
        const paths = [
            "m/44'/0'/0'/0",  // BIP44
            "m/44'/0'/0'",    // BIP44 no change
            "m/0'/0'",        // Legacy
            "m/0"             // Basic path
        ];

        // Also try the master key directly
        const masterAddress = generateP2PKHAddress(root.publicKey, junkcoinNetwork);
        console.log(`Trying master key: ${masterAddress}`);
        if (masterAddress === targetAddress) {
            const keyPair = ECPair.fromPrivateKey(root.privateKey, { 
                network: junkcoinNetwork,
                compressed: true
            });
            return res.json({
                found: true,
                privateKey: keyPair.toWIF(),
                path: "m",
                type: 'p2pkh',
                address: masterAddress
            });
        }

        // Try each derivation path
        for (const path of paths) {
            const result = await tryDerivationPath(root, path, targetAddress);
            if (result) {
                return res.json(result);
            }
        }

        // If no match found
        res.json({
            found: false,
            message: "Address not found in common derivation paths"
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Network parameters:', junkcoinNetwork);
});
