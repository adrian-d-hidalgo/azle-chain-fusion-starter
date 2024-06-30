# Azle [Chain Fusion](https://internetcomputer.org/chainfusion) Starter

![hero3](https://github.com/letmejustputthishere/chain-fusion-starter/assets/32162112/e787cf9c-0bfc-4ce3-8211-8df61cf06a0b)

## Table of content

- [Overview](#overview)
  - [What is a Coprocessor?](#what-is-a-coprocessor)
  - [Why Use ICP as a Coprocessor for Ethereum?](#why-use-icp-as-a-coprocessor-for-ethereum)
- [Getting started](#getting-started)
  - [In the Cloud](#in-the-cloud)
  - [Locally](#locally)
  - [Manual Setup](#manual-setup)
- [Architecture](#architecture)
- [Development](#development)

## Get started

No matter what setup you pick from below, run `npm run start` from the project root to deploy the project. To understand the steps involved in deploying the project locally, examine the comments in `scripts/start.sh`. This script will

- start anvil
- start dfx
- deploy the EVM contract
- generate a number of jobs
- deploy the chain_fusion

### Set an Event listener

**Endpoint**

POST /events

**Body**

```json
{
  "service": {
    "type": "custom",
    "chainId": 31337,
    "services": [
      {
        "url": "https://localhost:8546"
      }
    ]
  },
  "events": {
    "topics": [["0x031ada964b8e520743eb9508d0ace62654b126430b7e5a92b42e78eebb61602e"]],
    "addresses": ["0x5FbDB2315678afecb367f032d93F642f64180aa3"]
  }
}
```

If you want to check that the `coprocessor_canister` really processed the events, you can either look at the logs output by running `npm run start` – keep an eye open for the `Successfully ran job` message – or you can call the EVM contract to get the results of the jobs.
To do this, run `npm run job:result <job_id>` where `<job_id>` is the id of the job you want to get the result for. This should always return `"6765"` for processed jobs, which is the 20th fibonacci number, and `""` for unprocessed jobs.

If you want to create more jobs, simply run `npm run job:create`.

### In the cloud

TODO

### Locally

Ensure Docker and VS Code are installed and running, then click the button below:

TODO

### Manual setup

Ensure the following are installed on your system:

- [Node.js](https://nodejs.org/en/) `>= 21`
- [Foundry](https://github.com/foundry-rs/foundry)
- [Caddy](https://caddyserver.com/docs/install#install)
- [DFX](https://internetcomputer.org/docs/current/developer-docs/build/install-upgrade-remove) `>= 0.18`
- [Azle dependencies](https://demergent-labs.github.io/azle/get_started.html)

Run these commands in a new, empty project directory:

```sh
git clone https://github.com/adrian-d-hidalgo/azle-chain-fusion-starter.git
cd azle-chain-fusion-starter
```

## Architecture

This starter project involves multiple canisters working together to process events emitted by EVM smart contracts. The main canisters are:

- **EVM Smart Contract**: Emits events such as `NewJob` when specific functions are called. It also handles callbacks from the `chain_fusion` canister with the results of the processed jobs.
- **Chain Fusion Canister (`chain_fusion`)**: Listens to events emitted by the EVM smart contract, processes them, and sends the results back to the EVM smart contract.
- **EVM RPC Canister**: Facilitates communication between the Internet Computer and EVM-based blockchains by making RPC calls to interact with the EVM smart contract.

The full flow of how these canisters interact can be found in the following sequence diagram:

<p align="center">
<img src="https://github.com/letmejustputthishere/chain-fusion-starter/assets/32162112/22272844-016c-43a0-a087-a861e930726c" height="600">
</p>

### EVM Smart Contract

The `contracts/Coprocessor.sol` contract emits a `NewJob` event when the `newJob` function is called, transferring ETH to the `chain_fusion` canister to pay it for job processing and transaction fees (this step is optional and can be customized to fit your use case).

```solidity
// Function to create a new job
function newJob() public payable {
    // Require at least 0.01 ETH to be sent with the call
    require(msg.value >= 0.01 ether, "Minimum 0.01 ETH not met");

    // Forward the ETH received to the coprocessor address
    // to pay for the submission of the job result back to the EVM
    // contract.
    coprocessor.transfer(msg.value);

    // Emit the new job event
    emit NewJob(job_id);

    // Increment job counter
    job_id++;
}
```

The `callback` function writes processed results back to the contract:

```solidity
function callback(string calldata _result, uint256 _job_id) public {
    require(
        msg.sender == coprocessor,
        "Only the coprocessor can call this function"
    );
    jobs[_job_id] = _result;
}
```

For local deployment, see the `scripts/deploy.sh` script and `scripts/Coprocessor.s.sol`.

### Chain Fusion Canister

The `coprocessor_canister` canister listens to `NewJob` events by periodically calling the `eth_getLogs` RPC method via the [EVM RPC canister](https://github.com/internet-computer-protocol/evm-rpc-canister). Upon receiving an event, it processes the job and sends the results back to the EVM smart contract via the EVM RPC canister, signing the transaction with threshold ECDSA.

The Job processing logic is in `canisters/coprocessor_canister/services/job.service.ts`:

```typescript
private async process(event: Event, jobId: bigint): Promise<string> {
  // this calculation would likely exceed an ethereum blocks gas limit
  // but can easily be calculated on the IC
  const result = this.fibonacci(20);
  const service = new EtherRpcService(event.service);
  const coprocessor = new CoprocessorService(service, event.addresses);
  return coprocessor.callback(result.toString(), jobId);
}
```

## Development

All coprocessing logic resides in `canisters/coprocessor_canister/services/job.service.ts`. Developers can focus on writing jobs to process EVM smart contract events without altering the code for fetching events or sending transactions.

### Interacting with the EVM Smart Contract

If you want to check that the `coprosessor_canister` canister really processed the events, you can either look at the logs output by running `./scripts/deploy.sh` – keep an eye open for the `Successfully ran job` message – or you can call the EVM contract to get the results of the jobs. To do this, run:

```sh
npm run job:result --job-id=<job_id>
```

where `<job_id>` is the ID of the job you want to get the result for. This should always return `"6765"` for processed jobs, which is the 20th Fibonacci number, and `""` for unprocessed jobs.

If you want to create more jobs, simply run:

```sh
npm run job:create
```

Note that the Chain Fusion Canister only scrapes logs every 3 minutes, so you may need to wait a few minutes before seeing the new job processed.
