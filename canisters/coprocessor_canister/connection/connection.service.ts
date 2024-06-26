import { Opt, Record, StableBTreeMap, Vec, nat64, text } from "azle";

import { RpcServices } from "@bundly/ic-evm-rpc";

const Connection = Record({
  service: RpcServices,
  topics: Opt(Vec(Vec(text))),
  addresses: Vec(text),
  lastScrapedBlock: nat64,
});
type Connection = typeof Connection.tsType;

const connections = StableBTreeMap<nat64, Connection>(20);

export class ConnectionService {
  public async add(data: Connection) {
    const nextId = connections.len() + 1n;
    connections.insert(nextId, data);

    return { id: nextId };
  }

  public getAll() {
    return connections;
  }

  public get(id: nat64) {
    return connections.get(id);
  }

  public update(id: nat64, contract: Connection) {
    return connections.insert(id, contract);
  }
}
