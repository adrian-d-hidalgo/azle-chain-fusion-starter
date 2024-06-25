import { ic } from "azle";
import { KeyId, managementCanister } from "azle/canisters/management";

export async function signWithEcdsa(messageHash: Uint8Array, keyId: KeyId, derivationPath: Uint8Array[]) {
  const args = {
    message_hash: messageHash,
    key_id: keyId,
    derivation_path: derivationPath,
  };

  const response = await ic.call(managementCanister.sign_with_ecdsa, {
    args: [args],
    cycles: 10_000_000_000n,
  });

  return response;
}
