import type { Layout, LayoutToType } from "@wormhole-foundation/sdk-base";

import type { PayloadLiteral, ComposeLiteral } from "./registration.js";
import type { ProtocolName } from "../protocol.js";
import type { DecomposeLiteral, Payload } from "./vaa.js";
import { envelopeLayout } from "./vaa.js";

export const schnorrSignatureLayout = [
  {name: "r", binary: "bytes", size: 20},
  {name: "s", binary: "bytes", size: 32},
] as const satisfies Layout;

export const headerV2Layout = [
  {name: "version",         binary: "uint",  size: 1, custom: 2 },
  {name: "schnorrKeyIndex", binary: "uint",  size: 4 },
  {name: "signature",       binary: "bytes", layout: schnorrSignatureLayout },
] as const satisfies Layout;

export type HeaderV2 = LayoutToType<typeof headerV2Layout>;

export const baseV2Layout = [
  ...headerV2Layout,
  ...envelopeLayout,
] as const satisfies Layout;

type VAAV2Base = LayoutToType<typeof baseV2Layout>;
export type VAAV2Header = LayoutToType<typeof headerV2Layout>;

/**
 * A VAA is a Verifiable Action Assertion, a signed message that contains
 * information about an action that has occurred on a chain.
 *
 * See {@link https://docs.wormhole.com/wormhole/explore-wormhole/vaa | this link} for more.
 *
 */
export interface VAAV2<PL extends PayloadLiteral = PayloadLiteral> extends VAAV2Base {
  readonly protocolName: DecomposeLiteral<PL>[0];
  readonly payloadName: DecomposeLiteral<PL>[1];
  readonly payloadLiteral: PL;
  readonly payload: Payload<PL>;
  //TODO various problems with storing the hash here:
  // 1. On EVM the core bridge actually uses the double keccak-ed hash because of an early oversight
  // 2. As discussed on slack, storing memoized values on an object is a smell too
  //kept as is for now to get something usable out there, but this should receive more thought once
  //  the SDK has matured a little further.
  readonly hash: Uint8Array;
}

//We enforce distribution over union types, e.g. have
//    ProtocolVAA<"TokenBridge", "Transfer" | "TransferWithPayload">
//  turned into
//    VAA<"TokenBridge:Transfer"> | VAA<"TokenBridge:TransferWithPayload">
//  rather than
//    VAA<"TokenBridge:Transfer" | "TokenBridge:TransferWithPayload">
//  because while the latter is considered more idiomatic/canonical, it actually interferes with
//  the most natural way to narrow VAAs via querying the payloadName or payloadLiteral.
//  (Thanks for absolutely nothing, Typescript).
//  For example, given the TokenBridge VAA union example:
//  if (vaa.payloadName === "Transfer")
//    typeof vaa //no narrowing - still resolves to the union type when using the latter approach
export type DistributiveVAAV2<PL extends PayloadLiteral> = PL extends PayloadLiteral
  ? VAAV2<PL>
  : never;

/** A  utility type that maps a protocol and payload name to its defined structure */
export type ProtocolVAAV2<PN extends ProtocolName, PayloadName extends string> = ComposeLiteral<
  PN,
  PayloadName,
  PayloadLiteral
> extends infer PL extends PayloadLiteral
  ? DistributiveVAAV2<PL>
  : never;