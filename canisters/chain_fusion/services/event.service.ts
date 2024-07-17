import { None, Some, nat64 } from "azle";

import { Event, EventStore } from "../database/database";
import { CreateServicesData, ServicesFactory } from "../models/services-factory";

export type AddNewEventData = {
  services: CreateServicesData;
  topics?: string[][];
  addresses: string[];
};

export class EventService {
  constructor(private readonly events: EventStore) {}

  public async add(data: AddNewEventData) {
    try {
      const nextId = this.events.len() + 1n;

      const services = ServicesFactory.fromJson(data.services);

      const newEvent = {
        services,
        addresses: data.addresses,
        topics: data.topics ? Some(data.topics) : None,
        lastScrapedBlock: 0n,
      };

      this.events.insert(nextId, newEvent);

      return { id: nextId };
    } catch (error) {
      throw new Error("Error adding event");
    }
  }

  public getAll() {
    return this.events.items();
  }

  public get(id: nat64) {
    return this.events.get(id);
  }

  public update(id: nat64, contract: Event) {
    return this.events.insert(id, contract);
  }
}
