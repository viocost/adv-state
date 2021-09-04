import { StateMachine } from "./AdvStateMachine";
import {
  SMStateName,
  SMState,
  SMEvent,
  EventDescription,
  StateDescription,
  SMAction,
  StateMap,
} from "./types";
import { actionsAsArray, asArray } from "./util";

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
  enabledSubstate?: State;

  substates: Map<SMStateName, State> = new Map();
  logger: any;
  parallel: boolean = false;

  // Reference for initial substate
  initialSubstate?: State;

  // Reference for history substate
  historySubstate?: State;

  constructor(
    private stateMachine: StateMachine,
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

    const stateKeys = Array.from(Object.keys(states));

    this.substates = new Map(
      stateKeys.map((key) => [
        key,
        new State(this.stateMachine, key, states[key], this),
      ])
    );

    this.initialSubstate = stateKeys.reduce(
      (acc, stateId) =>
        states[stateId].initial ? this.substates[stateId] : acc,
      undefined
    );
  }

  printUnderlyingMap(indent = 0) {
    console.log(`${" ".repeat(indent)}${this.name}`);
    for (const [_, state] of this.substates) {
      state.printUnderlyingMap(indent + 2);
    }
  }

  withdraw(eventName: SMEvent, eventArgs: any) {
    // Call substates to withdraw
    if (this.enabledSubstate) {
      this.enabledSubstate.withdraw(eventName, eventArgs);
      this.setEnabledSubstate(undefined);
    }

    // Perform exit actions
    this.performExitActions(eventName, eventArgs);
    this.sendExitMessage(eventArgs);

    // Set itself off
    this.setEnabled(false);
  }

  resume(eventName?: SMEvent, eventArgs?: any) {
    // set myself enabled
    this.setEnabled(true);

    // call entry actions
    this.sendEntryMessage(eventArgs);
    this.performEntryActions(eventName, eventArgs);

    // call resume on child state that must be activated
    // We should either resume initial child,
    // or the last tha has been active,
    // or specified
    // but for now only initial
    this.initialSubstate.resume(eventName, eventArgs);

    this.setEnabledSubstate(this.initialSubstate);
    this.setHistorySubstate(this.initialSubstate);
  }

  setEnabledSubstate(state?: State) {
    this.enabledSubstate = state;
  }

  setHistorySubstate(state?: State) {
    this.historySubstate = state;
  }

  setEnabled(isEnabled: boolean) {
    this.enabled = isEnabled;
  }

  //This function called by child state
  performTransition(
    newStateName: SMStateName,
    eventName: SMEvent,
    eventArgs?: any
  ) {
    // set childState to inactive
    this.setEnabledSubstate(undefined);

    // resume new state to active
    const newState = this.substates.get(newStateName);
    newState.resume(eventName, eventArgs);

    // set new state to active
    this.setEnabledSubstate(newState);
    this.setHistorySubstate(newState);
  }

  private performExitActions(eventName: SMEvent, eventArgs?: any) {
    const exitActions = actionsAsArray(this.config.exit);

    this.performActions(exitActions, eventName, eventArgs);
  }

  private performEntryActions(eventName: SMEvent, eventArgs?: any) {
    const entryActions = actionsAsArray(this.config.entry);

    this.performActions(entryActions, eventName, eventArgs);
  }

  private performActions(
    actions: Array<SMAction>,
    eventName: SMEvent,
    eventArgs?: any
  ) {
    for (let action of actions) {
      action.call(null, null, eventName, eventArgs);
    }
  }

  processEvent(eventName: SMEvent, eventArgs?: any) {
    this.logProcessEventStart(eventName, eventArgs);

    let eventDescription = this.getEventDescription(eventName, eventArgs);

    //perform exit actions if transition
    this.withdrawOnTransition(eventDescription, eventName, eventArgs);

    //Execute transition actions / send message
    this.executeEvent(eventDescription, eventName, eventArgs);

    //if transition ask parent state to perform transition
    this.requestTransitionOnTransition(eventDescription, eventName, eventArgs);
  }

  withdrawOnTransition(
    eventDescription: EventDescription,
    eventName: SMEvent,
    eventArgs: any
  ) {
    if (eventDescription.toState) {
      this.withdraw(eventName, eventArgs);
    }
  }

  private executeEvent(
    eventDescription: EventDescription,
    eventName: SMEvent,
    eventArgs?: any
  ) {
    const { actions, message } = eventDescription;

    this.stateMachine.dispatchMessage(message, eventArgs);

    this.performOnTransitionActions(
      actionsAsArray(actions),
      eventName,
      eventArgs
    );
  }

  requestTransitionOnTransition(
    eventDescription: EventDescription,
    eventName: SMEvent,
    eventArgs: any
  ) {
    if (eventDescription.toState) {
      this.parent.performTransition(
        eventDescription.toState,
        eventName,
        eventArgs
      );
    }
  }

  sendEntryMessage(eventArgs?: any) {
    this.stateMachine.dispatchMessage(this.config.entryMessage, eventArgs);
  }

  sendExitMessage(eventArgs?: any) {
    this.stateMachine.dispatchMessage(this.config.exitMessage, eventArgs);
  }

  sendTransitionMessage(event: EventDescription, eventArgs?: any) {
    this.stateMachine.dispatchMessage(event.message, eventArgs);
  }

  private performOnTransitionActions(
    actions: Array<SMAction>,
    eventName: SMEvent,
    eventArgs: any
  ) {
    if (actions.length === 0) return;

    //this.logPerformingActions(ActionType.Transition, this.state, eventName);
    this.performActions(actionsAsArray(actions), eventName, eventArgs);
  }

  getEventDescription(eventName: SMEvent, eventArgs?: any) {
    let descriptions = this.validateSingleLegalDescriptions(
      this.getGuardsPassingEventDescriptions(eventName, eventArgs)
    );

    this.logEventDescription(eventName, descriptions[0]);

    return descriptions[0];
  }

  validateSingleLegalDescriptions(descriptions: Array<EventDescription>) {
    if (descriptions.length > 1) {
      throw new Error("More than one transition error");
    }

    return descriptions;
  }

  getGuardsPassingEventDescriptions(eventName: SMEvent, eventArgs: any) {
    return asArray(this.config.events[eventName]).filter((description) =>
      this.areGuardsPassed(description, eventName, eventArgs)
    );
  }

  areGuardsPassed(
    evDescription: EventDescription,
    eventName: SMEvent,
    eventArgs: any
  ) {
    return actionsAsArray(evDescription.guards).reduce(
      (res, guard) => guard.call(null, null, eventName, eventArgs) && res,
      true
    );
  }

  logEventDescription(eventName: SMEvent, eventDescription?: EventDescription) {
    this.stateMachine.logger.info(
      `  NO VALID ACTION FOUND for ${String(eventName)}`
    );
  }

  logProcessEventStart(eventName: SMEvent, eventArgs?: any) {}

  private logPerformingActions(
    context: string,
    state: SMStateName,
    eventName: SMEvent
  ) {
    /////////////////////////////////////////////////////////////////////////////////////////////////////
    // `%c ${this.name}: Calling ${context} actions for state ${state}  || Event name: ${eventName} `, //
    // "color: #c45f01; font-size: 13px; font-weight: 600; "                                           //
    /////////////////////////////////////////////////////////////////////////////////////////////////////
  }
  /*
  private performExitActions(eventName, eventArgs)(
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
    this.performExitActions(eventName, eventArgs)(eventName, newState, eventArgs);

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
