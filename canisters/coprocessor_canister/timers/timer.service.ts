import { ic, nat64 } from "azle";

import { LogManager } from "../log/log-manager";

type TimerGuardStatus = "Ready" | "Running";
type TimerGuard = { status: TimerGuardStatus };

export class TimerService {
  private getLogsTimer?: nat64;
  private processPendingLogsTimer?: nat64;

  constructor(private logManager: LogManager) {}

  public init() {
    this.getLogsTimer = this.initGetLogsTimer();
    this.processPendingLogsTimer = this.initProcessPendingLogsTimer();
  }

  private initGetLogsTimer() {
    const timerGuard: TimerGuard = {
      status: "Ready",
    };

    const timerInterval = 3n;

    return ic.setTimerInterval(timerInterval, async () => {
      // Prevent multiple instances of the timer from running at the same time
      if (timerGuard.status === "Running") {
        return;
      }

      timerGuard.status = "Running";

      await this.logManager.getLogs();

      timerGuard.status = "Ready";
    });
  }

  private initProcessPendingLogsTimer() {
    const timerGuard: TimerGuard = {
      status: "Ready",
    };

    const timerInterval = 3n;

    return ic.setTimerInterval(timerInterval, async () => {
      if (timerGuard.status === "Running") {
        return;
      }

      timerGuard.status = "Running";

      await this.logManager.processLogs();

      timerGuard.status = "Ready";
    });
  }

  public getAll() {
    return {
      getLogsTimer: this.getLogsTimer,
      processPendingLogsTimer: this.processPendingLogsTimer,
    };
  }
}
