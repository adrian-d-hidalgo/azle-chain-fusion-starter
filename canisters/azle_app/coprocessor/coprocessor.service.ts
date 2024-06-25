import { None, Null, Record, Some, StableBTreeMap, Variant, ic, nat, nat64 } from "azle";
import { AbiCoder, getUint, keccak256, toUtf8Bytes } from "ethers";

import { EvmRpc, LogEntry } from "@bundly/ic-evm-rpc";

import { EtherService } from "../ether/ether.service";
import { fibonacci } from "../helpers";
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
      logsToProcess.insert(nextId, { log, integrationId, status: { Pending: null } });
    });
  }

  public async processPendingLogs() {
    const pendingLogs = logsToProcess.items().filter(([_, value]) => value.status.Pending !== undefined);

    const promises = pendingLogs.map(async ([key, value]) => {
      const integration = this.integrationsService.get(value.integrationId).Some;

      if (integration === undefined) {
        throw new Error("Integration not found");
      }

      const result = fibonacci(20);
      // Topic 1 is the jobId
      const jobId = getUint(value.log.topics[1]);

      try {
        const functionSignature = "callback(string,uint256)";
        const selector = keccak256(toUtf8Bytes(functionSignature)).slice(0, 10);
        const abiCoder = new AbiCoder();
        const args = abiCoder.encode(["string", "uint256"], [result.toString(), jobId]);
        // slice(2) removes the 0x prefix
        const data = selector + args.slice(2);

        // TODO: Improve how the nonce is generated
        const nonce = Number(jobId) + 10;

        const etherService = new EtherService();
        const chainId = etherService.getChainId(integration.service);
        const feeEstimates = await etherService.getFeeEstimates(integration.service);

        const transaction = {
          chainId,
          to: integration.addresses[0],
          from: null,
          gasLimit: getUint(5000000),
          data,
          value: getUint(0),
          nonce,
          ...feeEstimates,
        };

        await etherService.sendTransaction(transaction, integration.service);

        logsToProcess.insert(key, { ...value, status: { Processed: null } });
      } catch (error) {
        console.log("Error processing log", jobId, error);
      }
    });

    await Promise.allSettled(promises);
  }
}
