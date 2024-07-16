import { None, Some } from "azle";

import { RpcServices } from "@bundly/ic-evm-rpc";

export type CreateCustomServicesData = {
  name: "custom";
  chainId: number;
  services: { url: string; headers?: { value: string; name: string }[] }[];
};

export type CreateSepoliaServicesData = {
  name: "sepolia";
  chainId: number;
};

export type CreateServicesData = CreateCustomServicesData;

export class ServicesFactory {
  public static create(data: CreateServicesData): RpcServices {
    switch (data.name) {
      case "custom": {
        const services = data.services.map((s) => {
          const headers = s.headers
            ? s.headers.map((header) => {
                return { name: header.name, value: header.value };
              })
            : undefined;

          return { url: s.url, headers: headers ? Some(headers) : None };
        });

        return {
          Custom: {
            chainId: BigInt(data.chainId),
            services,
          },
        };
      }
      default: {
        throw new Error("Unknown services type");
      }
    }
  }
}
