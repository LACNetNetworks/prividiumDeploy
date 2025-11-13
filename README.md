# Prividium Deploy

Hardhat project for deploying smart contracts to the Prividium blockchain network. This project includes a Storage contract and deployment scripts with Keycloak authentication integration.

## Overview

This project deploys a simple Storage smart contract that allows storing and retrieving a uint256 value on the Prividium test network. The deployment process uses Keycloak for authentication.

## Prerequisites

- Node.js and npm
- Hardhat
- Access to Prividium test network
- Keycloak credentials

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file in the root directory with the following variables:

```
RPC_NODE_URL=<your-prividium-rpc-url>
USER_PRIVATE_KEY=<your-private-key>
KEYCLOAK_CLIENT_ID=<your-keycloak-client-id>
KEYCLOAK_CLIENT_SECRET=<your-keycloak-client-secret>
KEYCLOAK_USERNAME=<your-keycloak-username>
KEYCLOAK_PASSWORD=<your-keycloak-password>
PRIVATE_KEY=<deployment-private-key>
```

## Smart Contract

### Storage.sol

A simple storage contract with the following functionality:
- `store(uint256 num)`: Store a value and emit an event
- `retreive()`: Retrieve the stored value
- `getOwner()`: Get the contract owner address

## Deployment

### Deploy to Prividium Test Network

```bash
node scripts/deployContract.js
```

The deployment script:
1. Authenticates with Keycloak to obtain a bearer token
2. Configures the provider with the authentication header
3. Deploys the Storage contract
4. Returns the deployed contract address

### Deploy using Hardhat

```bash
node scripts/deployContract.js
```

## Networks

- **localhost**: Local development network (http://127.0.0.1:8545)
- **lnet_prividium_test**: Prividium test network (configured via environment variables)

## Project Structure

```
.
├── contracts/          # Smart contracts
│   └── Storage.sol    # Storage contract
├── scripts/           # Deployment scripts
│   └── deployContract.js
├── artifacts/         # Compiled contracts
├── hardhat.config.js  # Hardhat configuration
└── .env              # Environment variables (not committed)
```

## Development

### Compile Contracts

```bash
npx hardhat compile
```

### Run Hardhat Console

```bash
npx hardhat console --network lnet_prividium_test
```

## Security Notes

- Never commit your `.env` file or private keys to version control
- Keep your Keycloak credentials secure
- Use separate wallets for testing and production
