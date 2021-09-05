import { StateMachineVisitor } from "./AbstractVisitor";
import { State } from "./State";
import { SMStateName, SMVisitor } from "./types";

export class StateGetter extends StateMachineVisitor implements SMVisitor {
  private states: Array<SMStateName> = [];

  enterState(state: State) {
    if (state.enabled) {
      this.states.push(state.name);
    }
  }

  asString() {
    return this.states.join(".");
  }

  asArray() {
    return this.states;
  }
}
