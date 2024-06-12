import { ic, init, nat64 } from "azle";

import { CoprocessorService } from "../coprocessor/coprocessor.service";
import { IntegrationsService } from "../integrations/integrations.service";

type TimerGuardStatus = "Ready" | "Running";

export class TimersService {
  private getLogsTimer?: nat64;
  private processPendingLogsTimer?: nat64;

  constructor(
    private coprocessorService: CoprocessorService,
    private integrationsService: IntegrationsService
  ) {}

  public init() {
    this.getLogsTimer = this.initGetLogsTimer();
    this.processPendingLogsTimer = this.initProcessPendingLogsTimer();
  }

  private initGetLogsTimer() {
    const TimerGuard: { status: TimerGuardStatus } = {
      status: "Ready",
    };

    const timerInterval = 3n;

    return ic.setTimerInterval(timerInterval, async () => {
      if (TimerGuard.status === "Running") {
        console.log("Timer is already running");
        return;
      }

      TimerGuard.status = "Running";

      const integrations = this.integrationsService.getAll();

      for (const key of integrations.keys()) {
        await this.coprocessorService.getLogs(key);
      }

      TimerGuard.status = "Ready";
    });
  }

  private initProcessPendingLogsTimer() {
    const TimerGuard: { status: TimerGuardStatus } = {
      status: "Ready",
    };

    const timerInterval = 3n;

    return ic.setTimerInterval(timerInterval, async () => {
      if (TimerGuard.status === "Running") {
        console.log("Timer is already running");
        return;
      }

      TimerGuard.status = "Running";

      await this.coprocessorService.processPendingLogs();

      TimerGuard.status = "Ready";
    });
  }

  public getAll() {
    return {
      getLogsTimer: this.getLogsTimer,
      processPendingLogsTimer: this.processPendingLogsTimer,
    };
  }
}
