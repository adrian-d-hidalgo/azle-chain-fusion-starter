import { Null, Record, StableBTreeMap, Variant, nat } from "azle";
import { getUint } from "ethers";

import { LogEntry } from "@bundly/ic-evm-rpc";

import { EtherRpcService } from "../ether/ether-rpc.service";
import { CoprocessorService } from "./coprocessor.service";
import { EventService } from "./event.service";
import { JobService } from "./job.service";

const LogToProcess = Record({
  log: LogEntry,
  eventId: nat,
  status: Variant({ Pending: Null, Processed: Null }),
});
type LogToProcess = typeof LogToProcess.tsType;

const logsToProcess = StableBTreeMap<nat, LogToProcess>(10);

export class LogService {
  private jobService: JobService = new JobService();

  constructor(private eventService: EventService) {}

  public async getLogs() {
    const events = this.eventService.getAll();

    for (let [eventId, event] of events) {
      const service = new EtherRpcService(event.services);

      const coprocessor = new CoprocessorService(service, event.addresses);

      const getLogsArgs = {
        fromBlock: event.lastScrapedBlock,
        toBlock: event.lastScrapedBlock + CoprocessorService.MAX_BLOCK_SPREAD,
        addresses: event.addresses,
        topics: event.topics.Some || [],
      };

      const getLogsResponse = await coprocessor.getLogs(getLogsArgs);

      // TODO: Handle error
      if (getLogsResponse.Consistent?.Ok) {
        const logs = getLogsResponse.Consistent.Ok;

        const filteredLogs = logs.filter((log) => {
          const blockNumber = log.blockNumber.Some;

          if (blockNumber !== undefined) {
            return log.blockNumber.Some !== event.lastScrapedBlock;
          }

          // TODO: What happens if blockNumber is not present?
          return true;
        });

        if (filteredLogs.length > 0) {
          let maxBlock = event.lastScrapedBlock;

          for (const log of filteredLogs) {
            const currentBlockNumber = log.blockNumber.Some;
            if (currentBlockNumber && currentBlockNumber > maxBlock) {
              maxBlock = currentBlockNumber;
            }
          }

          if (filteredLogs.length > 0) {
            this.saveLogs(filteredLogs, eventId);
            this.eventService.update(eventId, { ...event, lastScrapedBlock: maxBlock });
          }
        }
      }
    }
  }

  private saveLogs(logs: LogEntry[], eventId: nat) {
    logs.forEach((log) => {
      const nextId = logsToProcess.len() + 1n;
      logsToProcess.insert(nextId, { log, eventId, status: { Pending: null } });
    });
  }

  public async processLogs() {
    const pendingLogs = logsToProcess.items().filter(([_, value]) => value.status.Pending !== undefined);

    for (const [key, value] of pendingLogs) {
      const event = this.eventService.get(value.eventId).Some;

      if (event === undefined) {
        throw new Error("Event not found");
      }

      // Topic 1 is the jobId
      const jobId = getUint(value.log.topics[1]);

      try {
        const result = await this.jobService.process(event, jobId);
        console.log("Successfully ran job", jobId, "with transaction", result);
        logsToProcess.insert(key, { ...value, status: { Processed: null } });
      } catch (error) {
        console.error("Error processing log", error);
        throw new Error("Error processing log");
      }
    }
  }
}
