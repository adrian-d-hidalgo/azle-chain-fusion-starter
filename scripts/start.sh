#!/bin/bash

# Find process IDs listening on port 8545 (anvil)
anvil=$(lsof -t -i:8545)

# Check if any PIDs were found
if [ -z "$anvil" ]; then
    echo "Anvil not running."
else
    # Kill the processes
    kill $anvil && echo "Terminated running Anvil process."
    sleep 3
fi

# start anvil with slots in an epoch send to 1 for faster finalised blocks
anvil --slots-in-an-epoch 1 &
# kill caddyserver
caddy stop
# start caddyserver
caddy start
dfx stop
# Find process IDs listening on port 4943 (dfx)
dfx=$(lsof -t -i:4943)
# Check if any PIDs were found
if [ -z "$dfx" ]; then
    echo "dfx not running."
else
    # Kill the processes
    kill $dfx && echo "Terminating running dfx instance."
    sleep 3
fi
dfx start --clean --background
dfx ledger fabricate-cycles --icp 10000 --canister $(dfx identity get-wallet)
dfx deploy evm_rpc
dfx deploy --with-cycles 10_000_000_000_000 azle_app
# sleep for 3 seconds to allow the evm address to be generated
sleep 3
# safe the chain_fusion canisters evm address
dfx canister call azle_app set_app_config
export EVM_ADDRESS=$(dfx canister call azle_app get_evm_address | awk -F'"' '{print $2}')
echo "EVM_ADDRESS=$EVM_ADDRESS"
# deploy the contract passing the chain_fusion canisters evm address to receive the fees and create a couple of new jobs
forge script ./scripts/Coprocessor.s.sol:MyScript --fork-url http://localhost:8545 --broadcast --sig "run(address)" $EVM_ADDRESS
