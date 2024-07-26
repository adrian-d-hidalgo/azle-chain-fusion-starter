import { None, Some, ThresholdKeyInfo, ecdsaPublicKey, nat } from "azle/experimental";
import { computeAddress, hexlify } from "ethers";

import { AppConfig, AppConfigStore } from "../database/database";

export type EcdsaKeyIdName = "dfx_test_key" | "test_key_1" | "key_1";
export type EcdsaKeyIdCurve = "secp256k1";

export type EcdsaKeyId = {
  curve: EcdsaKeyIdCurve;
  name: EcdsaKeyIdName;
};

export type InitOptions = {
  ecdsaKeyId: EcdsaKeyId;
};

export class ConfigService {
  private config: AppConfig;

  constructor(private readonly configStore: AppConfigStore) {
    let appConfig = this.configStore.get(0);

    if (appConfig === null) {
      const newConfig = {
        ecdsaKeyId: None,
        evmAddress: None,
        nonce: 0n,
      };

      this.configStore.insert(0, newConfig);

      appConfig = newConfig;
    }

    this.config = appConfig;
  }

  public async init(options: InitOptions) {
    this.setEcdsaKeyId(options.ecdsaKeyId.name, options.ecdsaKeyId.curve);
    await this.setEvmAddress(this.getKeyId());
  }

  private setEcdsaKeyId(name: EcdsaKeyIdName, curve: EcdsaKeyIdCurve): void {
    const ecdsaKeyId = {
      name,
      curve,
    };

    this.config = {
      ...this.config,
      ecdsaKeyId: Some(ecdsaKeyId),
    };

    this.configStore.insert(0, this.config);
  }

  public getKeyId(): EcdsaKeyId {
    const storedKeyId = this.config.ecdsaKeyId.Some;

    if (storedKeyId === undefined) {
      throw new Error("Key ID not set");
    }

    const keyId = {
      name: storedKeyId.name,
      curve: storedKeyId.curve,
    } as EcdsaKeyId;

    return keyId;
  }

  private async setEvmAddress(keyId: EcdsaKeyId): Promise<void> {
    const thresholdKeyInfo: ThresholdKeyInfo = {
      derivationPath: [],
      keyId: {
        name: keyId.name,
        curve: keyId.curve,
      } as EcdsaKeyId,
    };

    const pubkey = await ecdsaPublicKey(thresholdKeyInfo);
    const evmAddress = computeAddress(hexlify(pubkey));

    this.config = {
      ...this.config,
      evmAddress: Some(evmAddress),
    };

    this.configStore.insert(0, this.config);
  }

  public getEvmAddres(): string {
    const address = this.config.evmAddress.Some;

    if (address === undefined) {
      throw new Error("EVM address not set");
    }

    return address;
  }

  public getNonce(): nat {
    return this.config.nonce;
  }

  public incrementNonce(): void {
    this.config = {
      ...this.config,
      nonce: this.config.nonce + 1n,
    };

    this.configStore.insert(0, this.config);
  }
}
