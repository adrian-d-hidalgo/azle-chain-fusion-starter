#!/bin/bash

# safe the chain_fusion canisters evm address
export EVM_ADDRESS=$(dfx canister call chain_fusion get_evm_address | awk -F'"' '{print $2}')
# deploy the contract passing the chain_fusion canisters evm address to receive the fees and create a couple of new jobs
forge script ./networks/foundry/scripts/Coprocessor.s.sol:MyScript --fork-url http://localhost:8545 --broadcast --sig "run(address)" $EVM_ADDRESS
