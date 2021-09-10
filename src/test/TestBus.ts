import StateMachine from "../AdvStateMachine";
import { SMMessageBusMessage } from "../types";
import { EventEmitter } from "events";

export class FakeMBus extends EventEmitter {
  receivedMessages = [];
  receivedPayloads = [];
  sm: StateMachine;
  subscribe(sm: StateMachine) {
    this.sm = sm;
  }

  deliver(msg: SMMessageBusMessage, ...rest: any) {
    const [mName, payload] = msg;
    this.emit(mName as string, payload);
    this.receivedMessages.push(mName);
    this.receivedPayloads.push(payload);
  }
}
