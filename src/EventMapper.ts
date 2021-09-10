import { State } from "./State";
import { SMEvent, SMVisitor } from "./types";
import StateMachineVisitor from "./AbstractVisitor";

export class EventMapper extends StateMachineVisitor implements SMVisitor {
  private eventSet: Set<SMEvent> = new Set();

  enterState(state: State) {
    for (const event of Array.from(Object.keys(state.config.events || {}))) {
      this.eventSet.add(event);
    }
  }

  getSet(): Set<SMEvent> {
    return this.eventSet;
  }
}
