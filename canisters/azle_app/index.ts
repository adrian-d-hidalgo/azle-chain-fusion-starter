import { Server, Void, query, text, update } from "azle";

import { ConfigService, EcdsaKeyId } from "./config/config.service";
import { CreateServer } from "./server";

export default Server(CreateServer, {
  // TODO: change this to init
  set_app_config: update([], Void, async () => {
    // TODO: Get this from init args
    const ecdsaKeyId: EcdsaKeyId = {
      name: "dfx_test_key",
      curve: "secp256k1",
    };

    const configService = new ConfigService();
    await configService.init({ keyId: ecdsaKeyId });
  }),
  get_evm_address: query([], text, () => {
    const configService = new ConfigService();
    const evmAddress = configService.getEvmAddres();

    return evmAddress;
  }),
});
