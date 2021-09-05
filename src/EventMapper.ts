import { State } from "./State";
import { EventMap, SMEvent, SMVisitor } from "./types";
import { DuplicateEventName } from "./StateMachineError";
import StateMachineVisitor from "./AbstractVisitor";

export class EventMapper extends StateMachineVisitor implements SMVisitor {
  private eventMap: EventMap = {};

  enterState(state: State) {
    for (const event of Array.from(Object.keys(state.config.events || {}))) {
      this.validateEventName(event, state);
      this.eventMap[event] = state;
    }
  }

  getMap() {
    return this.eventMap;
  }

  validateEventName(event: SMEvent, state: State) {
    if (event in this.eventMap) {
      throw new DuplicateEventName(
        `Event ${String(event)}, States: ${state.name}, ${
          this.eventMap[event].name
        }`
      );
    }
  }
}
