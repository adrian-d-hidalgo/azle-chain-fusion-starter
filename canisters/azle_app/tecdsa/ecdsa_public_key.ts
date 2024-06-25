import { None, ic } from "azle";
import { EcdsaPublicKeyArgs, KeyId, managementCanister } from "azle/canisters/management";

export async function ecdsaPublicKey(keyId: KeyId, derivationPath: Uint8Array[]): Promise<Uint8Array> {
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
