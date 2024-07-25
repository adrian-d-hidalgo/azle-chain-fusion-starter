#!/bin/bash

# Find process IDs listening on port 8545 (anvil)
anvil=$(lsof -t -i:8545)

# Check if any Anvil PIDs were found
if [ -z "$anvil" ]; then
    anvil --slots-in-an-epoch 1 &
else
    echo "Anvil already running."
fi

# Find process IDs listening on port 8545 (caddy)
caddy_server=$(lsof -t -i:2019)

# Check if any Caddy PIDs were found
if [ -z "$caddy_server" ]; then
		caddy start
else
		echo "Caddy server already running."
fi
