import { None, Record, Server, Some, StableBTreeMap, Void, ic, nat8, query, text, update } from "azle";
import { ethers } from "ethers";
import express, { Request } from "express";

import { EvmRpc, RpcServices } from "@bundly/ic-evm-rpc";

import { ecdsaPublicKey } from "./tecdsa/ecdsa_public_key";

const AppConfig = Record({
  evmAddress: text,
});
type AppConfig = typeof AppConfig.tsType;

const app_configs = StableBTreeMap<nat8, typeof AppConfig.tsType>(0);
const evm_configs = StableBTreeMap<text, typeof RpcServices.tsType>(1);

type CreateCustomEvmConfigRpcApi = {
  url: string;
  headers?: { value: string; name: string }[];
};

type CreateCustomEvmConfig = {
  name: string;
  chainId: number;
  services: CreateCustomEvmConfigRpcApi[];
};

const CreateServer = () => {
  const app = express();

  app.use(express.json());

  app.get("/health", (_, res) => {
    res.send("ok");
  });

  app.post("/rpc-services/custom", async (req: Request<any, any, CreateCustomEvmConfig>, res) => {
    const chainId = BigInt(req.body.chainId);
    const services = req.body.services.map((service) => {
      const headers = service.headers
        ? service.headers.map((header) => {
            return { name: header.name, value: header.value };
          })
        : undefined;

      return { url: service.url, headers: headers ? Some(headers) : None };
    });

    evm_configs.insert(req.body.name, { Custom: { chainId, services } });

    res.send();
  });

  app.get("/rpc-services", (_, res) => {
    console.log(evm_configs.values());

    const response = evm_configs.values().map((config) => {
      if ("Custom" in config) {
        return {
          chainId: Number(config.Custom?.chainId),
          services: config.Custom?.services,
        };
      }

      return { ...config };
    });

    res.json(response);
  });

  app.post("/evm-logs", async (_, res) => {
    if (evm_configs.isEmpty()) {
      throw new Error("No services found");
    }

    const service = evm_configs.items()[0][1];

    if (service === undefined) {
      throw new Error("Service not found");
    }

    const result = await ic.call(EvmRpc.eth_getLogs, {
      args: [
        service,
        None,
        {
          fromBlock: Some({ Earliest: null }),
          toBlock: Some({ Latest: null }),
          addresses: ["0x5FbDB2315678afecb367f032d93F642f64180aa3"],
          topics: Some([["0x031ada964b8e520743eb9508d0ace62654b126430b7e5a92b42e78eebb61602e"]]),
        },
      ],
      cycles: 1_000_000_000n,
    });

    const response = result.Consistent?.Ok?.map((log) => {
      return {
        blockHash: log.blockHash.Some ? log.blockHash.Some : null,
        blockNumber: log.blockNumber.Some,
        address: log.address,
        data: log.data,
        logIndex: log.logIndex.Some ? Number(log.logIndex) : null,
        topics: log.topics,
        transactionHash: log.transactionHash.Some ? log.transactionHash.Some : null,
        transactionIndex: log.transactionIndex.Some ? Number(log.transactionIndex) : null,
      };
    });

    res.json(response);
  });

  return app.listen();
};

export default Server(CreateServer, {
  // TODO: change this to init
  set_app_config: update([], Void, async () => {
    const pubkey = await ecdsaPublicKey([]);
    const evmAddress = ethers.computeAddress(ethers.hexlify(pubkey));

    app_configs.insert(0, { evmAddress });
  }),
  get_evm_address: query([], text, async () => {
    const appConfig = app_configs.get(0).Some;

    if (appConfig === undefined) {
      throw new Error("App config not set");
    }

    return appConfig.evmAddress;
  }),
});
