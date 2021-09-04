import { State } from "./State";
import { SMEvent, StateVisitor } from "./types";
import { DuplicateEventName } from "./StateMachineError";

export class EventMapper implements StateVisitor {
  private eventMap: Map<SMEvent, State> = new Map();

  enterState(state: State) {
    for (const event of Array.from(Object.keys(state.config.events || {}))) {
      this.validateEventName(event, state);
      this.eventMap.set(event, state);
    }
  }

  exitState(...args: any) {}

  getMap() {
    return this.eventMap;
  }

  validateEventName(event: SMEvent, state: State) {
    if (this.eventMap.has(event)) {
      throw new DuplicateEventName(
        `Event ${String(event)}, States: ${state.name}, ${
          this.eventMap.get(event).name
        }`
      );
    }
  }
}
