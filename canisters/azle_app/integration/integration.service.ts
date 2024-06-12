import { Opt, Record, StableBTreeMap, Vec, nat64, text } from "azle";

import { RpcServices } from "@bundly/ic-evm-rpc";

const Integration = Record({
  service: RpcServices,
  topics: Opt(Vec(Vec(text))),
  addresses: Vec(text),
  lastScrapedBlock: nat64,
});
type Integration = typeof Integration.tsType;

const integrations = StableBTreeMap<nat64, Integration>(20);

export class IntegrationService {
  public async add(data: Integration) {
    const nextId = integrations.len() + 1n;
    await integrations.insert(nextId, data);

    return { id: nextId };
  }

  public getAll() {
    return integrations;
  }

  public get(id: nat64) {
    return integrations.get(id);
  }

  public update(id: nat64, integration: Integration) {
    return integrations.insert(id, integration);
  }
}
