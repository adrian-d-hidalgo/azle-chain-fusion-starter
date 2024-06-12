import { Null, Record, Server, StableBTreeMap, Variant, Void, nat8, query, text, update } from "azle";
import { ethers } from "ethers";

import { CreateServer } from "./server";
import { ecdsaPublicKey } from "./tecdsa/ecdsa_public_key";

const AppConfig = Record({
  ecdsaKeyId: Record({
    name: text,
    curve: Variant({ secp256k1: Null }),
  }),
  evmAddress: text,
});
type AppConfig = typeof AppConfig.tsType;

const app_configs = StableBTreeMap<nat8, typeof AppConfig.tsType>(0);

export default Server(CreateServer, {
  // TODO: change this to init
  set_app_config: update([], Void, async () => {
    // TODO: Get this from init args
    const ecdsaKeyId = {
      name: "dfx_test_key",
      curve: { secp256k1: null },
    };
    const pubkey = await ecdsaPublicKey(ecdsaKeyId, []);
    const evmAddress = ethers.computeAddress(ethers.hexlify(pubkey));

    app_configs.insert(0, { evmAddress, ecdsaKeyId });
  }),
  get_evm_address: query([], text, async () => {
    const appConfig = app_configs.get(0).Some;

    if (appConfig === undefined) {
      throw new Error("App config not set");
    }

    return appConfig.evmAddress;
  }),
});
