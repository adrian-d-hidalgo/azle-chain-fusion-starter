import { Event } from "../database/database";
import { EtherRpcService } from "../ether/ether-rpc.service";
import { CoprocessorService } from "./coprocessor.service";

export class JobService {
  private fibonacci(n: number): number {
    if (n <= 1) {
      return n;
    }
    return this.fibonacci(n - 1) + this.fibonacci(n - 2);
  }

  public process(event: Event, jobId: bigint): Promise<string> {
    // this calculation would likely exceed an ethereum blocks gas limit
    // but can easily be calculated on the IC
    const result = this.fibonacci(20);
    const service = new EtherRpcService(event.service);
    const coprocessor = new CoprocessorService(service, event.addresses);
    return coprocessor.callback(result.toString(), jobId);
  }
}
