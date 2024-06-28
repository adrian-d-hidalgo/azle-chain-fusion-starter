import { None, Some } from "azle";
import express, { Request } from "express";

import { EventService } from "./event/event.service";
import { LogManager } from "./log/log-manager";
import { TimerService } from "./timers/timer.service";

type RpcApi = {
  url: string;
  headers?: { value: string; name: string }[];
};

type RegisterCustomRpcIntegration = {
  service: {
    type: string;
    chainId: number;
    services: RpcApi[];
  };
  events: {
    topics: string[][];
    addresses: string[];
  };
};

export const CreateServer = () => {
  const app = express();

  app.use(express.json());

  const eventService = new EventService();
  const logManager = new LogManager(eventService);
  const timerService = new TimerService(logManager);

  app.use((_, __, next) => {
    timerService.init();
    next();
  });

  app.get("/health", (_, res) => {
    res.send("ok");
  });

  app.post("/events", async (req: Request<any, any, RegisterCustomRpcIntegration>, res) => {
    const { service, events } = req.body;

    if (service.type !== "custom") {
      res.status(400).send("Invalid service type");
      return;
    }

    const chainId = BigInt(service.chainId);
    const services = service.services.map((s) => {
      const headers = s.headers
        ? s.headers.map((header) => {
            return { name: header.name, value: header.value };
          })
        : undefined;

      return { url: s.url, headers: headers ? Some(headers) : None };
    });

    const data = {
      service: { Custom: { chainId, services } },
      addresses: events.addresses,
      topics: events.topics ? Some(events.topics) : None,
      lastScrapedBlock: 0n,
    };

    await eventService.add(data);

    res.send();
  });

  return app.listen();
};
