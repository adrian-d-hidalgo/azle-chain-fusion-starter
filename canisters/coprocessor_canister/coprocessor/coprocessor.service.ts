import { None, Some, ic } from "azle";
import { AbiCoder, getUint, keccak256, toUtf8Bytes } from "ethers";

import { EvmRpc } from "@bundly/ic-evm-rpc";

import { ConfigService } from "../config/config.service";
import { EtherFeeCalculator } from "../ether/ether-fee-calculator";
import { EtherRpcService } from "../ether/ether-rpc.service";
import { EtherService, SignRequest } from "../ether/ether.service";

export type GetLogsOptions = {
  fromBlock: bigint;
  toBlock: bigint;
  addresses: string[];
  topics: string[][];
};

export class CoprocessorService {
  public static MAX_BLOCK_SPREAD: bigint = 500n;

  constructor(
    private service: EtherRpcService,
    private addresses: string[]
  ) {}

  public async getLogs(options: GetLogsOptions) {
    if (options.fromBlock < 0 || options.toBlock < 0) {
      throw new Error("Block numbers must be positive");
    }

    if (options.toBlock < options.fromBlock) {
      throw new Error("To block must be greater than from block");
    }

    if (options.toBlock - options.fromBlock > CoprocessorService.MAX_BLOCK_SPREAD) {
      throw new Error("Block spread too large");
    }

    const getLogsArgs = {
      fromBlock: Some({ Number: options.fromBlock }),
      toBlock: Some({ Number: options.toBlock }),
      addresses: options.addresses,
      topics: Some(options.topics),
    };

    return ic.call(EvmRpc.eth_getLogs, {
      args: [this.service.getValue(), None, getLogsArgs],
      cycles: 1_000_000_000n,
    });
  }

  public async callback(result: string, jobId: bigint): Promise<string> {
    const functionSignature = "callback(string,uint256)";
    const selector = keccak256(toUtf8Bytes(functionSignature)).slice(0, 10);
    const abiCoder = new AbiCoder();
    const args = abiCoder.encode(["string", "uint256"], [result, jobId]);
    // slice(2) removes the 0x prefix
    const data = selector + args.slice(2);

    // TODO: Improve nonce generation
    const configService = new ConfigService();
    const nonce = Number(configService.getNonce());
    const chainId = this.service.getChainId();
    const feeCalculator = new EtherFeeCalculator(this.service);
    const feeEstimates = await feeCalculator.getFeeEstimates();
    // TODO: Should iterate over all addresses?
    const contractAddress = this.addresses[0];

    const transaction: SignRequest = {
      chainId,
      to: contractAddress,
      gasLimit: getUint(5000000),
      maxFeePerGas: feeEstimates.maxFeePerGas,
      maxPriorityFeePerGas: feeEstimates.maxPriorityFeePerGas,
      data,
      value: getUint(0),
      nonce,
    };

    try {
      const etherService = new EtherService(this.service);
      const rawTransaction = await etherService.signTransaction(transaction);
      const sendRawTxResult = await etherService.sendRawTransaction(rawTransaction);

      if (sendRawTxResult.Consistent.Ok?.Ok === undefined) {
        throw sendRawTxResult.Consistent.Err;
      }

      if (sendRawTxResult.Consistent.Err) {
        throw sendRawTxResult.Consistent.Err;
      }

      configService.incrementNonce();

      return sendRawTxResult.Consistent.Ok.Ok.Some || "";
    } catch (err) {
      throw err;
    }
  }
}
