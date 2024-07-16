import { RpcService, RpcServices } from "@bundly/ic-evm-rpc";

export class EtherRpcService {
  constructor(private services: RpcServices) {}

  public getChainId(): bigint {
    return this.services.Custom ? this.services.Custom.chainId : 0n;
  }

  public getValue(): RpcServices {
    return this.services;
  }

  public getRequestService(): RpcService {
    // TODO: add support for another services
    if (!this.services.Custom?.services[0]) {
      throw new Error("Service not found");
    }

    const service = {
      Custom: {
        url: this.services.Custom?.services[0].url,
        headers: this.services.Custom?.services[0].headers,
      },
    };

    return service;
  }
}
