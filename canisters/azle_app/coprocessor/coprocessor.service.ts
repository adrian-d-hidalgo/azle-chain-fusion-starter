import { None, Null, Record, Some, StableBTreeMap, Variant, ic, nat, nat64 } from "azle";

import { EvmRpc, LogEntry } from "@bundly/ic-evm-rpc";

import { IntegrationsService } from "../integrations/integrations.service";

const LogToProcess = Record({
  log: LogEntry,
  integrationId: nat,
  status: Variant({ Pending: Null, Processed: Null }),
});
type LogToProcess = typeof LogToProcess.tsType;

const logsToProcess = StableBTreeMap<nat, LogToProcess>(10);

export class CoprocessorService {
  private MAX_BLOCK_SPREAD: nat64 = 500n;

  constructor(private integrationsService: IntegrationsService) {}

  public async getLogs(integrationId: nat64) {
    const integration = this.integrationsService.get(integrationId).Some;

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

        console.log("Logs to process", filteredLogs.length);

        if (filteredLogs.length > 0) {
          this.saveLogsToProcess(filteredLogs, integrationId);
          this.integrationsService.update(integrationId, { ...integration, lastScrapedBlock: maxBlock });
        }
      }
    }
  }

  public saveLogsToProcess(logs: LogEntry[], integrationId: nat) {
    logs.forEach((log) => {
      const nextId = logsToProcess.len() + 1n;
      console.log("Saving logs to process", nextId);
      logsToProcess.insert(nextId, { log, integrationId, status: { Pending: null } });
    });
  }

  public async processPendingLogs() {
    const pendindLogs = logsToProcess.items().filter(([_, value]) => value.status.Pending !== undefined);

    pendindLogs.forEach(([key, value]) => {
      // TODO: Implement log processing
      console.log("Processing log", key);
      logsToProcess.insert(key, { ...value, status: { Processed: null } });
    });
  }
}
