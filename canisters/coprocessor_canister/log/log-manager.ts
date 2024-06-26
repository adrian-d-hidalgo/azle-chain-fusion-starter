import { Null, Record, StableBTreeMap, Variant, nat, nat64 } from "azle";
import { getUint } from "ethers";

import { LogEntry } from "@bundly/ic-evm-rpc";

import { ConnectionService } from "../connection/connection.service";
import { CoprocessorService } from "../coprocessor/coprocessor.service";
import { EtherRpcService } from "../ether/ether-rpc.service";
import { fibonacci } from "../helpers";

const LogToProcess = Record({
  log: LogEntry,
  contractId: nat,
  status: Variant({ Pending: Null, Processed: Null }),
});
type LogToProcess = typeof LogToProcess.tsType;

const logsToProcess = StableBTreeMap<nat, LogToProcess>(10);

export class LogManager {
  constructor(private connectionService: ConnectionService) {}

  public async getLogs(contractId: nat64) {
    const integration = this.connectionService.get(contractId).Some;

    if (integration === undefined) {
      throw new Error("Integration not found");
    }

    const service = new EtherRpcService(integration.service);

    const coprocessor = new CoprocessorService(service, integration.addresses);

    const getLogsArgs = {
      fromBlock: integration.lastScrapedBlock,
      toBlock: integration.lastScrapedBlock + CoprocessorService.MAX_BLOCK_SPREAD,
      addresses: integration.addresses,
      topics: integration.topics.Some || [],
    };

    const getLogsResponse = await coprocessor.getLogs(getLogsArgs);

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
          this.saveLogs(filteredLogs, contractId);
          this.connectionService.update(contractId, { ...integration, lastScrapedBlock: maxBlock });
        }
      }
    }
  }

  private saveLogs(logs: LogEntry[], contractId: nat) {
    logs.forEach((log) => {
      const nextId = logsToProcess.len() + 1n;
      logsToProcess.insert(nextId, { log, contractId, status: { Pending: null } });
    });
  }

  public async processLogs() {
    const pendingLogs = logsToProcess.items().filter(([_, value]) => value.status.Pending !== undefined);

    for (const [key, value] of pendingLogs) {
      const connection = this.connectionService.get(value.contractId).Some;

      if (connection === undefined) {
        throw new Error("Connection not found");
      }

      const result = fibonacci(20);
      // Topic 1 is the jobId
      const jobId = getUint(value.log.topics[1]);

      try {
        const service = new EtherRpcService(connection.service);
        const coprocessor = new CoprocessorService(service, connection.addresses);
        await coprocessor.callback(result.toString(), jobId);
        logsToProcess.insert(key, { ...value, status: { Processed: null } });
      } catch (error) {
        console.error("Error processing log", error);
        throw new Error("Error processing log");
      }
    }
  }
}
