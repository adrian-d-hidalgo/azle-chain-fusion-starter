import { nat64 } from "azle/experimental";

import { Event, EventStore } from "../database/database";

export class EventService {
  constructor(private readonly events: EventStore) {}

  public async add(data: Event) {
    const nextId = this.events.len() + 1n;
    this.events.insert(nextId, data);

    return { id: nextId };
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
