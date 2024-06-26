import { ic, nat64 } from "azle";

import { ConnectionService } from "../connection/connection.service";
import { LogManager } from "../log/log-manager";

type TimerGuardStatus = "Ready" | "Running";

export class TimerService {
  private getLogsTimer?: nat64;
  private processPendingLogsTimer?: nat64;

  constructor(
    private logManager: LogManager,
    private connectionService: ConnectionService
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
        return;
      }

      TimerGuard.status = "Running";

      const integrations = this.connectionService.getAll();

      for (const key of integrations.keys()) {
        await this.logManager.getLogs(key);
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
        return;
      }

      TimerGuard.status = "Running";

      await this.logManager.processLogs();

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
