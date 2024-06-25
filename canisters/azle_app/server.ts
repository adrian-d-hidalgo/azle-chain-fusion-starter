import { None, Some } from "azle";
import express, { Request } from "express";

import { ConnectionService } from "./connection/connection.service";
import { LogManager } from "./log/log-manager";
import { TimerService } from "./timers/timer.service";

type RpcApi = {
  url: string;
  headers?: { value: string; name: string }[];
};

type RegisterCustomRpcIntegration = {
  connection: {
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

  const connectionService = new ConnectionService();
  const logManager = new LogManager(connectionService);
  const timerService = new TimerService(logManager, connectionService);

  app.use((_, __, next) => {
    timerService.init();
    next();
  });

  app.get("/health", (_, res) => {
    res.send("ok");
  });

  app.post("/connections/custom", async (req: Request<any, any, RegisterCustomRpcIntegration>, res) => {
    const { connection, events } = req.body;

    const chainId = BigInt(connection.chainId);
    const services = connection.services.map((service) => {
      const headers = service.headers
        ? service.headers.map((header) => {
            return { name: header.name, value: header.value };
          })
        : undefined;

      return { url: service.url, headers: headers ? Some(headers) : None };
    });

    const data = {
      service: { Custom: { chainId, services } },
      addresses: events.addresses,
      topics: events.topics ? Some(events.topics) : None,
      lastScrapedBlock: 0n,
    };

    await connectionService.add(data);

    res.send();
  });

  return app.listen();
};
