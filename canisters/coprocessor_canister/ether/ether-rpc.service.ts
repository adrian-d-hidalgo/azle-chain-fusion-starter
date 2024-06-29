import { RpcService, RpcServices } from "@bundly/ic-evm-rpc";

export class EtherRpcService {
  constructor(private service: RpcServices) {}

  public getChainId(): bigint {
    return this.service.Custom ? this.service.Custom.chainId : 0n;
  }

  public getValue(): RpcServices {
    return this.service;
  }

  public getRequestService(): RpcService {
    // TODO: add support for another services
    if (!this.service.Custom?.services[0]) {
      throw new Error("Service not found");
    }

    const service = {
      Custom: {
        url: this.service.Custom?.services[0].url,
        headers: this.service.Custom?.services[0].headers,
      },
    };

    return service;
  }
}
