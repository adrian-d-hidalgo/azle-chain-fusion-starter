#!/bin/bash

SEPOLIA_CONTRACTS_DIR="$PWD/networks/sepolia/contracts"

if [ -d "$SEPOLIA_CONTRACTS_DIR" ]; then
    rm -rf "$SEPOLIA_CONTRACTS_DIR"
fi

ln -s $PWD/contracts $SEPOLIA_CONTRACTS_DIR

export EVM_ADDRESS=$(dfx canister call chain_fusion get_evm_address | awk -F'"' '{print $2}')

cd $PWD/networks/sepolia

npx hardhat run ./scripts/deploy.ts --network sepolia
