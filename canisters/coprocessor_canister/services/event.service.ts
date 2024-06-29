import { Opt, Record, StableBTreeMap, Vec, nat64, text } from "azle";

import { RpcServices } from "@bundly/ic-evm-rpc";

export const Event = Record({
  service: RpcServices,
  topics: Opt(Vec(Vec(text))),
  addresses: Vec(text),
  lastScrapedBlock: nat64,
});
export type Event = typeof Event.tsType;

const events = StableBTreeMap<nat64, Event>(20);

export class EventService {
  public async add(data: Event) {
    const nextId = events.len() + 1n;
    events.insert(nextId, data);

    return { id: nextId };
  }

  public getAll() {
    return events.items();
  }

  public get(id: nat64) {
    return events.get(id);
  }

  public update(id: nat64, contract: Event) {
    return events.insert(id, contract);
  }
}
