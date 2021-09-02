import {
  SMStateName,
  SMState,
  SMEvent,
  EventDescription,
  StateDescription,
  SMEvents,
  SMMessageName,
  SMAction,
  StateMap,
} from "./types";
import { actionsAsArray } from "./util";

/**
 * A state is ultimately a set of transition actions event handlers and guard conditions
 *
 * When event is sent to the machine,
 * machine should find a state node that can handle that event.
 *
 * Once state node is found event processing begins on its parent.
 * Transition can only happen withing the same parent, other transitions are illegal
 *
 * Event processing:
 * First we find the right event descriptor by evaluating guards
 *
 * With descriptor:
 * If there are just actions - then they are executed.
 *
 * If it is a transition, then we do following
 *
 * 1. We call children nodes that are active to withdraw and  perform exit actions
 * 2. Get new state node, ask it to recursevly resume
 *
 * What happens when some handler throws error? global state handling
 *
 *  */

export class State implements SMState {
  enabled: boolean = false;

  substates: Map<SMStateName, State> = new Map();
  logger: any;
  parallel: boolean = false;

  // Reference for initial substate
  initialSubstate?: SMState;

  // Reference for history substate
  historySubstate?: SMState;

  constructor(
    public name: SMStateName,
    public config: StateDescription,
    public parent?: State
  ) {
    this.createSubstates(config.states);
  }

  private createSubstates(states?: StateMap) {
    if (!states) {
      return;
    }

    this.substates = new Map(
      Array.from(Object.keys(states)).map((key) => [
        key,
        new State(key, states[key], this),
      ])
    );
  }

  printUnderlyingMap(indent = 0) {
    console.log(`${" ".repeat(indent)}${this.name}`);
    for (const [_, state] of this.substates) {
      state.printUnderlyingMap(indent + 2);
    }
  }

  withdraw() {
    // Call substates to withdraw
    // Perform exit actions
    // Set itself off
  }

  /**
   * 1. perform entry actions
   * */
  resume() {
    // set myself enabled
    this.setEnabled(true);

    // call entry actions
    // call resume on child state that must be activated
  }

  setEnabled(isEnabled: boolean) {
    this.enabled = isEnabled;
  }

  //This function called by child state
  performTransition(childStateName: SMStateName, newStateName: SMStateName) {
    // set childState to inactive
    // set new state to active
    // call resume on new state
  }

  private performEntryActions(
    eventName: SMEvent,
    newState: SMStateName,
    eventArgs: any
  ) {
    const entryActions = actionsAsArray(this.config.entry);
    if (entryActions.length === 0) return;

    //this.logPerformingActions(ActionType.Entry, this.state, eventName);
    this.performActions(entryActions, eventName, eventArgs);
  }

  private performActions(
    actions: Array<SMAction>,
    eventName: SMEvent,
    eventArgs?: any
  ) {
    for (let action of actions) {
      //This validation must happen at initialization
      ///////////////////////////////////////////////////////
      // if (typeof action !== "function") {               //
      //   this.error = true;                              //
      //   throw new err.actionTypeInvalid(typeof action); //
      // }                                                 //
      ///////////////////////////////////////////////////////
      action.call(this.contextObject, this, eventName, eventArgs);
    }
  }

  processEvent() {}

  /*
  private performExitActionsOnTransition(
    eventName: SMEvent,
    newState?: SMStateName,
    eventArgs?: any
  ) {
    const exitActions = actionsAsArray(this.stateMap[this.state].exit);

    if (!newState || exitActions.length === 0) {
      return;
    }

    this.logPerformingActions(ActionType.Exit, this.state, eventName);

    this.ensureLegalState(newState as SMStateName);

    this.performActions(exitActions, eventName, eventArgs);
  }


  /**
   * This function is called whenever stateMachine.handle.someTransition() called
   * If the event doesn't require a state transition, then only guards and actions are
   * executed, otherwise, state exit actions and new state entry actions will be executed
   */

  /*
  processEvent(eventName: SMEvent, eventArgs?: any) {
    this.logProcessEventStart(eventName, eventArgs);

    let eventDescription = this.getEventDescription(eventName, eventArgs);
    this.executeEvent(eventDescription, eventName, eventArgs);
  }

  private executeEvent(
    eventDescription: EventDescription,
    eventName: SMEvent,
    eventArgs?: any
  ) {
    const { actions, toState: newState } = eventDescription;

    this.sendStateMessage(this.state, MessageType.Exit, eventArgs);
    this.performExitActionsOnTransition(eventName, newState, eventArgs);

    this.performOnTransitionActions(
      actionsAsArray(actions),
      eventName,
      eventArgs
    );
    this.sendMessageOnEvent(eventDescription.message, eventArgs);

    this.setNewState(newState);
    this.sendStateMessage(this.state, MessageType.Entry, eventArgs);
    this.performEntryActions(eventName, newState, eventArgs);
  }

  private performOnTransitionActions(
    actions: Array<SMAction>,
    eventName: SMEvent,
    eventArgs: any
  ) {
    if (actions.length === 0) return;

    this.logPerformingActions(ActionType.Transition, this.state, eventName);
    this.performActions(actionsAsArray(actions), eventName, eventArgs);
  }

  private performEntryActions(
    eventName: SMEvent,
    newState: SMStateName,
    eventArgs: any
  ) {
    const entryActions = actionsAsArray(this.stateMap[newState].entry);
    if (entryActions.length === 0) return;

    this.logPerformingActions(ActionType.Entry, this.state, eventName);
    this.performActions(entryActions, eventName, eventArgs);
  }
  */
}
