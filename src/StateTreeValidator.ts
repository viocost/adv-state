import { State } from "./State";
import {
  InitialStateError,
  InvalidActionType,
  InvalidTransition,
} from "./StateMachineError";
import {
  EventDescription,
  SMAction,
  SMEvents,
  SMStateName,
  StateVisitor,
} from "./types";
import { asArray } from "./util";

export class StateTreeValidator implements StateVisitor {
  enterState(state: State) {
    this.validateActions(state.config.entry);
    this.validateActions(state.config.exit);
    this.validateEvents(state, state.config?.events);
    this.validateInitialSubstate(state);
  }

  exitState(...args: any) {}

  validateEvents(state: State, events?: SMEvents) {
    if (!events) return;

    for (const name in events) {
      this.validateEventDescriptions(state, events[name]);
    }
  }

  validateInitialSubstate(state: State) {
    if (state.isLeafState) return;

    const initialCount = Array.from(state.substates.values()).reduce(
      (acc, substate) => (substate.initial ? acc + 1 : acc),
      0
    );

    if (initialCount !== 1) {
      throw new InitialStateError(
        `There must be exactly ONE initial state. Got ${initialCount}`
      );
    }
  }

  validateEventDescriptions(
    state: State,
    description: EventDescription | Array<EventDescription>
  ) {
    asArray(description).forEach((description) => {
      this.validateStateTransition(state, description.toState);
      this.validateActions(description.actions);
      this.validateActions(description.guards);
    });
  }

  validateStateTransition(state: State, toState: SMStateName) {
    if (!state.parent.substates.has(toState)) {
      throw new InvalidTransition(
        `${state.name} -X ${toState}: ${state.parent.name} doesn't have substate ${toState}`
      );
    }
  }

  validateActions(actions?: SMAction | Array<SMAction>) {
    if (!actions) return;

    asArray(actions).forEach((action) => {
      if (typeof action !== "function") {
        throw new InvalidActionType(`${typeof action}`);
      }
    });
  }
}
