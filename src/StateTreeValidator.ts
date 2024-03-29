import StateMachineVisitor from "./AbstractVisitor";
import { IState } from "./types";
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
  SMVisitor,
} from "./types";
import { asArray } from "./util";

export class StateTreeValidator
  extends StateMachineVisitor
  implements SMVisitor
{
  enterState(state: IState) {
    this.validateActions(state.config.entry);
    this.validateActions(state.config.exit);
    this.validateEvents(state, state.config?.events);
    this.validateInitialSubstate(state);
  }

  validateEvents(state: IState, events?: SMEvents) {
    if (!events) return;

    for (const name in events) {
      this.validateEventDescriptions(state, events[name]);
    }
  }

  validateInitialSubstate(state: IState) {
    if (state.isLeafState || state.parallel) return;

    const initialCount = Array.from(Object.values(state.substates)).reduce(
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
    state: IState,
    description: EventDescription | Array<EventDescription>
  ) {
    asArray(description).forEach((description) => {
      this.validateStateTransition(state, description.toState);
      this.validateActions(description.actions);
      this.validateActions(description.guards);
    });
  }

  validateStateTransition(state: IState, toState: SMStateName) {
    if (toState && !state.parent.substates[toState]) {
      throw new InvalidTransition(
        `Transition ${state.name} -> ${toState}: ${state.parent.name} doesn't have substate ${toState}`
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
