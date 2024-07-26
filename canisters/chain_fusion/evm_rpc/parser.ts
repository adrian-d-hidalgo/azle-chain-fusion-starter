import { None, Some } from "azle/experimental";

export type CustomNetwork = {
  type: "custom";
  chainId: number;
  services: {
    url: string;
    headers?: { name: string; value: string }[];
  }[];
};

export const SepoliaServices = ["Alchemy", "Ankr", "BlockPi", "PublicNode"] as const;
export type SepoliaService = (typeof SepoliaServices)[number];

export type SepoliaNetwork = {
  type: "sepolia";
  services: SepoliaService[];
};

export const MainnetServices = ["Alchemy", "Ankr", "BlockPi", "Cloudflare", "PublicNode"] as const;
export type MainnetService = (typeof MainnetServices)[number];

export type MainnetNetwork = {
  type: "mainnet";
  services: MainnetService[];
};

export const L2MainnetServices = ["Alchemy", "Ankr", "BlockPi", "PublicNode"] as const;
export type L2MainnetService = (typeof L2MainnetServices)[number];

export type ArbitrumOneNetwork = {
  type: "arbitrum";
  services: L2MainnetService[];
};

export type BaseMainnetNetwork = {
  type: "base";
  services: L2MainnetService[];
};

export type OptimismMainnetNetwork = {
  type: "optimism";
  services: L2MainnetService[];
};

export type NetworkJSON =
  | CustomNetwork
  | SepoliaNetwork
  | MainnetNetwork
  | ArbitrumOneNetwork
  | BaseMainnetNetwork
  | OptimismMainnetNetwork;

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
        if (!SepoliaServices.includes(s)) throw new Error("Invalid service type");

        return { [s]: null };
      });

      return {
        EthSepolia: services.length > 0 ? Some(services) : None,
      };
    }
    case "mainnet": {
      const services = network.services.map((s: any) => {
        if (!MainnetServices.includes(s)) throw new Error("Invalid service type");

        return { [s]: null };
      });

      return {
        EthMainnet: services.length > 0 ? Some(services) : None,
      };
    }
    case "arbitrum": {
      const services = network.services.map((s: any) => {
        if (!L2MainnetServices.includes(s)) throw new Error("Invalid service type");

        return { [s]: null };
      });

      return {
        ArbitrumOne: services.length > 0 ? Some(services) : None,
      };
    }
    case "base": {
      const services = network.services.map((s: any) => {
        if (!L2MainnetServices.includes(s)) throw new Error("Invalid service type");

        return { [s]: null };
      });

      return {
        BaseMainnet: services.length > 0 ? Some(services) : None,
      };
    }
    case "optimism": {
      const services = network.services.map((s: any) => {
        if (!L2MainnetServices.includes(s)) throw new Error("Invalid service type");

        return { [s]: null };
      });

      return {
        OptimismMainnet: services.length > 0 ? Some(services) : None,
      };
    }
    default:
      throw new Error("Invalid service type");
  }
};
