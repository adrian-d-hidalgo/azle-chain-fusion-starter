import { RpcService, RpcServices } from "@bundly/ic-evm-rpc";

export enum ChainIds {
  EthSepolia = 11155111,
  EthMainnet = 1,
  ArbitrumOne = 42161,
  BaseMainnet = 8453,
  OptimismMainnet = 10,
}

export class EtherRpcService {
  constructor(private services: RpcServices) {}

  public getChainId(): bigint {
    if (this.services.Custom) return this.services.Custom.chainId;
    if (this.services.EthSepolia) return BigInt(ChainIds.EthSepolia);
    if (this.services.EthMainnet) return BigInt(ChainIds.EthMainnet);
    if (this.services.ArbitrumOne) return BigInt(ChainIds.ArbitrumOne);
    if (this.services.BaseMainnet) return BigInt(ChainIds.BaseMainnet);
    if (this.services.OptimismMainnet) return BigInt(ChainIds.OptimismMainnet);

    throw new Error("ChainId not found");
  }

  public getValue(): RpcServices {
    return this.services;
  }

  public getRequestService(): RpcService {
    if (this.services.Custom) {
      return {
        Custom: {
          url: this.services.Custom?.services[0].url,
          headers: this.services.Custom?.services[0].headers,
        },
      };
    }

    if (this.services.EthSepolia && this.services.EthSepolia.Some?.[0]) {
      return { EthSepolia: this.services.EthSepolia.Some?.[0] };
    }

    if (this.services.EthMainnet && this.services.EthMainnet.Some?.[0]) {
      return { EthMainnet: this.services.EthMainnet.Some?.[0] };
    }

    if (this.services.ArbitrumOne && this.services.ArbitrumOne.Some?.[0]) {
      return { ArbitrumOne: this.services.ArbitrumOne.Some?.[0] };
    }

    if (this.services.BaseMainnet && this.services.BaseMainnet.Some?.[0]) {
      return { BaseMainnet: this.services.BaseMainnet.Some?.[0] };
    }

    if (this.services.OptimismMainnet && this.services.OptimismMainnet.Some?.[0]) {
      return { OptimismMainnet: this.services.OptimismMainnet.Some?.[0] };
    }

    throw new Error("Service not found");
  }
}
