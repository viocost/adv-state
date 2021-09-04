import { State } from "./State";
import { SMEvent, SMVisitor } from "./types";

export class EventMapper implements SMVisitor {
  private eventMap: Map<SMEvent, State> = new Map();

  enterStateMachine(...args: any) {}
  exitStateMachine(...args: any) {}
  exitState(...args: any) {}

  enterState(state: State) {
    for (const event of Array.from(Object.keys(state.config.events || {}))) {
      this.eventMap.set(event, state);
    }
  }

  getMap() {
    return this.eventMap;
  }
}
