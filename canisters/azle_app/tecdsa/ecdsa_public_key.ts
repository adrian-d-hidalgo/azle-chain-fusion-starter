import { None, ic } from "azle";
import { EcdsaPublicKeyArgs, managementCanister } from "azle/canisters/management";

export async function ecdsaPublicKey(derivationPath: Uint8Array[]): Promise<Uint8Array> {
  const args: EcdsaPublicKeyArgs = {
    canister_id: None,
    derivation_path: derivationPath,
    key_id: {
      name: "dfx_test_key",
      curve: { secp256k1: null },
    },
  };

  const response = await ic.call(managementCanister.ecdsa_public_key, {
    args: [args],
  });

  return response.public_key;
}
