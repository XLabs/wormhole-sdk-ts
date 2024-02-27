import { MoveValue, SuiObjectResponse, SuiTransactionBlockResponse } from "@mysten/sui.js/client";
import { PlatformToChains, UniversalOrNative } from "@wormhole-foundation/connect-sdk";
import { normalizeSuiType } from "./address";

export const _platform: "Sui" = "Sui";
export type SuiPlatformType = typeof _platform;

export type SuiChains = PlatformToChains<SuiPlatformType>;
export type UniversalOrSui = UniversalOrNative<SuiChains>;
export type AnySuiAddress = UniversalOrSui | string | Uint8Array;

export type SuiBuildOutput = {
  modules: string[];
  dependencies: string[];
};

export const getFieldsFromObjectResponse = (object: SuiObjectResponse) => {
  const content = object.data?.content;
  return content && content.dataType === "moveObject" ? content.fields : null;
};

export const isSameType = (a: string, b: string) => {
  try {
    return normalizeSuiType(a) === normalizeSuiType(b);
  } catch {
    return false;
  }
};

// Event typeguard helpers
export const isSuiCreateEvent = <
  T extends NonNullable<SuiTransactionBlockResponse["objectChanges"]>[number],
  K extends Extract<T, { type: "created" }>,
>(
  event: T,
): event is K => event?.type === "created";

export const isSuiPublishEvent = <
  T extends NonNullable<SuiTransactionBlockResponse["objectChanges"]>[number],
  K extends Extract<T, { type: "published" }>,
>(
  event: T,
): event is K => event?.type === "published";

//
// MoveStruct typeguard helpers
//
export function isMoveStructArray(value: any): value is MoveValue[] {
  return Array.isArray(value);
}
export function isMoveStructStruct(
  value: any,
): value is { fields: { [key: string]: MoveValue }; type: string } {
  return !Array.isArray(value) && typeof value === "object" && "fields" in value && "type" in value;
}
export function isMoveStructObject(value: any): value is { [key: string]: MoveValue } {
  return typeof value === "object" && !isMoveStructArray(value) && !isMoveStructStruct(value);
}