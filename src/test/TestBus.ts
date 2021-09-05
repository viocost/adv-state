import StateMachine from "../AdvStateMachine";
import { SMMessageBusMessage } from "../types";
import { EventEmitter } from "events";

export class FakeMBus extends EventEmitter {
  receivedMessages = [];
  receivedPayloads = [];
  sm: StateMachine;
  subscribe(sm: StateMachine) {
    console.log("Subscribe called");
    this.sm = sm;
  }

  deliver(msg: SMMessageBusMessage, ...rest: any) {
    console.log("DELIVER CALLED");
    const [mName, payload] = msg;
    this.emit(mName as string, payload);
    this.receivedMessages.push(mName);
    this.receivedPayloads.push(payload);
  }
}
