import {
  Canister,
  Null,
  Opt,
  Principal,
  Record,
  Variant,
  Vec,
  bool,
  int64,
  nat,
  nat16,
  nat64,
  text,
  update,
} from "azle";

export const LogEntry = Record({
  transactionHash: Opt(text),
  blockNumber: Opt(nat),
  data: text,
  blockHash: Opt(text),
  transactionIndex: Opt(nat),
  topics: Vec(text),
  address: text,
  logIndex: Opt(nat),
  removed: bool,
});
export type LogEntry = typeof LogEntry.tsType;

const JsonRpcError = Record({
  code: int64,
  message: text,
});

const ProviderError = Variant({
  TooFewCycles: Record({ expected: nat, received: nat }),
  MissingRequiredProvider: Null,
  ProviderNotFound: Null,
  NoPermission: Null,
});

const ValidationError = Variant({
  Custom: text,
  HostNotAllowed: text,
  UrlParseError: text,
  InvalidHex: text,
  CredentialPathNotAllowed: Null,
  CredentialHeaderNotAllowed: Null,
});

const RejectionCode = Variant({
  NoError: Null,
  CanisterError: Null,
  SysTransient: Null,
  DestinationInvalid: Null,
  Unknown: Null,
  SysFatal: Null,
  CanisterReject: Null,
});

const HttpOutcallError = Variant({
  IcError: Record({ code: RejectionCode, message: text }),
  InvalidHttpJsonRpcResponse: Record({
    status: nat16,
    body: text,
    parsingError: Opt(text),
  }),
});

const RpcError = Variant({
  JsonRpcError: JsonRpcError,
  ProviderError: ProviderError,
  ValidationError: ValidationError,
  HttpOutcallError: HttpOutcallError,
});

const GetLogsResult = Variant({ Ok: Vec(LogEntry), Err: RpcError });

export const HttpHeader = Record({ value: text, name: text });

export const RpcApi = Record({ url: text, headers: Opt(Vec(HttpHeader)) });
export type RpcApi = typeof RpcApi.tsType;

const EthSepoliaService = Variant({
  Alchemy: Null,
  Ankr: Null,
  BlockPi: Null,
  PublicNode: Null,
});

const EthMainnetService = Variant({
  Alchemy: Null,
  Ankr: Null,
  BlockPi: Null,
  Cloudflare: Null,
  PublicNode: Null,
});

const L2MainnetService = Variant({
  Alchemy: Null,
  Ankr: Null,
  BlockPi: Null,
  PublicNode: Null,
});

export const RpcService = Variant({
  Chain: nat64,
  Provider: nat64,
  Custom: RpcApi,
  EthSepolia: EthSepoliaService,
  EthMainnet: EthMainnetService,
  ArbitrumOne: L2MainnetService,
  BaseMainnet: L2MainnetService,
  OptimismMainnet: L2MainnetService,
});

export const RpcServices = Variant({
  Custom: Record({
    chainId: nat64,
    services: Vec(RpcApi),
  }),
  EthSepolia: Opt(Vec(EthSepoliaService)),
  EthMainnet: Opt(Vec(EthMainnetService)),
  ArbitrumOne: Opt(Vec(L2MainnetService)),
  BaseMainnet: Opt(Vec(L2MainnetService)),
  OptimismMainnet: Opt(Vec(L2MainnetService)),
});
export type RpcServices = typeof RpcServices.tsType;

const RpcConfig = Record({ responseSizeEstimate: Opt(nat64) });

export const BlockTag = Variant({
  Earliest: Null,
  Safe: Null,
  Finalized: Null,
  Latest: Null,
  Number: nat,
  Pending: Null,
});
export type BlockTag = typeof BlockTag.tsType;

const Topic = Vec(text);

export const GetLogsArgs = Record({
  fromBlock: Opt(BlockTag),
  toBlock: Opt(BlockTag),
  addresses: Vec(text),
  topics: Opt(Vec(Topic)),
});
export type GetLogsArgs = typeof GetLogsArgs.tsType;

const Block = Record({
  miner: text,
  totalDifficulty: nat,
  receiptsRoot: text,
  stateRoot: text,
  hash: text,
  difficulty: nat,
  size: nat,
  uncles: Vec(text),
  baseFeePerGas: nat,
  extraData: text,
  transactionsRoot: Opt(text),
  sha3Uncles: text,
  nonce: nat,
  number: nat,
  timestamp: nat,
  transactions: Vec(text),
  gasLimit: nat,
  logsBloom: text,
  parentHash: text,
  gasUsed: nat,
  mixHash: text,
});

const GetBlockByNumberResult = Variant({ Ok: Block, Err: RpcError });

const MultiGetBlockByNumberResult = Variant({
  Consistent: GetBlockByNumberResult,
  Inconsistent: Vec(Record({ RpcService, GetBlockByNumberResult })),
});

export const MultiGetLogsResult = Variant({
  Consistent: GetLogsResult,
  Inconsistent: Vec(Record({ RpcService, GetLogsResult })),
});
export type MultiGetLogsResult = typeof MultiGetLogsResult.tsType;

export const EvmRpc = Canister({
  eth_getBlockByNumber: update([RpcServices, Opt(RpcConfig), BlockTag], MultiGetBlockByNumberResult),
  eth_getLogs: update([RpcServices, Opt(RpcConfig), GetLogsArgs], MultiGetLogsResult),
})(Principal.fromText("7hfb6-caaaa-aaaar-qadga-cai"));