import { SMAction } from "./types";

export function actionsAsArray(
  actions?: SMAction | Array<SMAction>
): Array<SMAction> {
  return actions ? asArray<SMAction>(actions) : [];
}

export function asArray<T = any>(candidate: T | Array<T>): Array<T> {
  return Array.isArray(candidate) ? candidate : [candidate];
}
