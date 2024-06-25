import { None, ic } from "azle";
import { TransactionRequest, ethers, getUint } from "ethers";

import { EvmRpc, RpcServices } from "@bundly/ic-evm-rpc";

export class EtherService {
  private wallet: ethers.Wallet;

  constructor() {
    // this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY);
    this.wallet = new ethers.Wallet("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80");
  }

  public getChainId(rpcService: RpcServices) {
    // TODO: Improve chainId handling for another networks
    return rpcService.Custom ? rpcService.Custom.chainId : 0;
  }

  public async getNonce(rpcService: RpcServices): Promise<number> {
    const result = await ic.call(EvmRpc.eth_getTransactionCount, {
      args: [
        rpcService,
        None,
        {
          address: this.wallet.address,
          block: {
            Latest: null,
          },
        },
      ],
      cycles: 1_000_000_000n,
    });

    if (result.Consistent?.Ok) {
      return Number(result.Consistent.Ok);
    }

    throw new Error("Error getting transaction nounce");
  }

  private async getMaxPriorityFeePerGas(rpcService: RpcServices): Promise<bigint> {
    const body = {
      jsonrpc: "2.0",
      method: "eth_maxPriorityFeePerGas",
      params: [],
      id: 1,
    };

    if (!rpcService.Custom?.services[0]) {
      throw new Error("Service not found");
    }

    // TODO: Add support for another services
    const service = {
      Custom: {
        url: rpcService.Custom?.services[0].url,
        headers: rpcService.Custom?.services[0].headers,
      },
    };

    const result = await ic.call(EvmRpc.request, {
      args: [service, JSON.stringify(body), 1_000n],
      cycles: 1_000_000_000n,
    });

    if (result.Ok) {
      return BigInt(JSON.parse(result.Ok).result);
    }

    throw new Error("Error getting max priority fee per gas");
  }

  private async getFeeHistory(rpcService: RpcServices) {
    const jsonRpcArgs = {
      blockCount: 1n,
      newestBlock: {
        Latest: null,
      },
      rewardPercentiles: None,
    };

    const result = await ic.call(EvmRpc.eth_feeHistory, {
      args: [rpcService, None, jsonRpcArgs],
      cycles: 1_000_000_000n,
    });

    if (result.Consistent?.Ok?.Some) {
      return result.Consistent.Ok.Some;
    }

    throw new Error("Error getting fee history");
  }

  public async getFeeEstimates(rpcService: RpcServices) {
    try {
      const maxPriorityFeePerGas = await this.getMaxPriorityFeePerGas(rpcService);
      const feeHistory = await this.getFeeHistory(rpcService);
      const baseFeePerGas = feeHistory.baseFeePerGas[0];
      const maxFeePerGas = baseFeePerGas * 2n + maxPriorityFeePerGas;

      return {
        maxFeePerGas,
        maxPriorityFeePerGas,
      };
    } catch (error) {
      console.error("Error getting fee estimates", error);
      throw new Error("Error getting fee estimates");
    }
  }

  private signTransaction = async (transaction: TransactionRequest): Promise<string> => {
    try {
      return await this.wallet.signTransaction(transaction);
    } catch (error) {
      console.error("Error signing transaction", error);
      throw new Error("Error signing transaction");
    }
  };

  public async sendTransaction(transaction: TransactionRequest, rpcService: RpcServices) {
    try {
      const tx = await this.signTransaction(transaction);

      const result = await ic.call(EvmRpc.eth_sendRawTransaction, {
        args: [rpcService, None, tx],
        cycles: 1_000_000_000n,
      });

      if (result.Consistent?.Ok?.Ok) {
        return result.Consistent?.Ok?.Ok;
      }

      throw new Error("Inconsistent or no Ok result from send transaction");
    } catch (error) {
      console.error("Error sending transaction", error);
      throw new Error("Error sending transaction");
    }
  }
}
