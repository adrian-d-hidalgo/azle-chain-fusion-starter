import { Record, Server, ic, init, query, setNodeServer, text } from "azle/experimental";
import { KeyId } from "azle/experimental/canisters/management";

import { AppConfigStore } from "./database/database";
import { CreateServer } from "./server";
import { ConfigService, EcdsaKeyId } from "./services/config.service";

const InitOptions = Record({
  ecdsa_key_id: KeyId,
});

export default Server(CreateServer, {
  init: init([InitOptions], (options) => {
    const { ecdsa_key_id } = options;

    const keyIdNames = ["dfx_test_key", "test_key_1", "key_1"];

    if (!keyIdNames.includes(ecdsa_key_id.name)) {
      throw new Error("Invalid key name");
    }

    const ecdsaKeyId: EcdsaKeyId = {
      name: ecdsa_key_id.name,
      // TODO: Change this to use the curve from the keyId
      curve: "secp256k1",
    } as unknown as EcdsaKeyId;

    ic.setTimer(0n, async () => {
      const configService = new ConfigService(AppConfigStore);
      await configService.init({ ecdsaKeyId });
    });

    setNodeServer(CreateServer());
  }),
  get_evm_address: query([], text, () => {
    const configService = new ConfigService(AppConfigStore);
    const evmAddress = configService.getEvmAddres();

    return evmAddress;
  }),
});
