import { Null, Opt, Record, StableBTreeMap, Variant, Vec, nat, nat8, nat64, text } from "azle";

import { LogEntry, RpcServices } from "@bundly/ic-evm-rpc";

// App Config
export const AppConfig = Record({
  ecdsaKeyId: Opt(
    Record({
      name: text,
      curve: text,
    })
  ),
  evmAddress: Opt(text),
  nonce: nat,
});
export type AppConfig = typeof AppConfig.tsType;

export const AppConfigStore = StableBTreeMap<nat8, typeof AppConfig.tsType>(0);
export type AppConfigStore = typeof AppConfigStore;

// Events
export const Event = Record({
  services: RpcServices,
  topics: Opt(Vec(Vec(text))),
  addresses: Vec(text),
  lastScrapedBlock: nat64,
});
export type Event = typeof Event.tsType;

export const EventStore = StableBTreeMap<nat64, Event>(1);
export type EventStore = typeof EventStore;

// Logs
export const Log = Record({
  log: LogEntry,
  eventId: nat,
  status: Variant({ Pending: Null, Processed: Null }),
});
export type Log = typeof Log.tsType;

export const LogStore = StableBTreeMap<nat, Log>(2);
export type LogStore = typeof LogStore;
