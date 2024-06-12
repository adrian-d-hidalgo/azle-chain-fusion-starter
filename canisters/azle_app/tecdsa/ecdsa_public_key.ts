import { None, Null, Record, Variant, ic, text } from "azle";
import { EcdsaPublicKeyArgs, managementCanister } from "azle/canisters/management";

const EcdsaKeyId = Record({
  curve: Variant({
    secp256k1: Null,
  }),
  name: text,
});

export type EcdsaKeyId = typeof EcdsaKeyId.tsType;

export async function ecdsaPublicKey(keyId: EcdsaKeyId, derivationPath: Uint8Array[]): Promise<Uint8Array> {
  const args: EcdsaPublicKeyArgs = {
    canister_id: None,
    derivation_path: derivationPath,
    key_id: keyId,
  };

  const response = await ic.call(managementCanister.ecdsa_public_key, {
    args: [args],
  });

  return response.public_key;
}
