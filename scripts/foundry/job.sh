#!/bin/bash

# Define variables
PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
VALUE="0.01ether"

# Function to create a new job
create() {
  echo "Creating a new job with contract address: $CONTRACT_ADDRESS..."
  cast send "$CONTRACT_ADDRESS" "newJob()" --private-key="$PRIVATE_KEY" --value="$VALUE"
}

# Function to get the result of a job
getResult() {
  echo "Getting result for job ID: $JOB_ID with contract address: $CONTRACT_ADDRESS..."
  cast call "$CONTRACT_ADDRESS" "getResult(uint256)(string)" "$JOB_ID"
}

# Parse flags and arguments
while [[ "$#" -gt 0 ]]; do
  case $1 in
    --contract-address=*)
      CONTRACT_ADDRESS="${1#*=}"
      shift
      ;;
    --job-id=*)
      JOB_ID="${1#*=}"
      shift
      ;;
    create)
      COMMAND="create"
      shift
      ;;
    getResult)
      COMMAND="getResult"
      shift
      ;;
    *)
      echo "Unknown flag or command: $1"
      exit 1
      ;;
  esac
done

# Validate that the contract address is set
if [ -z "$CONTRACT_ADDRESS" ]; then
  echo "Error: --contract-address flag is required"
  exit 1
fi

# Execute the function based on the command
case "$COMMAND" in
  create)
    create
    ;;
  getResult)
    if [ -z "$JOB_ID" ]; then
      echo "Error: job_id is required for getResult"
      exit 1
    fi
    getResult "$JOB_ID"
    ;;
  *)
    echo "Invalid command. Use 'create' or 'getResult'."
    exit 1
    ;;
esac
