import { None, Some } from "azle/experimental";

import { RpcApi, RpcServices } from "@bundly/ic-evm-rpc";

export type CustomNetwork = {
  type: "custom";
  chainId: number;
  services: {
    url: string;
    headers?: { name: string; value: string }[];
  }[];
};

export const SepoliaNetworkServices = ["Alchemy", "Ankr", "BlockPi", "PublicNode"] as const;
export type SepoliaNetworkService = (typeof SepoliaNetworkServices)[number];

export type SepoliaNetwork = {
  type: "sepolia";
  services: SepoliaNetworkService[];
};

// TODO: Add more network types

export type NetworkJSON = CustomNetwork | SepoliaNetwork;

export const fromJSON = (network: NetworkJSON) => {
  switch (network.type) {
    case "custom": {
      const chainId = BigInt(network.chainId);
      const services = network.services.map((s) => {
        const headers = s.headers
          ? s.headers.map((header) => {
              return { name: header.name, value: header.value };
            })
          : undefined;

        return { url: s.url, headers: headers ? Some(headers) : None };
      });

      return { Custom: { chainId, services } };
    }
    case "sepolia": {
      const services = network.services.map((s: any) => {
        if (!SepoliaNetworkServices.includes(s)) throw new Error("Invalid service type");

        return { [s]: null };
      });

      return {
        EthSepolia: services.length > 0 ? Some(services) : None,
      };
    }
    default:
      throw new Error("Invalid service type");
  }
};
