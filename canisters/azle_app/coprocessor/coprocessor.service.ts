import { None, Null, Record, Some, StableBTreeMap, Variant, ic, nat, nat64 } from "azle";

import { EvmRpc, LogEntry } from "@bundly/ic-evm-rpc";

import { IntegrationService } from "../integration/integration.service";

const LogToProcess = Record({
  log: LogEntry,
  integrationId: nat,
  status: Variant({ Pending: Null, Processed: Null }),
});
type LogToProcess = typeof LogToProcess.tsType;

const logsToProcess = StableBTreeMap<nat, LogToProcess>(10);

export class CoprocessorService {
  private MAX_BLOCK_SPREAD: nat64 = 500n;

  constructor(private integrationService: IntegrationService) {}

  public async getLogs(integrationId: nat64) {
    const integration = this.integrationService.get(integrationId).Some;

    if (integration === undefined) {
      throw new Error("Integration not found");
    }

    const toBlock = integration.lastScrapedBlock + this.MAX_BLOCK_SPREAD;

    const getLogsArgs = {
      fromBlock: Some({ Number: integration.lastScrapedBlock }),
      toBlock: Some({ Number: toBlock }),
      addresses: integration.addresses,
      topics: integration.topics,
    };

    const getLogsResponse = await ic.call(EvmRpc.eth_getLogs, {
      args: [integration.service, None, getLogsArgs],
      cycles: 1_000_000_000n,
    });

    if (getLogsResponse.Consistent?.Ok) {
      const logs = getLogsResponse.Consistent.Ok;

      const filteredLogs = logs.filter((log) => {
        const blockNumber = log.blockNumber.Some;

        if (blockNumber !== undefined) {
          return log.blockNumber.Some !== integration.lastScrapedBlock;
        }

        // TODO: What happens if blockNumber is not present?
        return true;
      });

      if (filteredLogs.length > 0) {
        let maxBlock = integration.lastScrapedBlock;

        for (const log of filteredLogs) {
          const currentBlockNumber = log.blockNumber.Some;
          if (currentBlockNumber && currentBlockNumber > maxBlock) {
            maxBlock = currentBlockNumber;
          }
        }

        if (filteredLogs.length > 0) {
          this.saveLogsToProcess(filteredLogs, integrationId);
          this.integrationService.update(integrationId, { ...integration, lastScrapedBlock: maxBlock });
        }
      }
    }
  }

  public async getLatestBlock(integration: nat64) {
    const service = this.integrationService.get(integration).Some?.service;

    if (service === undefined) {
      throw new Error("Integration not found");
    }

    const result = await ic.call(EvmRpc.eth_getBlockByNumber, {
      args: [service, None, { Latest: null }],
      cycles: 1_000_000_000n,
    });

    if (result.Consistent) {
      if (result.Consistent.Ok) {
        return result.Consistent.Ok.number;
      }

      // TODO: Improve error handling
      throw new Error("Failed to get the latest block finalizaed block number");
    }

    throw new Error("RPC providers gave inconsistent results");
  }

  public saveLogsToProcess(logs: LogEntry[], integrationId: nat) {
    const nextId = logsToProcess.len() + 1n;
    logs.forEach((log) => {
      logsToProcess.insert(nextId, { log, integrationId, status: { Pending: null } });
    });
  }

  public async processPendingLogs() {
    const pendindLogs = logsToProcess.items().filter(([_, value]) => value.status.Pending !== null);

    pendindLogs.forEach(([key, value]) => {
      // TODO: Implement log processing
      console.log("Processing log", key);
      // logsToProcess.insert(key, { ...value, status: { Processed: null } });
    });
  }
}
