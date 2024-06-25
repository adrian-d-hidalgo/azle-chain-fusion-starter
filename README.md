# Azle [Chain Fusion](https://internetcomputer.org/chainfusion) Starter

![hero3](https://github.com/letmejustputthishere/chain-fusion-starter/assets/32162112/e787cf9c-0bfc-4ce3-8211-8df61cf06a0b)

## Get started

No matter what setup you pick from below, run `npm run start` from the project root to deploy the project. To understand the steps involved in deploying the project locally, examine the comments in `scripts/start.sh`. This script will

- start anvil
- start dfx
- deploy the EVM contract
- generate a number of jobs
- deploy the chain_fusion canister

If you want to check that the `azle_app` really processed the events, you can either look at the logs output by running `npm run start` – keep an eye open for the `Successfully ran job` message – or you can call the EVM contract to get the results of the jobs.
To do this, run `npm run job:result <job_id>` where `<job_id>` is the id of the job you want to get the result for. This should always return `"6765"` for processed jobs, which is the 20th fibonacci number, and `""` for unprocessed jobs.

If you want to create more jobs, simply run `npm run job:create`.

### In the cloud

TODO

### Locally manual setup

#### Install Azle

See Azle Book instructions: https://demergent-labs.github.io/azle/get_started.html#installation

#### Install Froundry

See Froundry Book: https://book.getfoundry.sh/getting-started/installation

#### Install Caddy

See Caddy Documentation: https://caddyserver.com/docs/install
