import { None, Some } from "azle/experimental";
import express, { Request } from "express";

import { RpcServices } from "@bundly/ic-evm-rpc";

import { EventStore, LogStore } from "./database/database";
import { NetworkJSON, fromJSON } from "./evm_rpc/parser";
import { EventService } from "./services/event.service";
import { LogService } from "./services/log.service";
import { TimerService } from "./services/timer.service";

type RegisterCustomRpcIntegration = {
  network: NetworkJSON;
  events: {
    topics: string[][];
    addresses: string[];
  };
};

export const CreateServer = () => {
  const app = express();

  app.use(express.json());

  const eventService = new EventService(EventStore);
  const logService = new LogService(LogStore, eventService);
  const timerService = new TimerService(logService);

  app.use((_, __, next) => {
    timerService.init();
    next();
  });

  app.get("/health", (_, res) => {
    res.send("ok");
  });

  app.post("/events", async (req: Request<any, any, RegisterCustomRpcIntegration>, res) => {
    const { network, events } = req.body;

    const data = {
      // TODO: Fix this types
      service: fromJSON(network) as RpcServices,
      addresses: events.addresses,
      topics: events.topics ? Some(events.topics) : None,
      lastScrapedBlock: 0n,
    };

    await eventService.add(data);

    res.send();
  });

  return app.listen();
};
