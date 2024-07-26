#!/bin/bash

# Find process IDs listening on port 8545 (anvil)
anvil=$(lsof -t -i:8545)

# Check if any Anvil PIDs were found
if [ -z "$anvil" ]; then
    echo "Anvil not running."
else
    # Kill the processes
    kill $anvil && echo "Terminated running Anvil process."
fi

# Find process IDs listening on port 2019 (caddy)
caddy_server=$(lsof -t -i:2019)

# Check if any Caddy PIDs were found
if [ -z "$caddy_server" ]; then
		echo "Caddy server not running."
else
		# Kill the processes
		caddy stop && echo "Terminated running Caddy server process."
fi
