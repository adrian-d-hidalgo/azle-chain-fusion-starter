import { None, ThresholdKeyInfo, calculateRsvForTEcdsa, ecdsaPublicKey, ic, signWithEcdsa } from "azle";
import { Transaction, TransactionRequest, ethers } from "ethers";

import { EvmRpc } from "@bundly/ic-evm-rpc";

import { ConfigService } from "../config/config.service";
import { EtherRpcService } from "./ether-rpc.service";

class SendRawTransactionInconsistentError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = "SendRawTransactionConsistentError";
  }
}

class SendRawTransactionConsistentError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = "SendRawTransactionConsistentError";
  }
}

export class EtherService {
  constructor(private service: EtherRpcService) {}

  public signTransaction = async (transaction: TransactionRequest): Promise<string> => {
    let tx = Transaction.from({
      chainId: transaction.chainId,
      to: transaction.to?.toString(),
      gasLimit: transaction.gasLimit,
      maxFeePerGas: transaction.maxFeePerGas,
      maxPriorityFeePerGas: transaction.maxPriorityFeePerGas,
      data: transaction.data,
      value: transaction.value,
      nonce: transaction.nonce,
    });

    const unsignedSerializedTx = tx.unsignedSerialized;
    const unsignedSerializedTxHash = ethers.keccak256(unsignedSerializedTx);

    const configService = new ConfigService();

    const thresholdKeyInfo: ThresholdKeyInfo = {
      derivationPath: [],
      keyId: configService.getKeyId(),
    };

    const signedSerializedTxHash = await signWithEcdsa(
      thresholdKeyInfo,
      ethers.getBytes(unsignedSerializedTxHash)
    );

    const pubkey = await ecdsaPublicKey(thresholdKeyInfo);
    const evmAddress = ethers.computeAddress(ethers.hexlify(pubkey));

    const { r, s, v } = calculateRsvForTEcdsa(
      Number(this.service.getChainId()),
      evmAddress,
      unsignedSerializedTxHash,
      signedSerializedTxHash
    );

    tx.signature = {
      r,
      s,
      v,
    };

    return tx.serialized;
  };

  public async sendRawTransaction(transaction: string) {
    try {
      const result = await ic.call(EvmRpc.eth_sendRawTransaction, {
        args: [this.service.getValue(), None, transaction],
        cycles: 1_000_000_000n,
      });

      if (result.Inconsistent) {
        throw new SendRawTransactionInconsistentError();
      }

      if (result.Consistent?.Err) {
        throw new SendRawTransactionConsistentError();
      }

      if (result.Consistent?.Ok.Ok) {
        return result.Consistent?.Ok.Ok;
      }

      throw new Error("Inconsistent or no Ok result from send transaction");
    } catch (error) {
      throw new Error("Error sending transaction");
    }
  }
}
