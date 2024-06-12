import { None, Some, ic } from "azle";
import express, { Request } from "express";

import { CoprocessorService } from "./coprocessor/coprocessor.service";
import { IntegrationService } from "./integration/integration.service";

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

  const integrationService = new IntegrationService();
  const coprocessorService = new CoprocessorService(integrationService);

  app.use((_, __, next) => {
    type TimerGuardStatus = "Ready" | "Running";

    const TimerGuard: { status: TimerGuardStatus } = {
      status: "Ready",
    };

    ic.setTimerInterval(3n, async () => {
      if (TimerGuard.status === "Running") {
        console.log("Timer is already running");
        return;
      }

      TimerGuard.status = "Running";

      const integrations = integrationService.getAll();

      for (const key of integrations.keys()) {
        await coprocessorService.getLogs(key);
      }

      await coprocessorService.processPendingLogs();

      TimerGuard.status = "Ready";
    });

    next();
  });

  app.use((_, __, next) => {
    type TimerGuardStatus = "Ready" | "Running";

    const TimerGuard: { status: TimerGuardStatus } = {
      status: "Ready",
    };

    ic.setTimerInterval(3n, async () => {
      if (TimerGuard.status === "Running") {
        console.log("Timer is already running");
        return;
      }

      TimerGuard.status = "Running";

      await coprocessorService.processPendingLogs();

      TimerGuard.status = "Ready";
    });
  });

  app.get("/health", (_, res) => {
    res.send("ok");
  });

  app.post("/integrations/custom", async (req: Request<any, any, RegisterCustomRpcIntegration>, res) => {
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

    await integrationService.add(data);

    res.send();
  });

  return app.listen();
};
