import { None, Opt, Record, Some, StableBTreeMap, Vec, nat64, text } from "azle";

import { RpcServices } from "@bundly/ic-evm-rpc";

import { CreateServicesData, ServicesFactory } from "../models/services-factory";

export const Event = Record({
  services: RpcServices,
  topics: Opt(Vec(Vec(text))),
  addresses: Vec(text),
  lastScrapedBlock: nat64,
});
export type Event = typeof Event.tsType;

export type AddNewEventData = {
  services: CreateServicesData;
  topics?: string[][];
  addresses: string[];
};

const events = StableBTreeMap<nat64, Event>(20);

export class EventService {
  public async add(data: AddNewEventData) {
    try {
      const nextId = events.len() + 1n;

      const services = ServicesFactory.create(data.services);

      const newEvent = {
        services,
        addresses: data.addresses,
        topics: data.topics ? Some(data.topics) : None,
        lastScrapedBlock: 0n,
      };

      events.insert(nextId, newEvent);

      return { id: nextId };
    } catch (error) {
      throw new Error("Error adding event");
    }
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
