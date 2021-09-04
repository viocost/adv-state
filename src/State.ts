import { StateMachine } from "./AdvStateMachine";
import {
  SMStateName,
  SMState,
  SMEvent,
  EventDescription,
  StateDescription,
  SMAction,
  StateMap,
  Visitable,
  SMVisitor,
  StateVisitor,
  Substates,
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

export class State implements SMState, Visitable {
  enabled: boolean = false;
  enabledSubstate?: State;

  substates: Substates = {};
  logger: any;
  parallel: boolean = false;
  initial: boolean = false;
  isLeafState: boolean;

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
    this.stateMachine.logger.debug(`Initializing state ${name}`);
    this.initial = !!config.initial;
    this.createSubstates(config.states);
    this.isLeafState = Object.keys(this.substates).length === 0;
  }

  accept(visitor: StateVisitor | SMVisitor) {
    visitor.enterState(this);
    for (let substate of Object.values(this.substates)) {
      substate.accept(visitor);
    }
    visitor.exitState(this);
  }

  private createSubstates(states?: StateMap) {
    if (!states) {
      return;
    }

    const stateKeys = Array.from(Object.keys(states));

    this.substates = stateKeys.reduce(
      (acc, key) => ({
        ...acc,
        [key]: new State(this.stateMachine, key, states[key], this),
      }),
      {} as Substates
    );

    this.initialSubstate = stateKeys.reduce(
      (acc, stateId) =>
        states[stateId].initial ? (this.substates[stateId] as State) : acc,
      undefined
    ) as State;

    this.stateMachine.logger.debug(
      `${this.name} Set initial substate to ${this.initialSubstate}`
    );
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
    this.initialSubstate?.resume(eventName, eventArgs);

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
    const newState = this.substates[newStateName];
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
      try {
        action.call(null, null, eventName, eventArgs);
      } catch (error) {
        this.stateMachine.handleActionError(error, this, eventName, eventArgs);
      }
    }
  }

  processEvent(eventName: SMEvent, eventArgs?: any) {
    if (!this.enabled) {
      return;
    }

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
      this.getGuardsPassingEventDescriptions(eventName, eventArgs),
      eventName
    );

    return descriptions[0];
  }

  validateSingleLegalDescriptions(
    descriptions: Array<EventDescription>,
    eventName: SMEvent
  ) {
    if (descriptions.length > 1) {
      this.stateMachine.handleAmbiguousTransition(this, eventName);
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
    try {
      return actionsAsArray(evDescription.guards).reduce(
        (res, guard) => guard.call(null, null, eventName, eventArgs) && res,
        true
      );
    } catch (error) {
      this.stateMachine.handleGuardError(error, this, eventName, eventArgs);
      return false;
    }
  }

  logProcessEventStart(eventName: SMEvent, eventArgs?: any) {}
}
