#!/bin/bash

# Define variables
CONTRACT_ADDRESS="0x5fbdb2315678afecb367f032d93f642f64180aa3"
PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
VALUE="0.01ether"

# Function to create a new job
create() {
  echo "Creating a new job..."
  cast send "$CONTRACT_ADDRESS" "newJob()" --private-key="$PRIVATE_KEY" --value="$VALUE"
}

# Function to get the result of a job
getResult() {
  JOB_ID="$1"
  echo "Getting result for job ID: $JOB_ID..."
  cast call "$CONTRACT_ADDRESS" "getResult(uint256)(string)" "$JOB_ID"
}

# Check if the script has received arguments
if [ "$#" -lt 1 ]; then
  echo "Usage: $0 {create|getResult} [arguments...]"
  exit 1
fi

# Execute the function based on the first argument
case "$1" in
  create)
    create
    ;;
  getResult)
    if [ "$#" -ne 2 ]; then
      echo "Usage: $0 getResult <job_id>"
      exit 1
    fi
    getResult "$2"
    ;;
  *)
    echo "Invalid command. Use 'create' or 'getResult'."
    exit 1
    ;;
esac
