import { SMMessageBus } from "./types";

export class FakeBus implements SMMessageBus {
  subscribe(...args: any) {}
  deliver(...args: any) {}
}
