import express, { Request } from "express";

import { AddNewEventData, EventService } from "./services/event.service";
import { LogService } from "./services/log.service";
import { TimerService } from "./services/timer.service";

type RpcApi = {
  url: string;
  headers?: { value: string; name: string }[];
};

type RegisterCustomRpcIntegration = {
  services: {
    name: "custom";
    chainId: number;
    services: RpcApi[];
  };
  events: {
    topics?: string[][];
    addresses: string[];
  };
};

export const CreateServer = () => {
  const app = express();

  app.use(express.json());

  const eventService = new EventService();
  const logService = new LogService(eventService);
  const timerService = new TimerService(logService);

  app.use((_, __, next) => {
    timerService.init();
    next();
  });

  app.get("/health", (_, res) => {
    res.send("ok");
  });

  app.post("/events", async (req: Request<any, any, RegisterCustomRpcIntegration>, res) => {
    const { services, events } = req.body;

    const data: AddNewEventData = {
      services,
      addresses: events.addresses,
      topics: events.topics,
    };

    await eventService.add(data);

    res.send();
  });

  return app.listen();
};
