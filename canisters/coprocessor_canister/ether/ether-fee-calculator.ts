import { None, ic } from "azle";

import { EvmRpc } from "@bundly/ic-evm-rpc";

import { EtherRpcService } from "./ether-rpc.service";

export class EtherFeeCalculator {
  constructor(private service: EtherRpcService) {}

  public async getMaxPriorityFeePerGas(): Promise<bigint> {
    const body = {
      jsonrpc: "2.0",
      method: "eth_maxPriorityFeePerGas",
      params: [],
      id: 1,
    };

    const service = this.service.getRequestService();

    const result = await ic.call(EvmRpc.request, {
      args: [service, JSON.stringify(body), 1_000n],
      cycles: 1_000_000_000n,
    });

    if (result.Ok) {
      return BigInt(JSON.parse(result.Ok).result);
    }

    throw new Error("Error getting max priority fee per gas");
  }

  public async getFeeHistory() {
    const jsonRpcArgs = {
      blockCount: 1n,
      newestBlock: {
        Latest: null,
      },
      rewardPercentiles: None,
    };

    const result = await ic.call(EvmRpc.eth_feeHistory, {
      args: [this.service.getValue(), None, jsonRpcArgs],
      cycles: 1_000_000_000n,
    });

    if (result.Consistent?.Ok?.Some) {
      return result.Consistent.Ok.Some;
    }

    throw new Error("Error getting fee history");
  }

  public async getFeeEstimates() {
    try {
      const maxPriorityFeePerGas = await this.getMaxPriorityFeePerGas();
      const feeHistory = await this.getFeeHistory();
      const baseFeePerGas = feeHistory.baseFeePerGas[0];
      const maxFeePerGas = baseFeePerGas * 2n + maxPriorityFeePerGas;

      return {
        maxFeePerGas,
        maxPriorityFeePerGas,
      };
    } catch (error) {
      throw new Error("Error getting fee estimates");
    }
  }
}
